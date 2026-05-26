export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { relativeTime } from "@/lib/relativeTime";
import { FavoriteDesignerItem } from "@/components/chat/FavoriteDesignerItem";
import { RecentChatItem } from "@/components/chat/RecentChatItem";
import { StartConversationRow } from "@/components/chat/StartConversationRow";

type Profile = {
  user_id: string;
  name: string;
  salon_name: string | null;
  avatar_url: string | null;
  account_mode: string | null;
};
type Conversation = { id: string; designer_id: string; last_message_at: string | null; status: string };
type Message = { conversation_id: string; content: string; created_at: string; is_read: boolean; sender_id: string };
type FavoriteDesigner = { designer_id: string };

export default async function MessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  // 내 대화 목록
  const { data: convData } = await supabase
    .from("conversation")
    .select("id, designer_id, last_message_at, status")
    .eq("client_id", user.id)
    .eq("status", "active")
    .order("last_message_at", { ascending: false, nullsFirst: false });

  const conversations: Conversation[] = convData ?? [];

  // 즐겨찾기 디자이너
  const { data: favData } = await supabase
    .from("favorite_designer")
    .select("designer_id")
    .eq("user_id", user.id);

  const favoriteDesigners: FavoriteDesigner[] = favData ?? [];

  // 대화 + 즐겨찾기 프로필 한 번에 조회 (salon_name 포함)
  const allDesignerIds = [
    ...new Set([
      ...conversations.map((c) => c.designer_id),
      ...favoriteDesigners.map((f) => f.designer_id),
    ]),
  ];

  // salon_name은 컬럼이 없을 수 있으므로 에러 시 없이 재시도
  let profileData: Profile[] = [];
  if (allDesignerIds.length > 0) {
    const { data, error } = await supabase
      .from("onboarding_profiles")
      .select("user_id, name, salon_name, avatar_url, account_mode")
      .in("user_id", allDesignerIds);
    if (!error) {
      profileData = (data ?? []) as Profile[];
    } else {
      const { data: fallback } = await supabase
        .from("onboarding_profiles")
        .select("user_id, name, avatar_url, account_mode")
        .in("user_id", allDesignerIds);
      profileData = ((fallback ?? []) as Omit<Profile, "salon_name">[]).map(
        (p) => ({ ...p, salon_name: null })
      );
    }
  }

  const profileMap = new Map<string, Profile>(
    profileData.map((p) => [p.user_id, p])
  );

  // 각 대화의 최신 메시지 1개씩
  const convIds = conversations.map((c) => c.id);
  const { data: msgData } = convIds.length > 0
    ? await supabase
        .from("message")
        .select("conversation_id, content, created_at, is_read, sender_id")
        .in("conversation_id", convIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const lastMsgMap = new Map<string, Message>();
  for (const msg of (msgData ?? []) as Message[]) {
    if (!lastMsgMap.has(msg.conversation_id)) {
      lastMsgMap.set(msg.conversation_id, msg);
    }
  }

  // 추천 디자이너 — conversations가 없으면 NOT IN 생략
  const recommendedQuery = supabase
    .from("onboarding_profiles")
    .select("user_id, name, salon_name, avatar_url")
    .eq("account_mode", "designer")
    .limit(3);

  const rawRecommended = conversations.length > 0
    ? await recommendedQuery.not("user_id", "in", `(${conversations.map((c) => c.designer_id).join(",")})`)
    : await recommendedQuery;

  // salon_name 컬럼 없을 때 fallback
  let recommended: Profile[] = [];
  if (!rawRecommended.error) {
    recommended = (rawRecommended.data ?? []) as Profile[];
  } else {
    const { data: fallback } = await supabase
      .from("onboarding_profiles")
      .select("user_id, name, avatar_url")
      .eq("account_mode", "designer")
      .limit(3);
    recommended = ((fallback ?? []) as Omit<Profile, "salon_name" | "account_mode">[]).map(
      (p) => ({ ...p, salon_name: null, account_mode: "designer" })
    );
  }

  const hasFavorites = favoriteDesigners.length > 0;
  const hasChats = conversations.length > 0;

  return (
    <div className="bg-white min-h-full flex flex-col">

      {/* 헤더 */}
      <div className="sticky top-0 z-20 bg-white pt-16 pb-[10px]">
        <p className="typo-h6 text-surface-600 text-center">Messages</p>
      </div>

      {/* 컨텐츠 */}
      <div className="flex flex-col px-4 pb-8 gap-6">

        {/* ── Favorite designers ── */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="typo-h5 text-surface-950">Favorite designers</p>
            {hasFavorites && (
              <Link href="/favorite" className="typo-caption text-surface-400">
                view all
              </Link>
            )}
          </div>

          {hasFavorites ? (
            <div className="flex gap-4 overflow-x-auto pb-1 -mx-4 px-4">
              {favoriteDesigners.map((fav) => {
                const profile = profileMap.get(fav.designer_id);
                return (
                  <FavoriteDesignerItem
                    key={fav.designer_id}
                    designerId={fav.designer_id}
                    name={profile?.name ?? ""}
                    avatarUrl={profile?.avatar_url ?? null}
                  />
                );
              })}
            </div>
          ) : (
            <Link
              href="/discover"
              className="flex items-center justify-center gap-2 w-full h-11 bg-surface-100 rounded-lg typo-body2 text-surface-500"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              Find Designers
            </Link>
          )}
        </section>

        {/* ── Recent chats ── */}
        <section className="flex flex-col gap-3">
          <p className="typo-h5 text-surface-950">Recent chats</p>

          {hasChats ? (
            <div className="flex flex-col divide-y divide-surface-100">
              {conversations.map((conv) => {
                const profile = profileMap.get(conv.designer_id);
                const lastMsg = lastMsgMap.get(conv.id);
                const hasNew = !!lastMsg && !lastMsg.is_read && lastMsg.sender_id !== user.id;
                return (
                  <RecentChatItem
                    key={conv.id}
                    conversationId={conv.id}
                    name={profile?.name ?? ""}
                    salonName={profile?.salon_name ?? ""}
                    avatarUrl={profile?.avatar_url ?? null}
                    lastMessage={lastMsg?.content ?? ""}
                    timeLabel={relativeTime(lastMsg?.created_at ?? conv.last_message_at)}
                    hasNew={hasNew}
                  />
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-10">
              <p className="typo-body2 text-surface-400 text-center py-10">
                You don&apos;t have chat history yet.
              </p>

              {/* 추천 디자이너 */}
              {recommended.length > 0 && (
                <section className="flex flex-col gap-3">
                  <p className="typo-h5 text-surface-950">Recommended designers</p>
                  <div className="flex flex-col gap-4">
                    {recommended.map((designer) => (
                      <StartConversationRow
                        key={designer.user_id}
                        designerId={designer.user_id}
                        name={designer.name ?? ""}
                        salonName={designer.salon_name ?? ""}
                        avatarUrl={designer.avatar_url ?? null}
                        myId={user.id}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
