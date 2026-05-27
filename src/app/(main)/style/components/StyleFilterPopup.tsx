"use client";

import { useState, useMemo } from "react";
import SearchBar from "@/components/ui/SearchBar";
import KeywordFilter from "@/app/(main)/discover/components/KeywordFilter";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type Item = { slug: string; name: string };

// ─────────────────────────────────────────────────────────────
// Filter Data
// ─────────────────────────────────────────────────────────────

const HAIR_TYPES: Item[] = [
  { slug: "curly_hair", name: "Curly Hair" },
  { slug: "coily_hair", name: "Coily Hair" },
  { slug: "wavy_hair", name: "Wavy Hair" },
  { slug: "straight_hair", name: "Straight Hair" },
];

// ── Service ──

const SERVICE_TIER1: Item[] = [
  { slug: "haircut", name: "Haircut" },
  { slug: "coloring", name: "Coloring" },
  { slug: "highlight_service", name: "Highlight" },
  { slug: "perm", name: "Perm" },
  { slug: "straightening", name: "Straightening" },
  { slug: "protective_styles", name: "Protective Styles" },
  { slug: "wigs_extension", name: "Wigs & Extension" },
];

const PERM_SUBTYPES: Item[] = [
  { slug: "s_curl_perm", name: "S Curl Perm" },
  { slug: "c_curl_perm", name: "C Curl Perm" },
  { slug: "cs_curl_perm", name: "CS Curl Perm" },
  { slug: "curly_perm", name: "Curly Perm" },
  { slug: "cloud_perm", name: "Cloud Perm" },
  { slug: "slick_perm", name: "Slick Perm" },
  { slug: "grace_perm", name: "Grace Perm" },
  { slug: "hippie_perm", name: "Hippie Perm" },
];

const STRAIGHTENING_SUBTYPES: Item[] = [
  { slug: "magic_straightening", name: "Magic Straightening" },
  { slug: "japanese_straightening", name: "Japanese Straightening" },
  { slug: "keratin_treatment", name: "Keratin Treatment" },
  { slug: "brazilian_blowout", name: "Brazilian Blowout" },
];

// ── Color ──

type ColorGroup = Item & { subItems: Item[] };

const COLOR_TIER1: ColorGroup[] = [
  {
    slug: "brown", name: "Brown",
    subItems: [
      { slug: "mocha_brown", name: "Mocha Brown" },
      { slug: "butterscotch", name: "Butterscotch" },
      { slug: "light_brown", name: "Light Brown" },
      { slug: "golden_brown", name: "Golden Brown" },
      { slug: "chocolate_brown", name: "Chocolate Brown" },
      { slug: "ash_brown", name: "Ash Brown" },
      { slug: "dark_brown", name: "Dark Brown" },
    ],
  },
  {
    slug: "blonde", name: "Blonde",
    subItems: [
      { slug: "light_blonde", name: "Light Blonde" },
      { slug: "ash_blonde", name: "Ash Blonde" },
      { slug: "almond_blonde", name: "Almond Blonde" },
      { slug: "caramel_blonde", name: "Caramel Blonde" },
      { slug: "honey_blonde", name: "Honey Blonde" },
      { slug: "natural_blonde", name: "Natural Blonde" },
    ],
  },
  {
    slug: "black", name: "Black",
    subItems: [
      { slug: "jet_black", name: "Jet Black" },
      { slug: "off_black", name: "Off Black" },
      { slug: "blue_black", name: "Blue Black" },
    ],
  },
  { slug: "balayage", name: "Balayage", subItems: [] },
  { slug: "highlights", name: "Highlight", subItems: [] },
  { slug: "ombre", name: "Ombre/Sombre", subItems: [] },
];

const COLOR_TIER2: ColorGroup[] = [
  {
    slug: "ginger", name: "Ginger",
    subItems: [
      { slug: "light_ginger", name: "Light Ginger" },
      { slug: "auburn", name: "Auburn" },
      { slug: "copper", name: "Copper" },
      { slug: "light_auburn", name: "Light Auburn" },
    ],
  },
  {
    slug: "grey", name: "Grey",
    subItems: [
      { slug: "platinum", name: "Platinum" },
      { slug: "silver_ash", name: "Silver Ash" },
      { slug: "dark_ash", name: "Dark Ash" },
    ],
  },
  {
    slug: "vivid", name: "Vivid",
    subItems: [
      { slug: "vivid_red", name: "Vivid Red" },
      { slug: "dark_red", name: "Dark Red" },
      { slug: "baby_pink", name: "Baby Pink" },
      { slug: "vivid_pink", name: "Vivid Pink" },
      { slug: "light_purple", name: "Light Purple" },
      { slug: "dark_purple", name: "Dark Purple" },
      { slug: "sky_blue", name: "Sky Blue" },
      { slug: "dark_blue", name: "Dark Blue" },
      { slug: "green_vivid", name: "Green" },
    ],
  },
];

// ── Length ──

const LENGTHS: Item[] = [
  { slug: "short", name: "Short" },
  { slug: "medium", name: "Medium" },
  { slug: "long_hair", name: "Long" },
  { slug: "extra_long", name: "Extra Long" },
];

// ── Style (conditional on Length) ──

const STYLE_SHORT: Item[] = [
  { slug: "pixie", name: "Pixie Cut" },
  { slug: "bob_cut", name: "Bob" },
  { slug: "layered_short", name: "Layered" },
  { slug: "shag", name: "Shag" },
  { slug: "hush_cut", name: "Hush Cut" },
  { slug: "wolf_cut", name: "Wolf Cut" },
  { slug: "bixie_cut", name: "Bixie Cut" },
  { slug: "buzz_cut", name: "Buzz Cut" },
];

const STYLE_LONG: Item[] = [
  { slug: "layered_cut", name: "Layered Cut" },
  { slug: "soft_wolf_cut", name: "Soft Wolf Cut" },
  { slug: "soft_layered", name: "Soft Layered" },
  { slug: "butterfly_cut", name: "Butterfly Cut" },
  { slug: "hush_cut", name: "Hush Cut" },
  { slug: "hime_cut", name: "Hime Cut" },
];

// ── Curly Style (conditional: curly/coily 선택 시) ──

const CURLY_STYLE_TIER1: Item[] = [
  { slug: "deva_cut", name: "Deva Cut" },
  { slug: "rezo_cut", name: "Rezo Cut" },
  { slug: "curly_bob", name: "Curly Bob" },
  { slug: "curly_layers", name: "Curly Layers" },
];

const CURLY_STYLE_TIER2: Item[] = [
  { slug: "ouidad_cut", name: "Ouidad Cut" },
  { slug: "cado_cut", name: "Cadō Cut" },
  { slug: "tunnel_cut", name: "Tunnel Cut" },
  { slug: "curlsys", name: "CURLSYS" },
  { slug: "diametrix_cut", name: "Diametrix Cut" },
];

// ── Protective Styles (conditional) ──

const PROTECTIVE_TIER1: Item[] = [
  { slug: "box_braids", name: "Box Braids" },
  { slug: "knotless_braids", name: "Knotless Braids" },
  { slug: "cornrows", name: "Cornrows" },
  { slug: "two_strand_twists", name: "Two-Strand Twists" },
  { slug: "faux_locs", name: "Faux Locs" },
];

const PROTECTIVE_TIER2: Item[] = [
  { slug: "senegalese_twists", name: "Senegalese Twists" },
  { slug: "passion_twists", name: "Passion Twists" },
  { slug: "spring_twists", name: "Spring Twists" },
  { slug: "marley_twists", name: "Marley Twists" },
  { slug: "stitch_braids", name: "Stitch Braids" },
  { slug: "fulani_braids", name: "Fulani Braids" },
  { slug: "goddess_braids", name: "Goddess Braids" },
  { slug: "butterfly_locs", name: "Butterfly Locs" },
  { slug: "crochet_braids", name: "Crochet Braids" },
  { slug: "bantu_knots", name: "Bantu Knots" },
];

// ── Wigs & Extensions (conditional) ──

const WIGS_TIER1: Item[] = [
  { slug: "lace_front_wig", name: "Lace Front Wig" },
  { slug: "sew_in_weave", name: "Sew-In Weave" },
  { slug: "closure_wig", name: "Closure Wig" },
];

const WIGS_TIER2: Item[] = [
  { slug: "full_lace_wig", name: "Full Lace Wig" },
  { slug: "u_part_wig", name: "U-Part Wig" },
  { slug: "glueless_wig", name: "Glueless Wig" },
  { slug: "tape_in_extensions", name: "Tape-In Extensions" },
  { slug: "clip_in_extensions", name: "Clip-In Extensions" },
];

// ── Mood ──

const MOOD_TIER1: Item[] = [
  { slug: "kpop_idol", name: "K-pop Idol Style" },
  { slug: "everyday_casual", name: "Everyday Casual" },
  { slug: "date_night", name: "Date Night" },
  { slug: "wedding_bridal", name: "Wedding / Bridal" },
  { slug: "office_professional", name: "Office Professional" },
];

const MOOD_TIER2: Item[] = [
  { slug: "festival_concert", name: "Festival / Concert" },
  { slug: "vintage_retro", name: "Vintage / Retro" },
  { slug: "edgy", name: "Edgy" },
  { slug: "romantic", name: "Romantic" },
];

// ─────────────────────────────────────────────────────────────
// slug → name 맵 (선택된 키워드 표시용)
// ─────────────────────────────────────────────────────────────

function buildSlugMap(): Map<string, string> {
  const map = new Map<string, string>();
  const all = [
    ...HAIR_TYPES, ...SERVICE_TIER1, ...PERM_SUBTYPES, ...STRAIGHTENING_SUBTYPES,
    ...COLOR_TIER1, ...COLOR_TIER1.flatMap((c) => c.subItems),
    ...COLOR_TIER2, ...COLOR_TIER2.flatMap((c) => c.subItems),
    ...LENGTHS, ...STYLE_SHORT, ...STYLE_LONG,
    ...CURLY_STYLE_TIER1, ...CURLY_STYLE_TIER2,
    ...PROTECTIVE_TIER1, ...PROTECTIVE_TIER2,
    ...WIGS_TIER1, ...WIGS_TIER2,
    ...MOOD_TIER1, ...MOOD_TIER2,
  ];
  for (const item of all) map.set(item.slug, item.name);
  return map;
}

export const STYLE_SLUG_MAP = buildSlugMap();

// 검색용 전체 아이템 목록
function getAllItems(): (Item & { section: string })[] {
  return [
    ...HAIR_TYPES.map((i) => ({ ...i, section: "Hair Type" })),
    ...SERVICE_TIER1.map((i) => ({ ...i, section: "Service" })),
    ...PERM_SUBTYPES.map((i) => ({ ...i, section: "Service — Perm" })),
    ...STRAIGHTENING_SUBTYPES.map((i) => ({ ...i, section: "Service — Straightening" })),
    ...COLOR_TIER1.map((i) => ({ ...i, section: "Color" })),
    ...COLOR_TIER1.flatMap((c) => c.subItems.map((i) => ({ ...i, section: `Color — ${c.name}` }))),
    ...COLOR_TIER2.map((i) => ({ ...i, section: "Color" })),
    ...COLOR_TIER2.flatMap((c) => c.subItems.map((i) => ({ ...i, section: `Color — ${c.name}` }))),
    ...LENGTHS.map((i) => ({ ...i, section: "Length" })),
    ...STYLE_SHORT.map((i) => ({ ...i, section: "Style" })),
    ...STYLE_LONG.map((i) => ({ ...i, section: "Style" })),
    ...CURLY_STYLE_TIER1.map((i) => ({ ...i, section: "Curly Style" })),
    ...CURLY_STYLE_TIER2.map((i) => ({ ...i, section: "Curly Style" })),
    ...PROTECTIVE_TIER1.map((i) => ({ ...i, section: "Protective Styles" })),
    ...PROTECTIVE_TIER2.map((i) => ({ ...i, section: "Protective Styles" })),
    ...WIGS_TIER1.map((i) => ({ ...i, section: "Wigs & Extensions" })),
    ...WIGS_TIER2.map((i) => ({ ...i, section: "Wigs & Extensions" })),
    ...MOOD_TIER1.map((i) => ({ ...i, section: "Mood" })),
    ...MOOD_TIER2.map((i) => ({ ...i, section: "Mood" })),
  ];
}

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────

function CloseIcon() {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img src="/icons/cancel.svg" alt="" width={14} height={14} />
  );
}

function MoreIcon() {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img src="/icons/more.svg" alt="" width={16} height={16} className="shrink-0" />
  );
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

interface StyleFilterPopupProps {
  activeKeywords: Set<string>;
  onToggle: (slug: string) => void;
  onRemove: (slug: string) => void;
  onClose: () => void;
  onApply?: () => void;
}

export default function StyleFilterPopup({
  activeKeywords,
  onToggle,
  onRemove,
  onClose,
  onApply,
}: StyleFilterPopupProps) {
  const hasSelection = activeKeywords.size > 0;
  const handleApply = onApply ?? onClose;

  const [query, setQuery] = useState("");
  const trimmedQuery = query.trim().toLowerCase();
  const isSearching = trimmedQuery.length > 0;

  // 조건부 섹션 visibility
  const hasCurly = activeKeywords.has("curly_hair");
  const hasCoily = activeKeywords.has("coily_hair");
  const hasCurlyOrCoily = hasCurly || hasCoily;
  const hasShort = activeKeywords.has("short");
  const hasMediumPlus =
    activeKeywords.has("medium") ||
    activeKeywords.has("long_hair") ||
    activeKeywords.has("extra_long");
  const hasPerm = activeKeywords.has("perm");
  const hasStraightening = activeKeywords.has("straightening");
  const showProtective =
    hasCurlyOrCoily || activeKeywords.has("protective_styles");
  const showWigs = hasCoily || activeKeywords.has("wigs_extension");

  // 검색 모드
  const allItems = useMemo(() => getAllItems(), []);
  const searchResults = isSearching
    ? (() => {
        const matched = allItems.filter((i) =>
          i.name.toLowerCase().includes(trimmedQuery),
        );
        const grouped = new Map<string, Item[]>();
        for (const m of matched) {
          if (!grouped.has(m.section)) grouped.set(m.section, []);
          grouped.get(m.section)!.push(m);
        }
        return grouped;
      })()
    : null;

  return (
    <div className="h-full flex flex-col rounded-2xl bg-surface-50/95 backdrop-blur-[10px]">
      {/* 헤더 */}
      <div className="shrink-0 px-[10px] pt-3 pb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setQuery("");
            onClose();
          }}
          aria-label="close"
          className="flex items-center justify-center size-[48px] rounded-full shrink-0 bg-surface-200 text-surface-900"
        >
          <CloseIcon />
        </button>
        <SearchBar
          placeholder="Search Keywords"
          variant="muted"
          value={query}
          onChange={setQuery}
          autoFocus
        />
      </div>

      {/* 스크롤 영역 */}
      <div className="flex-1 min-h-0 overflow-y-auto px-[10px] pb-5">
        {isSearching && searchResults ? (
          <SearchResultsView
            results={searchResults}
            activeKeywords={activeKeywords}
            onToggle={onToggle}
            query={query}
          />
        ) : (
          <div className="flex flex-col">
            {/* 1. Hair Type */}
            <Section title="Hair Type" first>
              <ChipRow items={HAIR_TYPES} active={activeKeywords} onToggle={onToggle} />
            </Section>

            {/* 2. Service */}
            <Section title="Service">
              <ChipRow items={SERVICE_TIER1} active={activeKeywords} onToggle={onToggle} />
              {hasPerm && (
                <SubGroup title="Perm">
                  <ChipRow items={PERM_SUBTYPES} active={activeKeywords} onToggle={onToggle} />
                </SubGroup>
              )}
              {hasStraightening && (
                <SubGroup title="Straightening">
                  <ChipRow
                    items={STRAIGHTENING_SUBTYPES}
                    active={activeKeywords}
                    onToggle={onToggle}
                  />
                </SubGroup>
              )}
            </Section>

            {/* 3. Color */}
            <Section title="Color">
              <ColorSection
                activeKeywords={activeKeywords}
                onToggle={onToggle}
              />
            </Section>

            {/* 4. Length */}
            <Section title="Length">
              <ChipRow items={LENGTHS} active={activeKeywords} onToggle={onToggle} />
            </Section>

            {/* 5. Style (conditional on Length) */}
            {(hasShort || hasMediumPlus) && (
              <Section title="Style">
                {hasShort && (
                  <ChipRow items={STYLE_SHORT} active={activeKeywords} onToggle={onToggle} />
                )}
                {hasMediumPlus && (
                  <ChipRow items={STYLE_LONG} active={activeKeywords} onToggle={onToggle} />
                )}
              </Section>
            )}

            {/* 5-2. Curly Style (conditional: curly/coily) */}
            {hasCurlyOrCoily && (
              <Section title="Curly Style">
                <TieredChips
                  tier1={CURLY_STYLE_TIER1}
                  tier2={CURLY_STYLE_TIER2}
                  active={activeKeywords}
                  onToggle={onToggle}
                />
              </Section>
            )}

            {/* 6. Protective Styles (conditional) */}
            {showProtective && (
              <Section title="Protective Styles">
                <TieredChips
                  tier1={PROTECTIVE_TIER1}
                  tier2={PROTECTIVE_TIER2}
                  active={activeKeywords}
                  onToggle={onToggle}
                />
              </Section>
            )}

            {/* 7. Wigs & Extensions (conditional) */}
            {showWigs && (
              <Section title="Wigs & Extensions">
                <TieredChips
                  tier1={WIGS_TIER1}
                  tier2={WIGS_TIER2}
                  active={activeKeywords}
                  onToggle={onToggle}
                />
              </Section>
            )}

            {/* 8. Mood */}
            <Section title="Mood">
              <TieredChips
                tier1={MOOD_TIER1}
                tier2={MOOD_TIER2}
                active={activeKeywords}
                onToggle={onToggle}
              />
            </Section>
          </div>
        )}
      </div>

      {/* 하단 선택된 키워드 + Apply */}
      {hasSelection && (
        <div className="shrink-0 flex flex-col gap-[10px] border-t border-surface-200 bg-surface-50/95 backdrop-blur-[10px] p-[10px] rounded-b-2xl">
          <div className="flex flex-wrap gap-1">
            {Array.from(activeKeywords).map((slug) => (
              <KeywordFilter
                key={slug}
                label={STYLE_SLUG_MAP.get(slug) ?? slug}
                variant="filled"
                activated
                onRemove={() => onRemove(slug)}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={handleApply}
            className="w-full rounded-full bg-secondary-400 text-white typo-button h-14"
          >
            Apply Selected
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Section Helpers
// ─────────────────────────────────────────────────────────────

function Section({
  title,
  first,
  children,
}: {
  title: string;
  first?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`pt-2 pb-3 flex flex-col gap-2 ${!first ? "border-t-[0.5px] border-surface-200" : ""}`}
    >
      <h3 className="typo-h6 text-surface-900">{title}</h3>
      {children}
    </div>
  );
}

function SubGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-1 ml-1 flex flex-col gap-1.5">
      <span className="typo-caption text-surface-500">{title}</span>
      {children}
    </div>
  );
}

function ChipRow({
  items,
  active,
  onToggle,
}: {
  items: Item[];
  active: Set<string>;
  onToggle: (slug: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item) => (
        <KeywordFilter
          key={item.slug}
          label={item.name}
          variant="filled"
          activated={active.has(item.slug)}
          onClick={() => onToggle(item.slug)}
        />
      ))}
    </div>
  );
}

function TieredChips({
  tier1,
  tier2,
  active,
  onToggle,
}: {
  tier1: Item[];
  tier2: Item[];
  active: Set<string>;
  onToggle: (slug: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const visibleTier2 = expanded
    ? tier2
    : tier2.filter((i) => active.has(i.slug));

  const hiddenCount = tier2.filter((i) => !active.has(i.slug)).length;
  const showToggle = hiddenCount > 0 || expanded;

  return (
    <div className="flex flex-wrap gap-1">
      {tier1.map((item) => (
        <KeywordFilter
          key={item.slug}
          label={item.name}
          variant="filled"
          activated={active.has(item.slug)}
          onClick={() => onToggle(item.slug)}
        />
      ))}
      {visibleTier2.map((item) => (
        <KeywordFilter
          key={item.slug}
          label={item.name}
          variant="filled"
          activated={active.has(item.slug)}
          onClick={() => onToggle(item.slug)}
        />
      ))}
      {showToggle && (
        <KeywordFilter
          label={expanded ? "Less" : "More"}
          variant="outlined"
          onClick={() => setExpanded((p) => !p)}
          leadingIcon={<MoreIcon />}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Color Section (tier 1 → tier 2 → tier 3 conditional sub-items)
// ─────────────────────────────────────────────────────────────

function ColorSection({
  activeKeywords,
  onToggle,
}: {
  activeKeywords: Set<string>;
  onToggle: (slug: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const allColors = [...COLOR_TIER1, ...COLOR_TIER2];

  const visibleTier2 = expanded
    ? COLOR_TIER2
    : COLOR_TIER2.filter((c) => activeKeywords.has(c.slug));
  const hiddenCount = COLOR_TIER2.filter((c) => !activeKeywords.has(c.slug)).length;
  const showToggle = hiddenCount > 0 || expanded;

  // 선택된 색상의 sub-items 표시 (tier 3)
  const selectedColors = allColors.filter(
    (c) => activeKeywords.has(c.slug) && c.subItems.length > 0,
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1">
        {COLOR_TIER1.map((c) => (
          <KeywordFilter
            key={c.slug}
            label={c.name}
            variant="filled"
            activated={activeKeywords.has(c.slug)}
            onClick={() => onToggle(c.slug)}
          />
        ))}
        {visibleTier2.map((c) => (
          <KeywordFilter
            key={c.slug}
            label={c.name}
            variant="filled"
            activated={activeKeywords.has(c.slug)}
            onClick={() => onToggle(c.slug)}
          />
        ))}
        {showToggle && (
          <KeywordFilter
            label={expanded ? "Less" : "More"}
            variant="outlined"
            onClick={() => setExpanded((p) => !p)}
            leadingIcon={<MoreIcon />}
          />
        )}
      </div>

      {/* Tier 3: 선택된 색상의 세부 톤 */}
      {selectedColors.map((color) => (
        <SubGroup key={color.slug} title={color.name}>
          <div className="flex flex-wrap gap-1">
            {color.subItems.map((sub) => (
              <KeywordFilter
                key={sub.slug}
                label={sub.name}
                variant="filled"
                activated={activeKeywords.has(sub.slug)}
                onClick={() => onToggle(sub.slug)}
              />
            ))}
          </div>
        </SubGroup>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Search Results View
// ─────────────────────────────────────────────────────────────

function SearchResultsView({
  results,
  activeKeywords,
  onToggle,
  query,
}: {
  results: Map<string, Item[]>;
  activeKeywords: Set<string>;
  onToggle: (slug: string) => void;
  query: string;
}) {
  if (results.size === 0) {
    return (
      <p className="pt-6 typo-body2 text-surface-500 text-center">
        No keywords match &ldquo;{query}&rdquo;
      </p>
    );
  }

  const entries = Array.from(results.entries());

  return (
    <div className="flex flex-col">
      {entries.map(([sectionName, items], idx) => (
        <div
          key={sectionName}
          className={`pt-2 pb-3 flex flex-col gap-2 ${idx > 0 ? "border-t-[0.5px] border-surface-200" : ""}`}
        >
          <h3 className="typo-h6 text-surface-900">{sectionName}</h3>
          <div className="flex flex-wrap gap-1">
            {items.map((item) => (
              <KeywordFilter
                key={item.slug}
                label={item.name}
                variant="filled"
                activated={activeKeywords.has(item.slug)}
                onClick={() => onToggle(item.slug)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
