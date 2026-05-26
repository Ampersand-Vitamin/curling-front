"use client";

import { useState, useTransition, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toggleFavorite } from "@/lib/favorites/actions";

export function useFavoriteToggle(designerId: string) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("favorite")
        .select("id")
        .eq("user_id", user.id)
        .eq("target_type", "designer")
        .eq("target_id", designerId)
        .maybeSingle()
        .then(({ data }) => {
          setIsFavorite(!!data);
        });
    });
  }, [designerId]);

  return {
    isFavorite,
    toggle: () => {
      startTransition(async () => {
        const result = await toggleFavorite("designer", designerId);
        setIsFavorite(result.isFavorite);
      });
    },
    isLoading: isPending,
  };
}
