import { createClient } from "@/lib/supabase/server";
import type { ConversationItem, Message } from "@/types/message";

type RawConversation = {
  id: string;
  last_message_at: string | null;
  designer: {
    id: string;
    display_name: string;
    profile_image_url: string | null;
    role: string;
  };
};

/**
 * 현재 로그인 유저의 대화 목록을 가져옴.
 * 클라이언트(고객)인 경우와 디자이너인 경우 모두 처리.
 */
export async function getConversations(
  userId: string,
): Promise<ConversationItem[]> {
  const supabase = await createClient();

  // 1) 클라이언트로서 참여한 대화
  const { data: clientConvs } = await supabase
    .from("conversation")
    .select(
      `id, last_message_at,
       designer:designer_id ( id, display_name, profile_image_url, role )`,
    )
    .eq("client_id", userId)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  // 2) 디자이너로서 참여한 대화 (designer_profile.user_id = userId)
  const { data: designerProfile } = await supabase
    .from("designer_profile")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  let designerConvs: RawConversation[] = [];
  if (designerProfile) {
    const { data } = await supabase
      .from("conversation")
      .select(
        `id, last_message_at,
         designer:designer_id ( id, display_name, profile_image_url, role )`,
      )
      .eq("designer_id", designerProfile.id)
      .order("last_message_at", { ascending: false, nullsFirst: false });
    designerConvs = (data ?? []) as unknown as RawConversation[];
  }

  const allConvs = [
    ...((clientConvs ?? []) as unknown as RawConversation[]),
    ...designerConvs,
  ];

  // 중복 제거 (양쪽 역할 모두 해당될 수 없지만 안전장치)
  const seen = new Set<string>();
  const unique = allConvs.filter((c) => {
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });

  // 3) 각 대화의 마지막 메시지 + 안읽은 수 일괄 조회
  const convIds = unique.map((c) => c.id);
  if (convIds.length === 0) return [];

  // 마지막 메시지 1건씩
  const { data: lastMessages } = await supabase
    .from("message")
    .select("conversation_id, content, created_at")
    .in("conversation_id", convIds)
    .order("created_at", { ascending: false });

  // conversation_id → 가장 최근 메시지
  const lastMsgMap = new Map<
    string,
    { content: string; created_at: string }
  >();
  for (const m of lastMessages ?? []) {
    if (!lastMsgMap.has(m.conversation_id)) {
      lastMsgMap.set(m.conversation_id, m);
    }
  }

  // 안 읽은 수 (내가 보내지 않은 + is_read = false)
  const { data: unreadRows } = await supabase
    .from("message")
    .select("conversation_id")
    .in("conversation_id", convIds)
    .neq("sender_id", userId)
    .eq("is_read", false);

  const unreadMap = new Map<string, number>();
  for (const r of unreadRows ?? []) {
    unreadMap.set(r.conversation_id, (unreadMap.get(r.conversation_id) ?? 0) + 1);
  }

  // 4) 도메인 모델로 변환
  return unique
    .map((c): ConversationItem => {
      const last = lastMsgMap.get(c.id);
      return {
        id: c.id,
        designerId: c.designer.id,
        designerName: c.designer.display_name,
        designerProfileImage: c.designer.profile_image_url,
        designerRole: c.designer.role,
        lastMessage: last?.content ?? null,
        lastMessageAt: last?.created_at ?? c.last_message_at,
        unreadCount: unreadMap.get(c.id) ?? 0,
      };
    })
    .sort((a, b) => {
      if (!a.lastMessageAt) return 1;
      if (!b.lastMessageAt) return -1;
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    });
}

/** 대화방 상세 정보 (헤더용 디자이너 정보) */
export type ConversationDetail = {
  id: string;
  designerId: string;
  designerName: string;
  designerProfileImage: string | null;
  designerRole: string;
  designerSalonName: string | null;
};

export async function getConversationDetail(
  conversationId: string,
): Promise<ConversationDetail | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("conversation")
    .select(
      `id,
       designer:designer_id (
         id, display_name, profile_image_url, role,
         salon:salon_id ( name )
       )`,
    )
    .eq("id", conversationId)
    .single();

  if (!data) return null;

  const d = data.designer as unknown as {
    id: string;
    display_name: string;
    profile_image_url: string | null;
    role: string;
    salon: { name: string } | null;
  };

  return {
    id: data.id,
    designerId: d.id,
    designerName: d.display_name,
    designerProfileImage: d.profile_image_url,
    designerRole: d.role,
    designerSalonName: d.salon?.name ?? null,
  };
}

/** 대화방 메시지 목록 (오래된 순) */
export async function getMessages(conversationId: string): Promise<Message[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("message")
    .select(
      "id, conversation_id, sender_id, content, message_type, image_url, is_read, created_at, sender_lang, content_translated",
    )
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  return (data ?? []).map((m) => ({
    id: m.id,
    conversationId: m.conversation_id,
    senderId: m.sender_id,
    content: m.content,
    messageType: (m.message_type ?? "text") as "text" | "image",
    imageUrl: m.image_url ?? null,
    isRead: m.is_read,
    createdAt: m.created_at,
    senderLang: m.sender_lang ?? null,
    contentTranslated: (m.content_translated as Record<string, string> | null) ?? null,
  }));
}
