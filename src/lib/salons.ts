// Design Ref: MapView 핀 마커용 살롱 데이터 서버 fetch
import { supabase } from "./supabase";
import type { Salon } from "@/types/salon";

type RawSalonRow = {
  id: string;
  name: string;
  address: string;
  latitude: number | string; // DB DECIMAL → JS는 string으로 올 수 있음
  longitude: number | string;
  phone: string | null;
};

/**
 * Discover 탭 지도 마커용 살롱 전체 조회.
 * 추후 범위 쿼리(반경/bbox)는 PostGIS 도입 시 확장.
 */
export async function getSalons(): Promise<Salon[]> {
  const { data, error } = await supabase
    .from("salon")
    .select("id, name, address, latitude, longitude, phone");

  if (error) {
    throw new Error(`[getSalons] ${error.message}`);
  }

  const rows = (data ?? []) as RawSalonRow[];

  return rows.map<Salon>((r) => ({
    id: r.id,
    name: r.name,
    address: r.address,
    latitude: Number(r.latitude),
    longitude: Number(r.longitude),
    phone: r.phone ?? undefined,
  }));
}
