# Filter System

> Last updated: 2026-05-09
> Status: 1차 — UT 5/17 전 확정 버전
> Related code: `src/data/filters/discover.ts`, `src/data/filters/style.ts`

---

## Overview

Curling has **two distinct filter systems** for two fundamentally different search intents:

| | Discover | Style |
|---|---|---|
| Search target | Stylists / Salons (people) | Portfolio images (results) |
| Primary signals | Trust, accessibility, location | Visual attributes |
| Tier 1 categories | Language, Specialty, Service, Price, Location | Hair Type, Service, Color, Length, Style |
| Tier 2 categories | Amenities, Inclusivity & Values | Curly Style, Protective Styles, Wigs & Extensions, Mood |

The **same item may appear in both with different hierarchies**. For example, Protective Styles is a top-level category in Style search (where it's the search goal), but flattens into Service in Discover (where it's one of many offerings).

---

## Tier System

A two-tier disclosure model keeps the filter modal scannable:

- **Tier 1**: Always visible when a category opens
- **Tier 2**: Revealed via "More" button or contextual selection

Some categories have **conditional visibility** — they appear only when a parent option is selected (e.g., Curly Style appears only when Hair Type is Curly or Coily).

### Why two tiers (not three)

Initially considered a third tier accessed only via search input. Cut because:

- "Searchable but not browsable" is functionally invisible to users who don't know the term
- Implementation cost (term mapping, autocomplete) wasn't justified for MVP
- AI image-keyword extraction provides an alternative discovery path for niche terms

---

## Discover Filters

Discover filters prioritize **trust signals** (language, specialty, price transparency) over outcome filters. The right filter axis depends on whether the user is finding a person or a result.

### Categories

| # | Category | Tier | Notes |
|---|---|---|---|
| 1 | Language | 1 | Default selection follows user onboarding |
| 2 | Specialty | 1 | Labels intentionally vary in form |
| 3 | Service | 1 | Has sub-categories (Perm, Straightening, etc.) |
| 4 | Price Range | 1 | Based on average haircut price |
| 5 | Location | 1 | Tier 1: foreigner-recognizable areas |
| 6 | Amenities | 2 | |
| 7 | Inclusivity & Values | 2 | |

### 1. Language

Default selection follows user onboarding preferences.

**Tier 1**
- English
- Korean
- Japanese
- Chinese (Mandarin)

**Tier 2 (More)**
- Spanish
- French
- Vietnamese
- Russian
- Arabic

### 2. Specialty

Labels intentionally vary in form (Expert / Specialist / Style / friendly / service name) to preserve how salons naturally describe their differentiation. Forced consistency would normalize away meaningful signal.

**Tier 1**
- Curly Hair Expert
- Coily Hair Expert
- K-pop Style
- Highlight Specialist
- Head Spa

**Tier 2 (More)**
- Bridal Specialist
- Men's Cut Specialist
- Children's Cut
- Senior-friendly
- Fine Hair Expert
- Damaged Hair Repair

### 3. Service

**Tier 1**
- Haircut
- Coloring
- Highlight
- Perm *(opens sub-options)*
- Straightening *(opens sub-options)*
- Protective Styles *(opens sub-options)*
- Wigs & Extensions *(opens sub-options)*
- Head Spa

**Sub-options — Perm**
- S Curl Perm, C Curl Perm, CS Curl Perm
- Cloud Perm, Slick Perm, Grace Perm, Hippie Perm

**Sub-options — Straightening**
- Magic Straightening, Japanese Straightening
- Keratin Treatment, Brazilian Blowout

**Sub-options — Protective Styles**
- Box Braids, Knotless Braids, Cornrows
- Two-Strand Twists, Faux Locs

**Sub-options — Wigs & Extensions**
- Lace Front Wig, Sew-In Weave, Closure Wig

### 4. Price Range

Based on average haircut price.

- $ — under ₩50K
- $$ — ₩50–100K
- $$$ — ₩100–200K
- $$$$ — ₩200K+

### 5. Location

**Tier 1 — Foreigner-recognizable areas**
- Gangnam / Apgujeong / Cheongdam
- Itaewon / Hannam-dong
- Hongdae / Yeonnam-dong
- Seongsu / Hannam
- Jongno / Insadong

**Tier 2 (More) — Other Seoul districts**
- Mapo, Yongsan, Songpa, etc.

**Auxiliary options** (handled separately in UI)
- "Near me" (location permission)
- "Within 5km / 10km / 15km"
- Draw area on map

### 6. Amenities (Tier 2)

**Tier 1**
- Free parking
- Wi-Fi
- Free drinks/snacks
- Card payment
- English menu/sign

**Tier 2 (More)**
- Pet-friendly
- Wheelchair accessible
- Kids welcome
- Same-day appointment
- Private rooms

### 7. Inclusivity & Values (Tier 2)

**Tier 1**
- Foreigner-friendly
- Vegan products available
- Cruelty-free products

**Tier 2 (More)**
- Halal-friendly
- LGBTQ+ friendly
- Hijab-aware service
- Sustainable / eco-conscious

---

## Style Filters

Style filters prioritize **visual attributes** of portfolio images. Categories adapt to the user's hair type and selections, revealing relevant options progressively rather than overwhelming upfront.

### Categories

| # | Category | Tier | Visibility |
|---|---|---|---|
| 1 | Hair Type | 1 | Always; default from onboarding |
| 2 | Service | 1 | Always |
| 3 | Color | 1 | Always; 3-tier sub-shades |
| 4 | Length | 1 | Always |
| 5-1 | Style | 1 | Options open based on Length |
| 5-2 | Curly Style | 2 | When Hair Type: Curly/Coily |
| 6 | Protective Styles | 2 | When Hair Type: Curly/Coily |
| 7 | Wigs & Extensions | 2 | When Hair Type: Curly/Coily |
| 8 | Mood | 2 | Always (in More) |

### 1. Hair Type

Default selection follows user onboarding. Selection affects which Tier 2 categories surface.

- Curly Hair
- Coily Hair
- Wavy Hair
- Straight Hair

### 2. Service

Same Tier 1 options as Discover; sub-categories included for Perm and Straightening only.

**Tier 1**
- Haircut, Coloring, Highlight
- Perm *(opens sub-options)*
- Straightening *(opens sub-options)*
- Protective Styles *(opens new category)*
- Wigs & Extensions *(opens new category)*

**Sub-options — Perm**
- S Curl Perm, C Curl Perm, CS Curl Perm
- Curly Perm, Cloud Perm, Slick Perm, Grace Perm, Hippie Perm

**Sub-options — Straightening**
- Magic Straightening, Japanese Straightening
- Keratin Treatment, Brazilian Blowout

### 3. Color

3-tier structure: Tier 1-2 are color families; selecting one reveals Tier 3 specific shades.

**Tier 1 — Most popular**
- Brown, Blonde, Black
- Balayage, Highlight, Ombre/Sombre

**Tier 2 (More)**
- Ginger, Grey, Vivid

**Tier 3 — Sub-shades (open when Tier 1-2 family is selected)**

*Blonde:* Light, Ash, Almond, Caramel, Honey, Natural

*Ginger:* Light Ginger, Auburn, Copper, Light Auburn

*Brown:* Mocha, Butterscotch, Light, Golden, Chocolate, Ash, Dark

*Black:* Jet Black, Off Black, Blue Black

*Grey:* Platinum, Silver Ash, Dark Ash

*Vivid:* Vivid Red, Dark Red, Baby Pink, Vivid Pink, Light Purple, Dark Purple, Sky Blue, Dark Blue, Green

### 4. Length

- Short
- Medium
- Long
- Extra Long

### 5-1. Style

Options open based on Length selection.

**When Length: Short**
- Pixie Cut, Bob, Layered, Shag
- Hush Cut, Wolf Cut, Bixie Cut, Buzz Cut

**When Length: Medium / Long / Extra Long**
- Layered Cut, Soft Wolf Cut, Soft Layered
- Butterfly Cut, Hush Cut, Hime Cut

### 5-2. Curly Style (Tier 2)

Visible when Hair Type: Curly or Coily is selected.

**Tier 1 — Most popular**
- Deva Cut
- Rezo Cut
- Curly Bob
- Curly Layers

**Tier 2 (More)**
- Ouidad Cut
- Cadō Cut
- Tunnel Cut
- CURLSYS
- Diametrix Cut

### 6. Protective Styles (Tier 2)

Visible when Hair Type: Curly/Coily, or Service > Protective Styles is selected.

**Tier 1 — Most common**
- Box Braids
- Knotless Braids
- Cornrows
- Two-Strand Twists
- Faux Locs

**Tier 2 (More)**
- Senegalese Twists, Passion Twists, Spring Twists, Marley Twists
- Stitch Braids, Fulani Braids, Goddess Braids
- Butterfly Locs, Crochet Braids, Bantu Knots

### 7. Wigs & Extensions (Tier 2)

Visible when Hair Type: Curly/Coily, or Service > Wigs & Extensions is selected.

**Tier 1**
- Lace Front Wig
- Sew-In Weave
- Closure Wig

**Tier 2 (More)**
- Full Lace Wig, U-Part Wig, Glueless Wig
- Tape-In Extensions, Clip-In Extensions

### 8. Mood (Tier 2)

**Tier 1**
- K-pop idol style
- Everyday casual
- Date night
- Wedding / Bridal
- Office professional

**Tier 2 (More)**
- Festival / Concert
- Vintage / Retro
- Edgy
- Romantic

---

## Design Decisions

### Why Discover and Style are different

Discover and Style serve different cognitive tasks:

- **Discover**: "Find someone who can do my hair" — trust-driven
- **Style**: "Find a style I like" — visually-driven

Forcing a unified filter system would compromise both. The cost of two systems is justified by clarity of intent.

### Why "Highlight" lives under Color (not Service) in Style

Technically a service modifier, but users mentally browse by visual outcome. *"I want balayage"* maps to color browsing, not service selection. Mental model > technical accuracy.

### Why Specialty labels vary in form

Tested consistency ("○○ Specialist" for all). Result felt generic. Labels like "K-pop Style", "Senior-friendly", "Highlight Specialist" each carry distinct signal — forced normalization would erase that.

### Why Tier 3 keywords (Sisterlocks, Lemonade Braids, etc.) excluded

"Searchable but invisible" is functionally non-existent for most users. Cost-benefit didn't justify inclusion in MVP. AI image-keyword extraction handles edge cases by surfacing terms from uploaded references.

### Why Bangs is not a separate category

Bangs are rarely searched independently — they're a modifier of cut type. Absorbed into Style category to reduce category count.

### Considered but cut

| Item | Reason |
|---|---|
| Tier 3 (search-only access) | Functionally invisible; AI search covers edge cases |
| Styling Treatments (Wash & Go, Twist Out) | Not visually identifiable in portfolios |
| Texture Treatment as standalone | Absorbed into Service > Perm/Straightening |
| Bangs as separate category | Absorbed into Style |
| Availability filter | Real-time data quality issues; no Korean salon API integration |
| Designer Experience Level | Cold start problem for new designers; portfolio is stronger signal |
| Rating filter | Cold start issues; sort option used instead |

### Asymmetric integration: Protective Styles & Wigs

In Style: Top-level Tier 2 category (search goal for Coily users).

In Discover: Sub-options under Service (one of many offerings).

Same items, different hierarchy. Reflects different user intents within each search context.

---

## Implementation Notes

### Default selections from onboarding

- **Discover > Language**: Pre-selected from user's preferred languages
- **Style > Hair Type**: Pre-selected from user's hair profile

Users can override defaults; selection persists across sessions.

### Bilingual term mapping

Korean stylists may tag portfolios in Korean (e.g., 발레아쥬). User searches in English (balayage). Backend dictionary maps these to the same filter ID.

Term variants to handle:
- `balayage` ↔ `발레아쥬` ↔ `바레아쥬`
- `magic straightening` ↔ `매직` ↔ `매직스트레이트`
- (See term-mapping.md once created)

### Empty-state handling

When filter combinations return no results:
- Suggest nearest-match relaxation ("Try removing X")
- Surface related stylists via AI matching (not strict filter)
- Show message: "No results yet — be the first to suggest a salon for this style"
