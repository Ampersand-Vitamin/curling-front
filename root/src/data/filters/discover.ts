/**
 * Discover Filter Data
 *
 * Filters used in the Discover tab to search for stylists/salons.
 * See docs reference: filter-system.md
 *
 * Structure:
 * - Tier 1 categories: always visible in modal
 * - Tier 2 categories: revealed via "More"
 * - Within each category, options have their own tier (1 = visible, 2 = More)
 */

export type FilterOption = {
  id: string;
  label: string;
};

export type FilterCategory = {
  id: string;
  name: string;
  tier: 1 | 2;
  description?: string;
  options: {
    tier1: FilterOption[];
    tier2?: FilterOption[];
  };
  // For categories with sub-options that open on parent selection
  subCategories?: {
    parentId: string;
    options: FilterOption[];
  }[];
};

// ─────────────────────────────────────────────
// 1. Language (Tier 1)
// ─────────────────────────────────────────────
export const language: FilterCategory = {
  id: 'language',
  name: 'Language',
  tier: 1,
  description: 'Default selection follows user onboarding preferences',
  options: {
    tier1: [
      { id: 'english', label: 'English' },
      { id: 'korean', label: 'Korean' },
      { id: 'japanese', label: 'Japanese' },
      { id: 'chinese-mandarin', label: 'Chinese (Mandarin)' },
    ],
    tier2: [
      { id: 'spanish', label: 'Spanish' },
      { id: 'french', label: 'French' },
      { id: 'vietnamese', label: 'Vietnamese' },
      { id: 'russian', label: 'Russian' },
      { id: 'arabic', label: 'Arabic' },
    ],
  },
};

// ─────────────────────────────────────────────
// 2. Specialty (Tier 1)
// ─────────────────────────────────────────────
export const specialty: FilterCategory = {
  id: 'specialty',
  name: 'Specialty',
  tier: 1,
  description: 'Labels intentionally vary in form to preserve how salons describe their differentiation',
  options: {
    tier1: [
      { id: 'curly-hair-expert', label: 'Curly Hair Expert' },
      { id: 'coily-hair-expert', label: 'Coily Hair Expert' },
      { id: 'kpop-style', label: 'K-pop Style' },
      { id: 'highlight-specialist', label: 'Highlight Specialist' },
      { id: 'head-spa', label: 'Head Spa' },
    ],
    tier2: [
      { id: 'bridal-specialist', label: 'Bridal Specialist' },
      { id: 'mens-cut-specialist', label: "Men's Cut Specialist" },
      { id: 'childrens-cut', label: "Children's Cut" },
      { id: 'senior-friendly', label: 'Senior-friendly' },
      { id: 'fine-hair-expert', label: 'Fine Hair Expert' },
      { id: 'damaged-hair-repair', label: 'Damaged Hair Repair' },
    ],
  },
};

// ─────────────────────────────────────────────
// 3. Service (Tier 1)
// Includes sub-categories for Perm, Straightening, Protective Styles, Wigs & Extensions
// ─────────────────────────────────────────────
export const service: FilterCategory = {
  id: 'service',
  name: 'Service',
  tier: 1,
  options: {
    tier1: [
      { id: 'haircut', label: 'Haircut' },
      { id: 'coloring', label: 'Coloring' },
      { id: 'highlight', label: 'Highlight' },
      { id: 'perm', label: 'Perm' }, // opens sub-category
      { id: 'straightening', label: 'Straightening' }, // opens sub-category
      { id: 'protective-styles', label: 'Protective Styles' }, // opens sub-category
      { id: 'wigs-extensions', label: 'Wigs & Extensions' }, // opens sub-category
      { id: 'head-spa', label: 'Head Spa' },
    ],
  },
  subCategories: [
    {
      parentId: 'perm',
      options: [
        { id: 's-curl-perm', label: 'S Curl Perm' },
        { id: 'c-curl-perm', label: 'C Curl Perm' },
        { id: 'cs-curl-perm', label: 'CS Curl Perm' },
        { id: 'cloud-perm', label: 'Cloud Perm' },
        { id: 'slick-perm', label: 'Slick Perm' },
        { id: 'grace-perm', label: 'Grace Perm' },
        { id: 'hippie-perm', label: 'Hippie Perm' },
      ],
    },
    {
      parentId: 'straightening',
      options: [
        { id: 'magic-straightening', label: 'Magic Straightening' },
        { id: 'japanese-straightening', label: 'Japanese Straightening' },
        { id: 'keratin-treatment', label: 'Keratin Treatment' },
        { id: 'brazilian-blowout', label: 'Brazilian Blowout' },
      ],
    },
    {
      parentId: 'protective-styles',
      options: [
        { id: 'box-braids', label: 'Box Braids' },
        { id: 'knotless-braids', label: 'Knotless Braids' },
        { id: 'cornrows', label: 'Cornrows' },
        { id: 'two-strand-twists', label: 'Two-Strand Twists' },
        { id: 'faux-locs', label: 'Faux Locs' },
      ],
    },
    {
      parentId: 'wigs-extensions',
      options: [
        { id: 'lace-front-wig', label: 'Lace Front Wig' },
        { id: 'sew-in-weave', label: 'Sew-In Weave' },
        { id: 'closure-wig', label: 'Closure Wig' },
      ],
    },
  ],
};

// ─────────────────────────────────────────────
// 4. Price Range (Tier 1)
// Based on average haircut price
// ─────────────────────────────────────────────
export const priceRange: FilterCategory = {
  id: 'price-range',
  name: 'Price Range',
  tier: 1,
  description: 'Based on average haircut price',
  options: {
    tier1: [
      { id: 'price-1', label: '$ — under ₩50K' },
      { id: 'price-2', label: '$$ — ₩50–100K' },
      { id: 'price-3', label: '$$$ — ₩100–200K' },
      { id: 'price-4', label: '$$$$ — ₩200K+' },
    ],
  },
};

// ─────────────────────────────────────────────
// 5. Location (Tier 1)
// Tier 1: areas with high foreigner recognition
// Tier 2: other Seoul districts
// Plus auxiliary options: "Near me", radius, draw on map
// ─────────────────────────────────────────────
export const location: FilterCategory = {
  id: 'location',
  name: 'Location',
  tier: 1,
  description: 'Tier 1 covers areas with high foreigner recognition',
  options: {
    tier1: [
      { id: 'gangnam-area', label: 'Gangnam / Apgujeong / Cheongdam' },
      { id: 'itaewon-area', label: 'Itaewon / Hannam-dong' },
      { id: 'hongdae-area', label: 'Hongdae / Yeonnam-dong' },
      { id: 'seongsu-area', label: 'Seongsu / Hannam' },
      { id: 'jongno-area', label: 'Jongno / Insadong' },
    ],
    tier2: [
      { id: 'mapo', label: 'Mapo' },
      { id: 'yongsan', label: 'Yongsan' },
      { id: 'songpa', label: 'Songpa' },
      // Add more Seoul districts as needed
    ],
  },
};

// Auxiliary location options (handled separately in UI)
export const locationAuxiliary = {
  nearMe: { id: 'near-me', label: 'Near me' },
  radius: [
    { id: 'within-5km', label: 'Within 5km' },
    { id: 'within-10km', label: 'Within 10km' },
    { id: 'within-15km', label: 'Within 15km' },
  ],
  drawOnMap: { id: 'draw-on-map', label: 'Draw area on map' },
};

// ─────────────────────────────────────────────
// 6. Amenities (Tier 2)
// ─────────────────────────────────────────────
export const amenities: FilterCategory = {
  id: 'amenities',
  name: 'Amenities',
  tier: 2,
  options: {
    tier1: [
      { id: 'free-parking', label: 'Free parking' },
      { id: 'wifi', label: 'Wi-Fi' },
      { id: 'free-drinks', label: 'Free drinks/snacks' },
      { id: 'card-payment', label: 'Card payment' },
      { id: 'english-menu', label: 'English menu/sign' },
    ],
    tier2: [
      { id: 'pet-friendly', label: 'Pet-friendly' },
      { id: 'wheelchair-accessible', label: 'Wheelchair accessible' },
      { id: 'kids-welcome', label: 'Kids welcome' },
      { id: 'same-day-appointment', label: 'Same-day appointment' },
      { id: 'private-rooms', label: 'Private rooms' },
    ],
  },
};

// ─────────────────────────────────────────────
// 7. Inclusivity & Values (Tier 2)
// ─────────────────────────────────────────────
export const inclusivity: FilterCategory = {
  id: 'inclusivity',
  name: 'Inclusivity & Values',
  tier: 2,
  options: {
    tier1: [
      { id: 'foreigner-friendly', label: 'Foreigner-friendly' },
      { id: 'vegan-products', label: 'Vegan products available' },
      { id: 'cruelty-free', label: 'Cruelty-free products' },
    ],
    tier2: [
      { id: 'halal-friendly', label: 'Halal-friendly' },
      { id: 'lgbtq-friendly', label: 'LGBTQ+ friendly' },
      { id: 'hijab-aware', label: 'Hijab-aware service' },
      { id: 'sustainable', label: 'Sustainable / eco-conscious' },
    ],
  },
};

// ─────────────────────────────────────────────
// Combined export
// ─────────────────────────────────────────────
export const discoverFilters: FilterCategory[] = [
  language,
  specialty,
  service,
  priceRange,
  location,
  amenities,
  inclusivity,
];

export default discoverFilters;
