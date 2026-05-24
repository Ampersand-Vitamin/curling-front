// Design Ref: §4.3 — designer-detail
// Plan FR-16
//
// 캐러셀(Best Match for you)용 + MapView designer-mode 마커용.
// 기존 src/lib/designers.ts 의 getDesignerMapItems 를 본 파일로 이전.

import { supabase } from "@/lib/supabase";
import type {
  DesignerListItem,
  DesignerMapItem,
  DesignerPortfolioPreview,
} from "./types";

type RawListRow = {
  id: string;
  display_name: string;
  role: string;
  profile_image_url: string | null;
  languages: string[];
  highlight_message: string | null;
  salon_id: string | null;
  salon: { latitude: number | string; longitude: number | string } | null;
  designer_keyword:
    | { keyword: { slug: string } | null }[]
    | null;
};

type RawPortfolioRow = {
  designer_id: string;
  image_path: string;
  keywords: string[] | null;
};

const LIST_SELECT = `
  id, display_name, role, profile_image_url,
  languages, highlight_message, salon_id,
  salon:salon_id ( latitude, longitude ),
  designer_keyword ( keyword:keyword_id ( slug ) )
`;

function toListItem(
  r: RawListRow,
  portfolioPreviews: DesignerPortfolioPreview[] = [],
): DesignerListItem {
  const keywordSlugs = (r.designer_keyword ?? [])
    .map((row) => row.keyword?.slug)
    .filter((s): s is string => Boolean(s));
  const salonLatLng = r.salon
    ? { lat: Number(r.salon.latitude), lng: Number(r.salon.longitude) }
    : null;
  return {
    id: r.id,
    displayName: r.display_name,
    role: r.role,
    profileImageUrl: r.profile_image_url,
    portfolioImages: portfolioPreviews.map((p) => p.imagePath),
    portfolioPreviews,
    languages: r.languages ?? [],
    highlightMessage: r.highlight_message,
    salonId: r.salon_id,
    salonLatLng,
    keywordSlugs,
  };
}

async function attachPortfolioPreviews(
  rows: RawListRow[],
  caller: string,
): Promise<DesignerListItem[]> {
  if (rows.length === 0) return [];

  const designerIds = rows.map((r) => r.id);
  const { data, error } = await supabase
    .from("portfolio")
    .select("designer_id, image_path, keywords")
    .in("designer_id", designerIds)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`[${caller}:portfolio] ${error.message}`);
  }

  const previewsByDesigner = new Map<string, DesignerPortfolioPreview[]>();
  for (const row of (data ?? []) as RawPortfolioRow[]) {
    const previews = previewsByDesigner.get(row.designer_id) ?? [];
    previews.push({
      imagePath: row.image_path,
      keywordSlugs: row.keywords ?? [],
    });
    previewsByDesigner.set(row.designer_id, previews);
  }

  return rows.map((r) => toListItem(r, previewsByDesigner.get(r.id) ?? []));
}

/**
 * Discover 캐러셀용 디자이너 리스트.
 * 정렬은 임시로 created_at DESC. 추천 알고리즘은 별도 PDCA에서 본문만 교체.
 */
export async function getBestMatchDesigners(
  limit = 10,
): Promise<DesignerListItem[]> {
  const { data, error } = await supabase
    .from("designer_profile")
    .select(LIST_SELECT)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`[getBestMatchDesigners] ${error.message}`);
  }

  return attachPortfolioPreviews(
    (data ?? []) as unknown as RawListRow[],
    "getBestMatchDesigners",
  );
}

/**
 * 특정 살롱에 소속된 디자이너 전체 리스트.
 * Discover 디자이너 핀 클릭 시 popup에 노출되는 카드 데이터로 사용.
 * 클라이언트에서 on-demand로 호출됨.
 */
export async function getDesignersBySalon(
  salonId: string,
): Promise<DesignerListItem[]> {
  const { data, error } = await supabase
    .from("designer_profile")
    .select(LIST_SELECT)
    .eq("salon_id", salonId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`[getDesignersBySalon] ${error.message}`);
  }

  return attachPortfolioPreviews(
    (data ?? []) as unknown as RawListRow[],
    "getDesignersBySalon",
  );
}

// ─────────────────────────────────────────────────────────────────
// 기존 src/lib/designers.ts 본문 (디자이너 모드 지도 마커)
// 이 파일로 그대로 이전. import 경로 호환을 위해 index.ts 에서 re-export.
// ─────────────────────────────────────────────────────────────────

type RawMapRow = {
  id: string;
  name: string;
  latitude: number | string;
  longitude: number | string;
  designer_count: number;
};

/**
 * 디자이너 모드 지도 마커 데이터.
 * designer_count > 0 인 살롱만 반환.
 */
export async function getDesignerMapItems(): Promise<DesignerMapItem[]> {
  const { data, error } = await supabase
    .from("salon")
    .select("id, name, latitude, longitude, designer_count")
    .gt("designer_count", 0);

  if (error) {
    throw new Error(`[getDesignerMapItems] ${error.message}`);
  }

  const rows = (data ?? []) as RawMapRow[];

  return rows.map<DesignerMapItem>((r) => ({
    salonId: r.id,
    salonName: r.name,
    latitude: Number(r.latitude),
    longitude: Number(r.longitude),
    designerCount: r.designer_count,
  }));
}
