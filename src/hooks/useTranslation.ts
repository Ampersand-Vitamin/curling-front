"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/types/message";

type UseTranslationOptions = {
  myLang: string;
  enabled?: boolean;
};

type TranslationState = {
  translations: Map<string, string>;
  translating: Set<string>;
  getTranslation: (message: Message) => string | null;
  isTranslating: (messageId: string) => boolean;
};

export function useTranslation(
  messages: Message[],
  { myLang, enabled = true }: UseTranslationOptions,
): TranslationState {
  const [translations, setTranslations] = useState<Map<string, string>>(
    () => new Map(),
  );
  const [translating, setTranslating] = useState<Set<string>>(() => new Set());

  const getTranslation = useCallback(
    (message: Message) =>
      translations.get(message.id) ?? message.contentTranslated?.[myLang] ?? null,
    [myLang, translations],
  );

  const isTranslating = useCallback(
    (messageId: string) => translating.has(messageId),
    [translating],
  );

  useEffect(() => {
    if (!enabled || !myLang) return;

    const supabase = createClient();

    messages.forEach((message) => {
      if (message.messageType !== "text") return;
      if (!message.content.trim()) return;
      if (!message.senderLang || message.senderLang === myLang) return;
      if (message.contentTranslated?.[myLang]) {
        const cachedTranslation = message.contentTranslated[myLang];
        setTranslations((prev) => {
          if (prev.get(message.id) === cachedTranslation) {
            return prev;
          }
          const next = new Map(prev);
          next.set(message.id, cachedTranslation);
          return next;
        });
        return;
      }
      if (translations.has(message.id) || translating.has(message.id)) return;

      setTranslating((prev) => new Set(prev).add(message.id));

      fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: message.content,
          targetLang: myLang,
          sourceLang: message.senderLang,
        }),
      })
        .then(async (res) => {
          if (!res.ok) return null;
          const data = (await res.json()) as { translatedText?: string };
          return data.translatedText ?? null;
        })
        .then(async (translatedText) => {
          if (!translatedText) return;

          const nextTranslated = {
            ...(message.contentTranslated ?? {}),
            [myLang]: translatedText,
          };

          setTranslations((prev) => {
            const next = new Map(prev);
            next.set(message.id, translatedText);
            return next;
          });

          await supabase
            .from("message")
            .update({ content_translated: nextTranslated })
            .eq("id", message.id);
        })
        .catch(() => {
          // Keep the original message visible when translation fails.
        })
        .finally(() => {
          setTranslating((prev) => {
            const next = new Set(prev);
            next.delete(message.id);
            return next;
          });
        });
    });
  }, [enabled, messages, myLang, translating, translations]);

  return useMemo(
    () => ({ translations, translating, getTranslation, isTranslating }),
    [getTranslation, isTranslating, translating, translations],
  );
}
