"use server";

import { createClient } from "@/lib/supabase/server";
import type { FavoriteTargetType } from "./types";

export async function toggleFavorite(
  targetType: FavoriteTargetType,
  targetId: string,
): Promise<{ isFavorite: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // Check if already favorited
  const { data: existing } = await supabase
    .from("favorite")
    .select("id")
    .eq("user_id", user.id)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .maybeSingle();

  if (existing) {
    await supabase.from("favorite").delete().eq("id", existing.id);
    return { isFavorite: false };
  }

  await supabase.from("favorite").insert({
    user_id: user.id,
    target_type: targetType,
    target_id: targetId,
  });

  return { isFavorite: true };
}
