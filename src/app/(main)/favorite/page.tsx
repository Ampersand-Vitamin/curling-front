"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import FavoriteButton from "@/components/ui/FavoriteButton";
import SegmentedControl from "@/components/ui/SegmentedControl";
import SafeImage from "@/components/SafeImage";
import { createClient } from "@/lib/supabase/client";
import { toggleFavoritePortfolio } from "@/lib/style/actions";

type KeywordChip = { label: string; flag?: string };

type MockDesigner = {
  id: string;
  name: string;
  salon: string;
  keywords: KeywordChip[];
};

type FavoritePortfolio = {
  portfolioId: string;
  imageUrl: string;
  designerId: string;
  designerName: string;
  salonName: string | null;
  profileImageUrl: string | null;
};

const MOCK_DESIGNERS: MockDesigner[] = [
  {
    id: "1",
    name: "Sejin",
    salon: "Salon de Sea",
    keywords: [
      { label: "English", flag: "/images/flags/british.svg" },
      { label: "Curly Hair" },
      { label: "Balayage" },
      { label: "Highlight" },
    ],
  },
  {
    id: "2",
    name: "Mina",
    salon: "Hair Studio M",
    keywords: [
      { label: "Korean", flag: "/images/flags/korean.svg" },
      { label: "Straight" },
      { label: "Color" },
    ],
  },
  {
    id: "3",
    name: "Amy",
    salon: "The Curl Bar",
    keywords: [
      { label: "English", flag: "/images/flags/british.svg" },
      { label: "Wavy Hair" },
      { label: "Perm" },
    ],
  },
];

const TABS = [
  { key: "designer", label: "Designer" },
  { key: "portfolio", label: "Portfolio" },
];

function PlaceholderAvatar({ size }: { size: number }) {
  return (
    <div
      className="rounded-full bg-surface-300 text-surface-500 flex items-center justify-center shrink-0"
      style={{ width: size, height: size, minWidth: size }}
    >
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="9" r="4" />
        <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" />
      </svg>
    </div>
  );
}

function DesignerFavoriteCard({ designer }: { designer: MockDesigner }) {
  return (
    <div className="flex flex-col gap-2.5 w-full">
      <div className="flex items-center gap-2 w-full">
        <PlaceholderAvatar size={40} />
        <div className="flex flex-col flex-1 min-w-0">
          <p className="typo-h4 text-surface-950 truncate">{designer.name}</p>
          <p className="typo-caption text-surface-600 truncate">{designer.salon}</p>
        </div>
        <FavoriteButton virant={48} status="Active" />
      </div>

      <div className="flex gap-1 flex-wrap">
        {designer.keywords.map((kw, i) => (
          <div
            key={i}
            className={`flex items-center h-7 gap-1 rounded-full bg-surface-200 typo-caption text-surface-800 ${
              kw.flag ? "pl-1 pr-2.5" : "px-2"
            }`}
          >
            {kw.flag && (
              <Image src={kw.flag} alt="" width={20} height={20} className="rounded-full object-cover shrink-0" />
            )}
            {kw.label}
          </div>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hidden">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl bg-surface-200 shrink-0"
            style={{ width: 150, height: 180 }}
          />
        ))}
      </div>
    </div>
  );
}

function PortfolioFavoriteCard({
  portfolio,
  onUnfavorite,
}: {
  portfolio: FavoritePortfolio;
  onUnfavorite: (id: string) => void;
}) {
  return (
    <Link
      href={`/portfolio/${portfolio.portfolioId}`}
      className="relative block w-full overflow-hidden rounded-2xl"
    >
      <div className="w-full" style={{ aspectRatio: "3/4" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={portfolio.imageUrl}
          alt={`${portfolio.designerName} portfolio`}
          loading="lazy"
          className="w-full h-full block"
          style={{ objectFit: "cover" }}
        />
      </div>

      <div className="absolute top-2 right-2">
        <FavoriteButton
          virant={32}
          status="Active"
          onClick={(e) => {
            e.preventDefault();
            onUnfavorite(portfolio.portfolioId);
          }}
        />
      </div>

      <div className="absolute inset-x-0 bottom-0 px-2 pt-4 pb-2 bg-gradient-to-t from-surface-950/80 via-surface-950/40 to-transparent">
        <div className="flex items-end gap-2">
          <SafeImage
            src={portfolio.profileImageUrl}
            alt=""
            fallback="profile"
            className="size-8 rounded-full object-cover shrink-0 bg-surface-300"
          />
          <div className="flex-1 min-w-0">
            <p className="typo-body2 text-white truncate">{portfolio.designerName}</p>
            {portfolio.salonName && (
              <p className="typo-caption2 text-white/80 truncate">{portfolio.salonName}</p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function FavoriteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") === "portfolio" ? "portfolio" : "designer"
  );
  const [portfolios, setPortfolios] = useState<FavoritePortfolio[]>([]);
  const [loadingPortfolios, setLoadingPortfolios] = useState(false);

  useEffect(() => {
    if (activeTab !== "portfolio") return;
    const fetch = async () => {
      setLoadingPortfolios(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoadingPortfolios(false); return; }

      // 즐겨찾기 포트폴리오 ID 목록
      const { data: favs } = await supabase
        .from("favorite_portfolio")
        .select("portfolio_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const portfolioIds = (favs ?? []).map((f) => f.portfolio_id as string);
      if (portfolioIds.length === 0) { setPortfolios([]); setLoadingPortfolios(false); return; }

      // 포트폴리오 상세
      const { data: portRows } = await supabase
        .from("designer_portfolio")
        .select("id, image_url, designer_id")
        .in("id", portfolioIds);

      const designerIds = [...new Set((portRows ?? []).map((r) => r.designer_id as string))];
      const { data: profiles } = await supabase
        .from("onboarding_profiles")
        .select("user_id, name, salon_name, avatar_url")
        .in("user_id", designerIds.map((id) => id.toString()));

      const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));

      const result: FavoritePortfolio[] = (portRows ?? []).map((r) => {
        const profile = profileMap.get(r.designer_id as string);
        return {
          portfolioId: r.id as string,
          imageUrl: r.image_url as string,
          designerId: r.designer_id as string,
          designerName: profile?.name ?? "Designer",
          salonName: profile?.salon_name ?? null,
          profileImageUrl: profile?.avatar_url ?? null,
        };
      });

      // 즐겨찾기 순서대로 정렬
      const orderMap = new Map(portfolioIds.map((id, i) => [id, i]));
      result.sort((a, b) => (orderMap.get(a.portfolioId) ?? 0) - (orderMap.get(b.portfolioId) ?? 0));

      setPortfolios(result);
      setLoadingPortfolios(false);
    };
    fetch();
  }, [activeTab]);

  const handleUnfavorite = async (portfolioId: string) => {
    setPortfolios((prev) => prev.filter((p) => p.portfolioId !== portfolioId));
    await toggleFavoritePortfolio(portfolioId);
  };

  return (
    <div className="min-h-full flex flex-col bg-white">
      <div className="sticky top-0 z-20 bg-white pt-16 shrink-0">
        <div className="relative flex items-center justify-center h-6 mx-4">
          <button
            onClick={() => router.back()}
            className="absolute left-0 flex items-center justify-center"
            style={{ width: 24, height: 24 }}
          >
            <img src="/icons/chevron-left.svg" alt="back" width={16} height={16} />
          </button>
          <p className="typo-h6 text-surface-600">Favorite</p>
        </div>
        <SegmentedControl
          tabs={TABS}
          activeKey={activeTab}
          onChange={setActiveTab}
          className="mt-0"
        />
      </div>

      {activeTab === "designer" ? (
        <div className="flex flex-col gap-8 p-4">
          {MOCK_DESIGNERS.map((d) => (
            <DesignerFavoriteCard key={d.id} designer={d} />
          ))}
        </div>
      ) : (
        <div className="p-4">
          {loadingPortfolios ? (
            <div className="flex items-center justify-center py-16">
              <svg width="28" height="28" viewBox="0 0 20 20" fill="none" className="animate-spin text-surface-700">
                <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="2" opacity="0.25" />
                <path d="M17.5 10a7.5 7.5 0 0 0-7.5-7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          ) : portfolios.length === 0 ? (
            <p className="typo-body2 text-surface-400 text-center py-16">
              No saved portfolios yet.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {portfolios.map((p) => (
                <PortfolioFavoriteCard key={p.portfolioId} portfolio={p} onUnfavorite={handleUnfavorite} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function FavoritePage() {
  return (
    <Suspense>
      <FavoriteContent />
    </Suspense>
  );
}
