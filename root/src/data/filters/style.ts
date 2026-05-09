/**
 * Style Filter Data
 *
 * Filters used in the Style tab to search portfolio images.
 * See docs reference: filter-system.md
 *
 * Structure:
 * - Tier 1 categories: always visible in modal
 * - Tier 2 categories: revealed via "More" or contextual selection (e.g., Hair Type)
 * - Within each category, options may have their own tier or be conditionally shown
 *
 * Difference from Discover:
 * - Discover = provider search (find a person)
 * - Style = portfolio search (find a result)
 */

export type FilterOption = {
  id: string;
  label: string;
};

export type ConditionalOption = {
  parentId: string;
  options: FilterOption[];
};

export type FilterCategory = {
  id: string;
  name: string;
  tier: 1 | 2;
  description?: string;
  // Visibility condition: when this category appears
  visibleWhen?: {
    category: string; // e.g., 'hair-type'
    selectedIds: string[]; // e.g., ['curly', 'coily']
  };
  options: {
    tier1?: FilterOption[];
    tier2?: FilterOption[];
    tier3?: FilterOption[]; // Used for Color (sub-shades)
  };
  // For categories whose options change based on a parent selection
  conditionalOptions?: ConditionalOption[];
  // For sub-categories (Service > Perm/Straightening etc.)
  subCategories?: ConditionalOption[];
};

// ─────────────────────────────────────────────
// 1. Hair Type (Tier 1)
// Default selection follows user onboarding
// ─────────────────────────────────────────────
export const hairType: FilterCategory = {
  id: 'hair-type',
  name: 'Hair Type',
  tier: 1,
  description: 'Default selection follows user onboarding preferences',
  options: {
    tier1: [
      { id: 'curly', label: 'Curly Hair' },
      { id: 'coily', label: 'Coily Hair' },
      { id: 'wavy', label: 'Wavy Hair' },
      { id: 'straight', label: 'Straight Hair' },
    ],
  },
};

// ─────────────────────────────────────────────
// 2. Service (Tier 1)
// Same structure as Discover but slight differences
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
      { id: 'perm', label: 'Perm' },
      { id: 'straightening', label: 'Straightening' },
      { id: 'protective-styles', label: 'Protective Styles' },
      { id: 'wigs-extensions', label: 'Wigs & Extensions' },
    ],
  },
  subCategories: [
    {
      parentId: 'perm',
      options: [
        { id: 's-curl-perm', label: 'S Curl Perm' },
        { id: 'c-curl-perm', label: 'C Curl Perm' },
        { id: 'cs-curl-perm', label: 'CS Curl Perm' },
        { id: 'curly-perm', label: 'Curly Perm' },
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
  ],
};

// ─────────────────────────────────────────────
// 3. Color (Tier 1)
// 3-tier structure: Tier 1-2 are color families,
// Tier 3 reveals specific shades when a family is selected
// ─────────────────────────────────────────────
export const color: FilterCategory = {
  id: 'color',
  name: 'Color',
  tier: 1,
  description: 'Tier 1-2 are families; Tier 3 shades open when family is selected',
  options: {
    tier1: [
      { id: 'brown', label: 'Brown' },
      { id: 'blonde', label: 'Blonde' },
      { id: 'black', label: 'Black' },
      { id: 'balayage', label: 'Balayage' },
      { id: 'highlight', label: 'Highlight' },
      { id: 'ombre-sombre', label: 'Ombre/Sombre' },
    ],
    tier2: [
      { id: 'ginger', label: 'Ginger' },
      { id: 'grey', label: 'Grey' },
      { id: 'vivid', label: 'Vivid' },
    ],
  },
  // Tier 3 sub-shades: shown when a tier 1-2 color family is selected
  conditionalOptions: [
    {
      parentId: 'blonde',
      options: [
        { id: 'light-blonde', label: 'Light Blonde' },
        { id: 'ash-blonde', label: 'Ash Blonde' },
        { id: 'almond-blonde', label: 'Almond Blonde' },
        { id: 'caramel-blonde', label: 'Caramel Blonde' },
        { id: 'honey-blonde', label: 'Honey Blonde' },
        { id: 'natural-blonde', label: 'Natural Blonde' },
      ],
    },
    {
      parentId: 'ginger',
      options: [
        { id: 'light-ginger', label: 'Light Ginger' },
        { id: 'auburn', label: 'Auburn' },
        { id: 'copper', label: 'Copper' },
        { id: 'light-auburn', label: 'Light Auburn' },
      ],
    },
    {
      parentId: 'brown',
      options: [
        { id: 'mocha-brown', label: 'Mocha Brown' },
        { id: 'butterscotch', label: 'Butterscotch' },
        { id: 'light-brown', label: 'Light Brown' },
        { id: 'golden-brown', label: 'Golden Brown' },
        { id: 'chocolate-brown', label: 'Chocolate Brown' },
        { id: 'ash-brown', label: 'Ash Brown' },
        { id: 'dark-brown', label: 'Dark Brown' },
      ],
    },
    {
      parentId: 'black',
      options: [
        { id: 'jet-black', label: 'Jet Black' },
        { id: 'off-black', label: 'Off Black' },
        { id: 'blue-black', label: 'Blue Black' },
      ],
    },
    {
      parentId: 'grey',
      options: [
        { id: 'platinum', label: 'Platinum' },
        { id: 'silver-ash', label: 'Silver Ash' },
        { id: 'dark-ash', label: 'Dark Ash' },
      ],
    },
    {
      parentId: 'vivid',
      options: [
        { id: 'vivid-red', label: 'Vivid Red' },
        { id: 'dark-red', label: 'Dark Red' },
        { id: 'baby-pink', label: 'Baby Pink' },
        { id: 'vivid-pink', label: 'Vivid Pink' },
        { id: 'light-purple', label: 'Light Purple' },
        { id: 'dark-purple', label: 'Dark Purple' },
        { id: 'sky-blue', label: 'Sky Blue' },
        { id: 'dark-blue', label: 'Dark Blue' },
        { id: 'green', label: 'Green' },
      ],
    },
  ],
};

// ─────────────────────────────────────────────
// 4. Length (Tier 1)
// Triggers Style category options
// ─────────────────────────────────────────────
export const length: FilterCategory = {
  id: 'length',
  name: 'Length',
  tier: 1,
  options: {
    tier1: [
      { id: 'short', label: 'Short' },
      { id: 'medium', label: 'Medium' },
      { id: 'long', label: 'Long' },
      { id: 'extra-long', label: 'Extra Long' },
    ],
  },
};

// ─────────────────────────────────────────────
// 5-1. Style (Tier 1)
// Options change based on Length selection
// ─────────────────────────────────────────────
export const style: FilterCategory = {
  id: 'style',
  name: 'Style',
  tier: 1,
  description: 'Options open based on Length selection',
  options: {},
  conditionalOptions: [
    {
      parentId: 'short', // when Length: Short is selected
      options: [
        { id: 'pixie-cut', label: 'Pixie Cut' },
        { id: 'bob', label: 'Bob' },
        { id: 'layered', label: 'Layered' },
        { id: 'shag', label: 'Shag' },
        { id: 'hush-cut', label: 'Hush Cut' },
        { id: 'wolf-cut', label: 'Wolf Cut' },
        { id: 'bixie-cut', label: 'Bixie Cut' },
        { id: 'buzz-cut', label: 'Buzz Cut' },
      ],
    },
    {
      parentId: 'medium', // shared with long, extra-long
      options: [
        { id: 'layered-cut', label: 'Layered Cut' },
        { id: 'soft-wolf-cut', label: 'Soft Wolf Cut' },
        { id: 'soft-layered', label: 'Soft Layered' },
        { id: 'butterfly-cut', label: 'Butterfly Cut' },
        { id: 'hush-cut', label: 'Hush Cut' },
        { id: 'hime-cut', label: 'Hime Cut' },
      ],
    },
    {
      parentId: 'long',
      options: [
        { id: 'layered-cut', label: 'Layered Cut' },
        { id: 'soft-wolf-cut', label: 'Soft Wolf Cut' },
        { id: 'soft-layered', label: 'Soft Layered' },
        { id: 'butterfly-cut', label: 'Butterfly Cut' },
        { id: 'hush-cut', label: 'Hush Cut' },
        { id: 'hime-cut', label: 'Hime Cut' },
      ],
    },
    {
      parentId: 'extra-long',
      options: [
        { id: 'layered-cut', label: 'Layered Cut' },
        { id: 'soft-wolf-cut', label: 'Soft Wolf Cut' },
        { id: 'soft-layered', label: 'Soft Layered' },
        { id: 'butterfly-cut', label: 'Butterfly Cut' },
        { id: 'hush-cut', label: 'Hush Cut' },
        { id: 'hime-cut', label: 'Hime Cut' },
      ],
    },
  ],
};

// ─────────────────────────────────────────────
// 5-2. Curly Style (Tier 2)
// Visible when Hair Type: Curly or Coily is selected
// ─────────────────────────────────────────────
export const curlyStyle: FilterCategory = {
  id: 'curly-style',
  name: 'Curly Style',
  tier: 2,
  description: 'Curl-specific cuts; visible when Hair Type is Curly or Coily',
  visibleWhen: {
    category: 'hair-type',
    selectedIds: ['curly', 'coily'],
  },
  options: {
    tier1: [
      { id: 'deva-cut', label: 'Deva Cut' },
      { id: 'rezo-cut', label: 'Rezo Cut' },
      { id: 'curly-bob', label: 'Curly Bob' },
      { id: 'curly-layers', label: 'Curly Layers' },
    ],
    tier2: [
      { id: 'ouidad-cut', label: 'Ouidad Cut' },
      { id: 'cado-cut', label: 'Cadō Cut' },
      { id: 'tunnel-cut', label: 'Tunnel Cut' },
      { id: 'curlsys', label: 'CURLSYS' },
      { id: 'diametrix-cut', label: 'Diametrix Cut' },
    ],
  },
};

// ─────────────────────────────────────────────
// 6. Protective Styles (Tier 2)
// Visible when Hair Type is Curly/Coily, or Service > Protective Styles is selected
// ─────────────────────────────────────────────
export const protectiveStyles: FilterCategory = {
  id: 'protective-styles',
  name: 'Protective Styles',
  tier: 2,
  description: 'Visible when Hair Type is Curly/Coily, or Service > Protective Styles is selected',
  visibleWhen: {
    category: 'hair-type',
    selectedIds: ['curly', 'coily'],
  },
  options: {
    tier1: [
      { id: 'box-braids', label: 'Box Braids' },
      { id: 'knotless-braids', label: 'Knotless Braids' },
      { id: 'cornrows', label: 'Cornrows' },
      { id: 'two-strand-twists', label: 'Two-Strand Twists' },
      { id: 'faux-locs', label: 'Faux Locs' },
    ],
    tier2: [
      { id: 'senegalese-twists', label: 'Senegalese Twists' },
      { id: 'passion-twists', label: 'Passion Twists' },
      { id: 'spring-twists', label: 'Spring Twists' },
      { id: 'marley-twists', label: 'Marley Twists' },
      { id: 'stitch-braids', label: 'Stitch Braids' },
      { id: 'fulani-braids', label: 'Fulani Braids' },
      { id: 'goddess-braids', label: 'Goddess Braids' },
      { id: 'butterfly-locs', label: 'Butterfly Locs' },
      { id: 'crochet-braids', label: 'Crochet Braids' },
      { id: 'bantu-knots', label: 'Bantu Knots' },
    ],
  },
};

// ─────────────────────────────────────────────
// 7. Wigs & Extensions (Tier 2)
// Visible when Hair Type is Curly/Coily, or Service > Wigs & Extensions is selected
// ─────────────────────────────────────────────
export const wigsExtensions: FilterCategory = {
  id: 'wigs-extensions',
  name: 'Wigs & Extensions',
  tier: 2,
  description: 'Visible when Hair Type is Curly/Coily, or Service > Wigs & Extensions is selected',
  visibleWhen: {
    category: 'hair-type',
    selectedIds: ['curly', 'coily'],
  },
  options: {
    tier1: [
      { id: 'lace-front-wig', label: 'Lace Front Wig' },
      { id: 'sew-in-weave', label: 'Sew-In Weave' },
      { id: 'closure-wig', label: 'Closure Wig' },
    ],
    tier2: [
      { id: 'full-lace-wig', label: 'Full Lace Wig' },
      { id: 'u-part-wig', label: 'U-Part Wig' },
      { id: 'glueless-wig', label: 'Glueless Wig' },
      { id: 'tape-in-extensions', label: 'Tape-In Extensions' },
      { id: 'clip-in-extensions', label: 'Clip-In Extensions' },
    ],
  },
};

// ─────────────────────────────────────────────
// 8. Mood (Tier 2)
// ─────────────────────────────────────────────
export const mood: FilterCategory = {
  id: 'mood',
  name: 'Mood',
  tier: 2,
  options: {
    tier1: [
      { id: 'kpop-idol', label: 'K-pop idol style' },
      { id: 'everyday-casual', label: 'Everyday casual' },
      { id: 'date-night', label: 'Date night' },
      { id: 'wedding-bridal', label: 'Wedding / Bridal' },
      { id: 'office-professional', label: 'Office professional' },
    ],
    tier2: [
      { id: 'festival-concert', label: 'Festival / Concert' },
      { id: 'vintage-retro', label: 'Vintage / Retro' },
      { id: 'edgy', label: 'Edgy' },
      { id: 'romantic', label: 'Romantic' },
    ],
  },
};

// ─────────────────────────────────────────────
// Combined export
// ─────────────────────────────────────────────
export const styleFilters: FilterCategory[] = [
  hairType,
  service,
  color,
  length,
  style,
  curlyStyle,
  protectiveStyles,
  wigsExtensions,
  mood,
];

export default styleFilters;
