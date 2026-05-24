// Design Ref: §4.2 — FilterPopup이 바로 렌더 가능한 형태로 서버에서 shape 완료
// Plan FR-02, DS-1, DS-5
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
import type {
  FilterCategorySlug,
  FilterSection,
  Keyword,
  KeywordGroup,
} from "@/types/keyword";
import {
  FILTER_SECTION_DISPLAY_NAME,
  FILTER_SECTION_ORDER,
} from "@/types/keyword";

type RawKeywordRow = {
  id: string;
  name: string;
  slug: string;
  group_name: string | null;
  display_order: number;
  tier: number;
};

type RawCategoryRow = {
  slug: FilterCategorySlug;
  name: string;
  keyword: RawKeywordRow[] | null;
};

/**
 * FilterPopup이 렌더할 섹션들을 서버에서 완성된 형태로 반환.
 * filter spec v3: languages / specialty / service / amenities / inclusivity 순서 고정.
 * 클라이언트 useMemo 없이 props만으로 렌더 가능.
 */
export async function getFilterKeywords(): Promise<FilterSection[]> {
  const { data, error } = await supabase
    .from("keyword_category")
    .select(
      `
      slug,
      name,
      keyword ( id, name, slug, group_name, display_order, tier )
    `,
    )
    .in("slug", FILTER_SECTION_ORDER as unknown as string[]);

  if (error) {
    throw new Error(`[getFilterKeywords] ${error.message}`);
  }

  const rows = (data ?? []) as unknown as RawCategoryRow[];

  // Plan FR-05: 반환 순서를 FILTER_SECTION_ORDER로 강제
  return FILTER_SECTION_ORDER.map((catSlug) => buildSection(catSlug, rows));
}

function buildSection(
  catSlug: FilterCategorySlug,
  rows: RawCategoryRow[],
): FilterSection {
  const row = rows.find((r) => r.slug === catSlug);
  const keywords: Keyword[] = (row?.keyword ?? [])
    .map<Keyword>((k) => ({
      id: k.id,
      name: k.name,
      slug: k.slug,
      group_name: k.group_name,
      display_order: k.display_order,
      tier: k.tier === 2 ? 2 : 1,
    }))
    .sort((a, b) => a.display_order - b.display_order);

  const displayName = FILTER_SECTION_DISPLAY_NAME[catSlug];

  // service 카테고리만 group_name 기준 2단계 그룹핑 (Perm/Straightening/Protective/Wigs)
  if (catSlug === "service") {
    return {
      slug: catSlug,
      displayName,
      groups: groupByGroupName(keywords),
    };
  }

  return { slug: catSlug, displayName, keywords };
}

/**
 * Design §4.2 — 각 그룹의 최소 display_order로 그룹 순서 결정.
 * Cut(10~) → Color(60~) → Perm(100~) → Braids&Locs(130~) → Care(170~) → Barber(200~)
 */
function groupByGroupName(keywords: Keyword[]): KeywordGroup[] {
  const map = new Map<string, Keyword[]>();
  for (const k of keywords) {
    const key = k.group_name ?? "Other";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(k);
  }

  return Array.from(map.entries())
    .sort(
      ([, a], [, b]) =>
        Math.min(...a.map((k) => k.display_order)) -
        Math.min(...b.map((k) => k.display_order)),
    )
    .map(([group_name, groupKeywords]) => ({
      group_name,
      keywords: groupKeywords,
    }));
}
