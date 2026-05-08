// Design Ref: §4.3 — designer-detail
// Plan FR-16
//
// 캐러셀(Best Match for you)용 + MapView designer-mode 마커용.
// 기존 src/lib/designers.ts 의 getDesignerMapItems 를 본 파일로 이전.

import { supabase } from "@/lib/supabase";
import type { DesignerListItem, DesignerMapItem } from "./types";

type RawListRow = {
  id: string;
  display_name: string;
  role: string;
  profile_image_url: string | null;
  portfolio_images: string[];
  languages: string[];
  highlight_message: string | null;
  salon_id: string | null;
};

/**
 * Discover 캐러셀용 디자이너 리스트.
 * 정렬은 임시로 created_at DESC. 추천 알고리즘은 별도 PDCA에서 본문만 교체.
 */
export async function getBestMatchDesigners(
  limit = 10,
): Promise<DesignerListItem[]> {
  const { data, error } = await supabase
    .from("designer_profile")
    .select(
      `id, display_name, role, profile_image_url, portfolio_images,
       languages, highlight_message, salon_id`,
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`[getBestMatchDesigners] ${error.message}`);
  }

  return (data ?? []).map<DesignerListItem>((r: RawListRow) => ({
    id: r.id,
    displayName: r.display_name,
    role: r.role,
    profileImageUrl: r.profile_image_url,
    portfolioImages: r.portfolio_images ?? [],
    languages: r.languages ?? [],
    highlightMessage: r.highlight_message,
    salonId: r.salon_id,
  }));
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
    .select(
      `id, display_name, role, profile_image_url, portfolio_images,
       languages, highlight_message, salon_id`,
    )
    .eq("salon_id", salonId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`[getDesignersBySalon] ${error.message}`);
  }

  return (data ?? []).map<DesignerListItem>((r: RawListRow) => ({
    id: r.id,
    displayName: r.display_name,
    role: r.role,
    profileImageUrl: r.profile_image_url,
    portfolioImages: r.portfolio_images ?? [],
    languages: r.languages ?? [],
    highlightMessage: r.highlight_message,
    salonId: r.salon_id,
  }));
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
