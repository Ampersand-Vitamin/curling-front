"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type PortfolioItem = {
  id: string;
  image_url: string;
  designer_id: string;
};

type Props = {
  mode: "designer" | "favorite";
  designerId?: string;
  selected: string[];
  onToggle: (url: string) => void;
  onBack: () => void;
};

function SkeletonCard() {
  return (
    <div
      className="rounded-lg bg-surface-300 animate-pulse"
      style={{ height: 156 }}
    />
  );
}

function PortfolioCard({
  item,
  isSelected,
  onToggle,
}: {
  item: PortfolioItem;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="rounded-lg overflow-hidden relative"
      style={{ height: 156 }}
    >
      <img
        src={item.image_url}
        alt=""
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />
      {/* Selection indicator */}
      <div className="absolute top-2 right-2 z-10">
        <div
          className="size-4 rounded-full transition-colors"
          style={{
            border: "2px solid white",
            backgroundColor: isSelected ? "white" : "transparent",
          }}
        />
      </div>
    </button>
  );
}

export function PortfolioPickerPanel({
  mode,
  designerId,
  selected,
  onToggle,
  onBack,
}: Props) {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      if (mode === "designer" && designerId) {
        const { data: portfolios } = await supabase
          .from("designer_portfolio")
          .select("id, image_url, designer_id")
          .eq("designer_id", designerId)
          .limit(12);

        setItems(
          (portfolios ?? []).map((p) => ({
            id: p.id as string,
            image_url: p.image_url as string,
            designer_id: p.designer_id as string,
          }))
        );
      } else if (mode === "favorite") {
        const { data: favs } = await supabase
          .from("favorite_portfolio")
          .select("portfolio_id")
          .eq("user_id", user.id)
          .limit(12);

        if (!favs || favs.length === 0) {
          setLoading(false);
          return;
        }

        const portfolioIds = favs.map((f) => f.portfolio_id);
        const { data: portfolios } = await supabase
          .from("designer_portfolio")
          .select("id, image_url, designer_id")
          .in("id", portfolioIds);

        if (!portfolios || portfolios.length === 0) {
          setLoading(false);
          return;
        }

        setItems(
          portfolios.map((p) => ({
            id: p.id as string,
            image_url: p.image_url as string,
            designer_id: p.designer_id as string,
          }))
        );
      }

      setLoading(false);
    };
    load();
  }, [mode, designerId]);

  const title = mode === "designer" ? "Designer's Portfolio" : "My Favorite";

  return (
    <div className="flex flex-col gap-3" style={{ height: 280 }}>
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="flex items-center justify-center size-6"
          >
            <img src="/icons/chevron-left.svg" alt="back" width={16} height={16} />
          </button>
          <p className="typo-h4 text-surface-950">{title}</p>
        </div>
        {selected.length > 0 && (
          <p className="typo-caption text-surface-500 capitalize">
            {selected.length} selected
          </p>
        )}
      </div>

      {/* Grid */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
        {loading ? (
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : items.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="typo-body2 text-surface-400">No portfolios found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {items.map((item) => (
              <PortfolioCard
                key={item.id}
                item={item}
                isSelected={selected.includes(item.image_url)}
                onToggle={() => onToggle(item.image_url)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
