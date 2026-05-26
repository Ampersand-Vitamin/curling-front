"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  content_translated: Record<string, string> | null;
  is_quick_reply: boolean;
  sender_lang: string | null;
  created_at: string;
};

export function useChat(conversationId: string, myLang: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = createClient();

  // 번역 요청 — API 실패 시 null 반환 (잘못된 값 캐싱 방지)
  const translate = useCallback(async (text: string, sourceLang: string): Promise<string | null> => {
    if (sourceLang === myLang) return text;
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, targetLang: myLang, sourceLang }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.translatedText ?? null;
    } catch {
      return null;
    }
  }, [myLang]);

  // content_translated 업데이트
  const updateTranslation = useCallback(async (msg: Message) => {
    if (!msg.sender_lang || msg.sender_lang === myLang) return;
    if (msg.content_translated?.[myLang]) return; // 이미 번역됨

    const translatedText = await translate(msg.content, msg.sender_lang);
    if (!translatedText) return; // API 실패 시 캐싱 안 함

    const next: Record<string, string> = {
      ...(msg.content_translated ?? {}),
      [myLang]: translatedText,
    };

    await supabase
      .from("message")
      .update({ content_translated: next })
      .eq("id", msg.id);

    setMessages((prev) =>
      prev.map((m) =>
        m.id === msg.id ? { ...m, content_translated: next } : m
      )
    );
  }, [myLang, translate, supabase]);

  // 초기 메시지 로드
  useEffect(() => {
    if (!conversationId) return;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("message")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      const msgs = (data ?? []) as Message[];
      setMessages(msgs);
      setLoading(false);
    };
    load();
  }, [conversationId]); // eslint-disable-line react-hooks/exhaustive-deps

  // myLang 확정 후(또는 변경 시) + 메시지 로드 완료 시 미번역 메시지 일괄 처리
  // — [myLang, messages.length] 둘 다 감지:
  //   1) myLang 'ko'→'en' 시점에 이미 messages 있으면 바로 번역
  //   2) myLang 변경 후 messages가 로드되면(0→N) 그 때 번역
  useEffect(() => {
    if (!conversationId || messages.length === 0) return;
    messages.forEach((m) => updateTranslation(m));
  }, [myLang, messages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Realtime 구독
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "message",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          setMessages((prev) => [...prev, msg]);
          updateTranslation(msg);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "message",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updated = payload.new as Message;
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? updated : m))
          );
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [conversationId]); // eslint-disable-line react-hooks/exhaustive-deps

  // 메시지 전송
  const sendMessage = useCallback(
    async (content: string, senderLang: string, isQuickReply = false) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("message").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content,
        sender_lang: senderLang,
        is_quick_reply: isQuickReply,
      });

      // conversation.last_message_at 갱신
      await supabase
        .from("conversation")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversationId);
    },
    [conversationId, supabase]
  );

  return { messages, loading, sendMessage };
}
