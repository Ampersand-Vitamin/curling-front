// Design Ref: MapView 디자이너 모드 마커용 — 살롱별 디자이너 수 집계
// 현재는 salon.designer_count 컬럼(디노멀라이즈) 활용. 실시간 정확도 필요 시 COUNT JOIN으로 전환.
import { supabase } from "./supabase";

export type DesignerMapItem = {
  salonId: string;
  salonName: string;
  latitude: number;
  longitude: number;
  designerCount: number;
};

type RawRow = {
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

  const rows = (data ?? []) as RawRow[];

  return rows.map<DesignerMapItem>((r) => ({
    salonId: r.id,
    salonName: r.name,
    latitude: Number(r.latitude),
    longitude: Number(r.longitude),
    designerCount: r.designer_count,
  }));
}
