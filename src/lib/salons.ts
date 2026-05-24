// Design Ref: MapView 핀 마커용 살롱 데이터 서버 fetch
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
import type { Salon } from "@/types/salon";

type RawSalonRow = {
  id: string;
  name: string;
  address: string;
  latitude: number | string; // DB DECIMAL → JS는 string으로 올 수 있음
  longitude: number | string;
  phone: string | null;
  salon_keyword: { keyword: { slug: string } | null }[] | null;
};

/**
 * Discover 탭 지도 마커 + PullBar 살롱 캐러셀 매칭용 살롱 전체 조회.
 * salon_keyword 를 nested join 으로 함께 가져와 클라이언트 필터 매칭에 사용.
 * 추후 범위 쿼리(반경/bbox)는 PostGIS 도입 시 확장.
 */
export async function getSalons(): Promise<Salon[]> {
  const { data, error } = await supabase
    .from("salon")
    .select(
      `id, name, address, latitude, longitude, phone,
       salon_keyword ( keyword:keyword_id ( slug ) )`,
    );

  if (error) {
    throw new Error(`[getSalons] ${error.message}`);
  }

  const rows = (data ?? []) as unknown as RawSalonRow[];

  return rows.map<Salon>((r) => {
    const keywordSlugs = (r.salon_keyword ?? [])
      .map((row) => row.keyword?.slug)
      .filter((s): s is string => Boolean(s));
    return {
      id: r.id,
      name: r.name,
      address: r.address,
      latitude: Number(r.latitude),
      longitude: Number(r.longitude),
      phone: r.phone ?? undefined,
      keywordSlugs,
    };
  });
}
