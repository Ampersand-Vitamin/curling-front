# Curling Design System

**Figma source:** [Curling Design System](https://www.figma.com/design/Nd9ToDBR2rj4DUYXcaSphP/Curling-Design-System?node-id=2-6461)  
**Library key:** `lk-87837bcb81ea79b54067a82022489e076142fa14e51ca41dafc5f5251afa9ef3880a6add1807ae38f220a3195b405826eff76abb2ee456b5f6ba865c36a0bdf6`  
**Last synced:** 2026-05-01

---

## Color

### Primitives (`Color Primitives` collection in Figma)

#### Primary — warm earth/brown palette
| Token | CSS var | Value |
|-------|---------|-------|
| Primary/50  | `--color-primary-50`  | `#fffaf6` |
| Primary/100 | `--color-primary-100` | `#f9eee6` |
| Primary/200 | `--color-primary-200` | `#ebdace` |
| Primary/300 | `--color-primary-300` | `#d4b7a1` |
| Primary/400 | `--color-primary-400` | `#ab8d7b` |
| Primary/500 | `--color-primary-500` | `#8f715f` |
| Primary/600 | `--color-primary-600` | `#684d3d` |
| Primary/700 | `--color-primary-700` | `#4b3528` |
| Primary/800 | `--color-primary-800` | `#2e201b` |
| Primary/900 | `--color-primary-900` | `#2e1e1b` |

#### Secondary — coral/red-orange palette (Beige)
| Token | CSS var | Value |
|-------|---------|-------|
| Secondary/50  | `--color-secondary-50`  | `#f8efed` |
| Secondary/100 | `--color-secondary-100` | `#f6e1dc` |
| Secondary/200 | `--color-secondary-200` | `#ecc6bd` |
| Secondary/300 | `--color-secondary-300` | `#e9a898` |
| Secondary/400 | `--color-secondary-400` | `#e36a4b` |
| Secondary/500 | `--color-secondary-500` | `#ba5a41` |
| Secondary/600 | `--color-secondary-600` | `#a04129` |
| Secondary/700 | `--color-secondary-700` | `#94260b` |
| Secondary/800 | `--color-secondary-800` | `#761a03` |
| Secondary/900 | `--color-secondary-900` | `#501203` |

#### Surface — warm grey (neutral)
| Token | CSS var | Value |
|-------|---------|-------|
| Surface/white | `--color-surface-white` | `#ffffff` |
| Surface/50    | `--color-surface-50`    | `#fcfbf8` |
| Surface/100   | `--color-surface-100`   | `#f7f6f3` |
| Surface/200   | `--color-surface-200`   | `#f0efec` |
| Surface/300   | `--color-surface-300`   | `#e0dfdd` |
| Surface/400   | `--color-surface-400`   | `#b8b7b5` |
| Surface/500   | `--color-surface-500`   | `#8c8b8a` |
| Surface/600   | `--color-surface-600`   | `#696867` |
| Surface/700   | `--color-surface-700`   | `#545353` |
| Surface/800   | `--color-surface-800`   | `#3b3a3a` |
| Surface/900   | `--color-surface-900`   | `#292828` |
| Surface/950   | `--color-surface-950`   | `#171717` |

#### Accent — cool blue-grey
| Token | CSS var | Value |
|-------|---------|-------|
| Accent/50  | `--color-accent-50`  | `#f1f5f9` |
| Accent/100 | `--color-accent-100` | `#e9f0f7` |
| Accent/200 | `--color-accent-200` | `#dfe8f2` |
| Accent/300 | `--color-accent-300` | `#cbd5e1` |
| Accent/400 | `--color-accent-400` | `#acbcd2` |
| Accent/500 | `--color-accent-500` | `#748fb7` |
| Accent/600 | `--color-accent-600` | `#4f6d9a` |
| Accent/700 | `--color-accent-700` | `#38557e` |
| Accent/800 | `--color-accent-800` | `#152f53` |
| Accent/900 | `--color-accent-900` | `#091531` |

#### Alert — yellow-green
| Token | CSS var | Value |
|-------|---------|-------|
| Alert/100 | `--color-alert-100` | `#ecf09b` |
| Alert/500 | `--color-alert-500` | `#c8ce5d` |

---

### Semantic (`Color` collection in Figma)

These reference primitives and define role-based usage.

| Token | Reference | Usage |
|-------|-----------|-------|
| `Action/Primary`        | `Primary/600`     | CTA buttons, interactive elements |
| `Icon/Red/Primary`      | `Secondary/600`   | Brand-accent icons |
| `Icon/Black/Primary`    | `Surface/950`     | Default icon on light backgrounds |
| `Icon/Black/Secondary`  | `Surface/600`     | Muted/subdued icons |
| `Icon/Black/Overlay`    | `rgba(23,23,23,0.4)` | Icons on translucent overlays |
| `Icon/White/Primary`    | `#ffffff`         | Icons on dark/primary backgrounds |
| `Icon/White/Secondary`  | `rgba(255,255,255,0.6)` | Muted icons on dark backgrounds |
| `Icon/White/Overlay`    | `rgba(255,255,255,0.4)` | Icons on overlays |

---

## Typography

| Property | Value |
|----------|-------|
| Font family | Pretendard (variable font) |
| Weights used | 400 (Regular), 500 (Medium), 600 (SemiBold) |
| Loading | `next/font/local` with `PretendardVariable.woff2` |
| CSS var | `--font-pretendard` |

---

## Icons

### Custom icon set (`SVG/icons/`)

Two sizes: **24px** and **16px**.

**48 icons:**

| Category | Icons |
|----------|-------|
| Hair services | search, style, scissors, comb, chair, salon, dryer, hair wash, beard, hair clipper, mustache, protected |
| Booking & admin | booking, cancel, photo, filter, portfolio, designer |
| Navigation | chevron left/right/down/up, chevrons down/up, menu, arrow right up, arrow left down, location, map, maximize, minimize, current |
| Social | whatsapp, instagram, naver, call |
| Content | chat, send, add, bookmark, list, Check |
| Status | Circle stroke, Circle fill |
| Hair types | wavy, straight, curly, Coily |

### Country flags (`SVG/flags/`) — 20×20px

Korean, British, Italian, USA, Japanese, Chinese, Turkish, French, Hong Kong, German

---

## Components

All components are published in the **Curling Design System** Figma library and last updated **2026-04-30**.

| Component | Type | Description |
|-----------|------|-------------|
| `Button` | component_set | Primary CTA button |
| `Icon Button` | component_set | Icon-only action button |
| `search bar` | component_set | Search input with icon |

---

## CSS Implementation

Tokens map to Tailwind v4 `@theme` variables in [`src/app/globals.css`](src/app/globals.css).

Naming convention: `--color-{palette}-{step}` → `text-{palette}-{step}` / `bg-{palette}-{step}` in Tailwind.

```css
/* Example usage */
.btn-primary   { background: var(--color-primary-600); }   /* Action/Primary */
.icon-default  { color: var(--color-surface-950); }        /* Icon/Black/Primary */
.icon-muted    { color: var(--color-surface-600); }        /* Icon/Black/Secondary */
.icon-on-brand { color: #ffffff; }                         /* Icon/White/Primary */
```
