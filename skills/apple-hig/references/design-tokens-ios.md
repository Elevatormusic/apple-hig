---
title: Design Tokens — iOS / iPadOS 27
source_url: https://developer.apple.com/design/resources/
platforms: [ios, ipados]
value_type: exact-spec
last_verified: 2026-07-01
---

# Design Tokens — iOS / iPadOS 27 ("Golden Gate")

> 🔢 **exact-spec / version-dependent.** Transcribed from the current-generation (June 2026,
> iOS/iPadOS **27**) **Apple Design Resources** token export. Apple states these values are for
> **reference during design** and **fluctuate release to release** — apply them through the
> **semantic API** (`Color` / `UIColor`), never as hard-coded runtime constants. This file is the
> full iOS table set; `references/design-tokens.md` is the compact quick-source for `/hig-tokens`.
> See [[color]], [[typography]], [[dark-mode]], [[materials]], [[liquid-glass]].

Values are `apple_published` (design-resource export) but version-dependent. In code prefer semantic
names (`Font.body`, `Color(.label)`, `.systemBlue`); hex/alpha below are a design aid.

## Type ramp — Dynamic Type (default "Large")

Font = **SF Pro** (Text ≤19 pt / Display ≥20 pt, continuous optical sizing). Leading pt = size × line-height ratio.
Each style has a Default and a Bold weight; italic/bold-italic variants share the upright weight and are omitted for brevity.

| Style | Size (pt) | Leading (pt) | Default weight | Bold weight |
|---|---|---|---|---|
| Large Title | 34 | 41 | Regular (400) | Bold (700) |
| Title 1 | 28 | 34 | Regular (400) | Bold (700) |
| Title 2 | 22 | 28 | Regular (400) | Bold (700) |
| Title 3 | 20 | 25 | Regular (400) | **Semibold (600)** |
| Headline | 17 | 22 | **Semibold (600)** | Semibold (600) |
| Body | 17 | 22 | Regular (400) | **Semibold (600)** |
| Callout | 16 | 21 | Regular (400) | Semibold (600) |
| Subheadline | 15 | 20 | Regular (400) | Semibold (600) |
| Footnote | 13 | 18 | Regular (400) | Semibold (600) |
| Caption 1 | 12 | 16 | Regular (400) | **Medium (500)** |
| Caption 2 | 11 | 13 | Regular (400) | Semibold (600) |

Tracking (letter-spacing) = 0 in the export. Note: the "Bold" variant of most body styles resolves to
**Semibold (600)**, not 700 — only the four title styles use true Bold (700), and Caption 1 Bold is Medium (500).

### Leading variants (Loose / Tight)

The export ships three leading sets. Ratios below (multiply by size for pt); default is the middle column.

| Style | Tight (ratio) | Default (ratio) | Loose (ratio) |
|---|---|---|---|
| Large Title | 1.147 | 1.206 | 1.265 |
| Title 1 | 1.143 | 1.214 | 1.286 |
| Title 2 | 1.182 | 1.273 | 1.364 |
| Title 3 | 1.150 | 1.250 | 1.350 |
| Headline | 1.176 | 1.294 | 1.412 |
| Body | 1.176 | 1.294 | 1.412 |
| Callout | 1.188 | 1.313 | 1.438 |
| Subheadline | 1.200 | 1.333 | 1.467 |
| Footnote | 1.231 | 1.385 | 1.538 |
| Caption 1 | 1.167 | 1.333 | 1.500 |
| Caption 2 | 1.000 | 1.182 | 1.364 |

## Labels (label ladder, incl. new quinary tier)

| Tier | Light | Dark |
|---|---|---|
| 1 Primary | #000000 | #FFFFFF |
| 2 Secondary | #3C3C43 a=0.6 | #EBEBF5 a=0.6 |
| 3 Tertiary | #3C3C43 a=0.3 | #EBEBF5 a=0.3 |
| 4 Quaternary | #3C3C43 a=0.18 | #EBEBF5 a=0.16 |
| **5 Quinary** | **#3C3C43 a=0.09** | **#EBEBF5 a=0.09** |

### Labels — Vibrant (over materials)

| Tier | Light | Dark |
|---|---|---|
| 1 Primary | #000000 | #FFFFFF |
| 2 Secondary | #999999 | #999999 |
| 3 Tertiary | #BFBFBF | #404040 |
| 4 Quaternary | #D9D9D9 | #262626 |

### Labels — Liquid Glass

Opaque label colors tuned for legibility over Liquid Glass surfaces (4 tiers, no quinary in the export).

| Tier | Light | Dark |
|---|---|---|
| 1 Primary | #1A1A1A | #EDEDED |
| 2 Secondary | #727272 | #8A8A8A |
| 3 Tertiary | #BFBFBF | #404040 |
| 4 Quaternary | #D9D9D9 | #262626 |

## Fills (ladder, incl. quinary)

| Tier | Light | Dark |
|---|---|---|
| 1 Primary | #787878 a=0.2 | #787880 a=0.36 |
| 2 Secondary | #787880 a=0.16 | #787880 a=0.32 |
| 3 Tertiary | #767680 a=0.12 | #767680 a=0.24 |
| 4 Quaternary | #747480 a=0.08 | #767680 a=0.18 |
| 5 Quinary | #000000 a=0.02 | #767680 a=0.02 |

### Fills — Vibrant (opaque, over materials)

| Tier | Light | Dark |
|---|---|---|
| 1 Primary | #CCCCCC | #333333 |
| 2 Secondary | #E0E0E0 | #1F1F1F |
| 3 Tertiary | #EDEDED | #121212 |

## Grays (systemGray 1–6)

| Name | Light | Dark |
|---|---|---|
| Gray | #8E8E93 | #8E8E93 |
| Gray 2 | #AEAEB2 | #636366 |
| Gray 3 | #C7C7CC | #48484A |
| Gray 4 | #D1D1D6 | #3A3A3C |
| Gray 5 | #E5E5EA | #2C2C2E |
| Gray 6 | #F2F2F7 | #1C1C1E |

## Backgrounds

Dark has both a **Base** and an **Elevated** ramp (elevated is used for content presented above a base
surface — sheets, popovers). Light has a single ramp.

| Role | Light | Dark — Base | Dark — Elevated |
|---|---|---|---|
| Primary | #FFFFFF | #000000 | #1C1C1E |
| Secondary | #F2F2F7 | #1C1C1E | #2C2C2E |
| Tertiary | #FFFFFF | #2C2C2E | #3A3A3C |

## Backgrounds — Grouped (inset grouped tables)

| Role | Light | Dark — Base | Dark — Elevated |
|---|---|---|---|
| Primary | #F2F2F7 | #000000 | #1C1C1E |
| Secondary | #FFFFFF | #1C1C1E | #2C2C2E |
| Tertiary | #F2F2F7 | #2C2C2E | #3A3A3C |

## Materials (blur backdrops)

Multi-fill materials list layers 0..n; blend order is 0 first.

| Material | Light | Dark |
|---|---|---|
| 1 Thick | #FFFFFF a=0.34, #FFFFFF a=0.84 | #000000 a=0.6 |
| 2 Regular (Default) | #FFFFFF a=0.25, #FFFFFF a=0.6 | #000000 a=0.41 |
| 3 Thin | #FFFFFF a=0.05, #FFFFFF a=0.4 | #000000 a=0.26 |
| 4 Ultrathin | #FFFFFF a=0.07, #FFFFFF a=0.03 | #000000 a=0 |

## Liquid Glass

The Liquid Glass export encodes per-surface **fill stacks** (multiple layers) plus shadows; only the fill
colors are transcribed here (shadows are a later recipe spec — see EXCLUDE note). Layers list top→bottom.

| Surface | Light fills | Dark fills |
|---|---|---|
| Clear | #F8F8F8 a=0.12 | — |
| Regular — Large | #FFFFFF a=0.7, #BFBFBF a=0.1 | #1A1A1A a=0.5, #1A1A1A a=0.9, #1A1A1A |
| Regular — Medium | #CCCCCC a=0.7, #BFBFBF a=0.1 | #1A1A1A a=0.3, #1A1A1A a=0.3, #1A1A1A |
| Regular — Small | #F8F8F8 a=0.2, #000000 a=0.25, #FFFFFF a=0.25, #444444 a=0.6 | #000000, #999999 a=0.17 |
| Regular — Small — Tinted | #FFFFFF | #000000 |
| Regular — Small — Inactive | → Fills Light 5 Quinary | → Fills Dark 3 Tertiary |
| Dock | #999999 a=0.33 | #333333 a=0.33 |
| App Library | #F8F8F8 a=0.08 | #F8F8F8 a=0.05 |
| Keyboard Background | #D4D4D4 a=0.74, #1B1B1B, #E6E9ED | #000000 a=0.25, #CCCCCC, #0D0D0D, #262626 a=0.9 |
| Lock Screen Time | #F8F8F8 a=0.25, #1A1A1A | (single set) |
| Widget Glass | gradient (black→…) | (single set) |

Note: `Regular — Small — Inactive` and a few surfaces alias other tokens (Fills) rather than a literal
hex; the arrow shows the source token. Widget Glass primary fill is a gradient (not a flat color).

## Separators

| Role | Light | Dark |
|---|---|---|
| Opaque | #C6C6C8 | #38383A |
| Non-Opaque | #000000 a=0.12 | #FFFFFF a=0.12 |
| Vibrant | #E6E6E6 | #1A1A1A |

## System colors (27 palette)

Several hues shifted for 27 — notably blue, red, orange, teal, mint, cyan, indigo, purple, brown, and
yellow-dark. Green and pink are stable vs the prior generation.

| Name | Light | Dark |
|---|---|---|
| Red | #FF383C | #FF4245 |
| Orange | #FF8D28 | #FF9230 |
| Yellow | #FFCC00 | #FFD600 |
| Green | #34C759 | #30D158 |
| Mint | #00C8B3 | #00DAC3 |
| Teal | #00C3D0 | #00D2E0 |
| Cyan | #00C0E8 | #3CD3FE |
| Blue | #0088FF | #0091FF |
| Indigo | #6155F5 | #6D7CFF |
| Purple | #CB30E0 | #DB34F2 |
| Pink | #FF2D55 | #FF375F |
| Brown | #AC7F5E | #B78A66 |

Default tint/accent = **Blue**. Apply via `Color.blue` / `UIColor.systemBlue` (adapts to appearance,
contrast, and vibrancy automatically).


> 🔢 **exact-spec / version-dependent.** These are the typed **shadow** rows (and the one **gradient**
> fill) the Liquid Glass fill-stack table above deferred ("shadows are a later recipe spec"). Each
> Liquid Glass surface in the iOS 27 export carries a **multi-layer shadow stack**: an outer drop
> shadow plus inner rim/highlight strokes (blur 0, negative spread) that draw the glass edge. To stay
> lean, the table lists the **outer drop-shadow layer (layer 0)** of each surface and notes the total
> layer count; the inner rim layers are edge treatments, not elevation, and are not exploded here
> (**this is a deliberate compression** — the full per-layer stacks live in the raw export). px == pt
> at 1x; `offset-y` positive = downward.

Blur / alpha / offset-y / spread are for the drop layer; single-set surfaces (Clear, Lock Screen Time,
Widget Glass) are appearance-agnostic in the export.

| Surface | Appearance | Layers | Drop: blur | alpha | offset-y | spread | Drop color |
|---|---|---|---|---|---|---|---|
| Clear | (single) | 13 | 15 | 0.02 | 8 | 0 | `#000000` |
| Regular — Large | Light | 9 | 2 | 1.0 | -4 | -4 | `#272727` |
| Regular — Large | Dark | 9 | 8 | 1.0 | -4 | -4 | `#222222` |
| Regular — Medium | Light | 9 | 2 | 1.0 | -4 | -4 | `#272727` |
| Regular — Medium | Dark | 9 | 8 | 1.0 | -4 | -4 | `#222222` |
| Regular — Small | Light | 13 | 15 | 0.02 | 8 | 0 | `#000000` |
| Regular — Small | Dark | 12 | 20 | 1.0 | 0 | -30 | `#B2B2B2` |
| Regular — Small — Tinted | Light | 11 | 20 | 1.0 | 0 | -30 | `#D9D9D9` |
| Regular — Small — Tinted | Dark | 11 | 20 | 1.0 | 0 | -30 | `#D9D9D9` |
| Regular — Small — Inactive | Light | 1 | 0 | 1.0 | 0 | 0.5 | `#EBEBEB` |
| Regular — Small — Inactive | Dark | 1 | 0 | 1.0 | 0 | 0.5 | `#E6E6E6` |
| Dock | Light | 11 | 20 | 1.0 | 0 | -30 | `#D9D9D9` |
| Dock | Dark | 11 | 20 | 1.0 | 0 | -30 | `#D9D9D9` |
| App Library | Light | 7 | 0 | 1.0 | 0 | 0.5 | `#D9D9D9` |
| App Library | Dark | 7 | 0 | 1.0 | 0 | 0.5 | `#D9D9D9` |
| Keyboard Background | Light | 4 | 8 | 0.2 | 0 | 1 | `#000000` |
| Keyboard Background | Dark | 5 | 8 | 0.1 | 0 | 0 | `#000000` |
| Lock Screen Time | (single) | 10 | 0.5 | 1.0 | -4 | -4 | `#333333` |
| Widget Glass | (single) | 6 | 0.5 | 1.0 | -4 | -4 | `#666666` |

Notes on the drop layers:
- **Clear** and **Regular — Small (Light)** share the same soft ambient drop (`#000000` α0.02, blur
  15, offset-y 8) followed by inner rim strokes — these are the two "sits-just-above-surface"
  surfaces. Most other surfaces lead with a hard edge-rim layer (blur 0, spread 0.5) or a wide
  negative-spread halo (blur 20, spread -30) as layer 0, so their "drop" reads as an edge, not a cast
  shadow.
- **Regular — Small — Inactive** and **App Library** are essentially rim-only (layer 0 is a
  hairline `spread 0.5` stroke); they have no cast elevation.
- The `Regular — *` surfaces are **size-based (Small/Medium/Large)**, matching the fill-stack table —
  not a regular/clear split.

### Widget Glass — gradient fill (full stops)

The Widget Glass primary fill (`fills / 0`) is the export's only **gradient** row. Two stops, top→bottom
(`position` 0→1), both fully opaque:

| Stop | Position | Color | Alpha |
|---|---|---|---|
| 0 | 0.0 | `#000000` | 1.0 |
| 1 | 1.0 | `#171717` | 1.0 |

A near-black vertical gradient (pure black → `#171717`). Its shadow is the 6-layer stack summarized in
the table above (outer drop `#666666` α1.0, blur 0.5, offset-y ±4, spread -4, plus `#1A1A1A` edge lines
and a `#222222` blur-10 halo). Apply via the widget system background, not a literal gradient.

> **Scope note:** iOS **Materials** rows in the export are plain color fills (no shadow/border), so no
> typed Materials rows exist to add here. All 20 typed non-Controls rows (19 shadows + 1 gradient) are
> covered above; the 6 typed `Controls` rows are in `references/control-tokens-ios.md`.

See also: [[color]], [[typography]], [[dark-mode]], [[materials]], [[liquid-glass]], [[layout]],
`references/design-tokens.md` (quick-source), the `/hig-tokens` command.## Liquid Glass — surface shadows & the Widget Glass gradient (typed rows)
