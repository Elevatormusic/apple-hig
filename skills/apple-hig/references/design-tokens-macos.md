---
title: Design Tokens — macOS 27 (Golden Gate)
source_url: https://developer.apple.com/design/resources/
platforms: [macos]
value_type: exact-spec
last_verified: 2026-07-01
---

> 🔢 **exact-spec / version-dependent.** Transcribed from the current-generation (June 2026,
> macOS 27 "Golden Gate") Apple **Design Resources** token export. Apple states documented
> system-color/material values are **for reference during design** and **may change per release** —
> re-verify each macOS release. In code, apply the **semantic** API (`Color` / `NSColor`,
> `Material`, `.glassEffect()`) so values adapt to appearance, accent, contrast, and vibrancy;
> the hex/alpha below are a **design aid**, not runtime constants. See [[color]], [[typography]],
> [[materials]], [[liquid-glass]].
>
> Companion to the consolidated iOS-reference [[design-tokens]]. macOS values differ from iOS —
> label/fill ladders are alpha-on-black/white (not the iOS rgba pairs), and the type ramp is
> smaller (13 pt body). The **x- Kit** Figma-plumbing group and the per-control per-state recipe
> groups (**Content Area**, **Over-Glass**, Input/Knob/Track/Segmented recipes, shadow/border
> recipes) are intentionally **excluded** — a later spec covers control recipes.

# macOS 27 Design Tokens

## Type ramp — SF Pro (Default leading)

One optical **SF Pro** family (the ≤19 pt "Text" / ≥20 pt "Display" split is an optical-size
breakpoint, not two files). Default text color is **`#000000` @ 0.85 alpha** (light) for every
style. Leading pt = size × line-height ratio (shown rounded). Emphasized weight is **per-style,
non-uniform** — do not assume "bold = 700".

| # | Style | Size (pt) | Default wt | Emphasized wt | Leading (pt) | lh ratio |
|---|---|---|---|---|---|---|
| 01 | LargeTitle | 26 | 400 | **700** | 32 | 1.231 |
| 02 | Title1 | 22 | 400 | **700** | 26 | 1.182 |
| 03 | Title2 | 17 | 400 | **700** | 22 | 1.294 |
| 04 | Title3 | 15 | 400 | **600** | 20 | 1.333 |
| 05 | Headline | 13 | **700** | **900** | 16 | 1.231 |
| 06 | Body | 13 | 400 | **600** | 16 | 1.231 |
| 07 | Callout | 12 | 400 | **600** | 15 | 1.250 |
| 08 | Subheadline | 11 | 400 | **600** | 14 | 1.273 |
| 09 | Footnote | 10 | 400 | **600** | 13 | 1.300 |
| 10 | Caption1 | 10 | 400 | **600** | 13 | 1.300 |
| 11 | Caption2 | 10 | 400 | **600** | 13 | 1.300 |

- **Headline is w700 at Default** (the only style bolder than Regular by default) and w900 Emphasized.
- LargeTitle/Title1/Title2 Emphasized = w700; all lower tiers Emphasized = w600.
- Letter-spacing (tracking) = 0 for every style at every leading. Body floor = 13 pt; smallest
  legible = 10 pt. Apply via `NSFont` text styles / SwiftUI `.font(.body)` etc.

### Loose / Tight leading variants

The export ships two alternate leadings per style (same size/weight, different lh ratio). Compressed
to ratios below (leading pt = size × ratio); Default column repeated for reference.

| Style | Tight lh | Default lh | Loose lh |
|---|---|---|---|
| LargeTitle | 1.154 | 1.231 | 1.308 |
| Title1 | 1.091 | 1.182 | 1.273 |
| Title2 | 1.176 | 1.294 | 1.412 |
| Title3 | 1.200 | 1.333 | 1.467 |
| Headline | 1.077 | 1.231 | 1.385 |
| Body | 1.077 | 1.231 | 1.385 |
| Callout | 1.083 | 1.250 | 1.417 |
| Subheadline | 1.091 | 1.273 | 1.455 |
| Footnote | 1.100 | 1.300 | 1.500 |
| Caption1 | 1.100 | 1.300 | 1.500 |
| Caption2 | 1.100 | 1.300 | 1.500 |

### Secondary Style

Auxiliary/secondary text style: SF Pro **17 px w400**, lh 1.294, color **`#333333` @ 0.62 alpha**.

## Labels (6 tiers)

Alpha-on-black (light) / alpha-on-white (dark). Apply `NSColor.labelColor` … `quaternaryLabelColor`
(+ tertiary) semantically; tiers 5–6 have no named AppKit constant.

| Tier | Light (#000000 α) | Dark (#FFFFFF α) |
|---|---|---|
| 1 Primary | 0.85 | 1.0 |
| 2 Secondary | 0.5 | 0.55 |
| 3 Tertiary | 0.25 | 0.25 |
| 4 Quaternary | 0.1 | 0.1 |
| 5 Quinary | 0.05 | 0.05 |
| 6 Seximal | 0.03 | 0.03 |

### Vibrant label ramps (composited on a material)

Solid greys composited with the plus-lighter (dark) / plus-darker (light) blend convention — these
are NOT the plain alpha ladder above; use over vibrancy surfaces.

| Tier | Dark Vibrant *(plus-lighter)* | Light Vibrant *(plus-darker)* |
|---|---|---|
| 1 Primary | `#FFFFFF` α0.96 | `#363636` |
| 2 Secondary | `#8A8A8A` | `#737373` |
| 3 Tertiary | `#4D4D4D` | `#B3B3B3` |
| 4 Quaternary | `#262626` | `#D9D9D9` |
| 5 Quinary | `#121212` | `#E6E6E6` |
| 6 Seximal | — | `#FAFAFA` |

*(Dark Vibrant ships tiers 1–5; light ships 1–6.)*

## Fills (5 tiers)

| Tier | Light (#000000 α) | Dark (#FFFFFF α) |
|---|---|---|
| 1 Primary | 0.1 | 0.1 |
| 2 Secondary | 0.08 | 0.08 |
| 3 Tertiary | 0.05 | 0.05 |
| 4 Quaternary | 0.03 | 0.03 |
| 5 Quinary | 0.02 | 0.02 |

### Vibrant fills

| Tier | Light Vibrant *(plus-darker)*, #000000 α | Dark Vibrant *(plus-lighter)*, #FFFFFF α |
|---|---|---|
| 1 Primary | 0.15 | 0.14 |
| 2 Secondary | 0.07 | 0.08 |
| 3 Tertiary | 0.05 | 0.05 |
| 4 Quaternary | 0.03 | 0.04 |
| 5 Quinary | 0.02 | 0.03 |

## System colors

macOS 27 (post June 2025 refresh). Solid base + vibrant variants (plus-darker light / plus-lighter
dark). Apply `NSColor.systemRed` … and `controlAccentColor` (user-chosen, default = Blue).

| # | Color | Light | Dark | Light Vibrant *(plus-darker)* | Dark Vibrant *(plus-lighter)* |
|---|---|---|---|---|---|
| 1 | Red | `#FF383C` | `#FF4245` | `#F52F32` | `#FF4747` |
| 2 | Orange | `#FF8D28` | `#FF9230` | `#F58625` | `#FF9E33` |
| 3 | Yellow | `#FFCC00` | `#FFD600` | `#F5C200` | `#FFE014` |
| 4 | Green | `#34C759` | `#30D158` | `#26BF4D` | `#3BDB63` |
| 5 | Mint | `#00C8B3` | `#00DAC3` | `#00BDA9` | `#2DE0CD` |
| 6 | Teal | `#00C3D0` | `#00D2E0` | `#00B3BF` | `#2DD7E0` |
| 7 | Cyan | `#00C0E8` | `#3CD3FE` | `#00ABCF` | `#47D8FC` |
| 8 | Blue | `#0088FF` | `#0091FF` | `#0078F0` | `#0A99FF` |
| 9 | Indigo | `#6155F5` | `#6D7CFF` | `#5C50E6` | `#7163FF` |
| 10 | Purple | `#CB30E0` | `#DB34F2` | `#B72BC9` | `#E647FC` |
| 11 | Pink | `#FF2D55` | `#FF375F` | `#F5234B` | `#FF4169` |
| 12 | Brown | `#AC7F5E` | `#B78A66` | `#9E7354` | `#C29672` |

> These differ from the iOS accent hexes in [[design-tokens]]/[[color]] (macOS 27 shifted blue/red/
> orange/teal/mint/cyan/indigo/purple/brown; green & pink unchanged; yellow-dark now `#FFD600`).

## Grays

| Variant | Black | Grey | White |
|---|---|---|---|
| Light | `#000000` | `#8E8E93` | `#FFFFFF` |
| Light Vibrant *(plus-darker)* | `#000000` | `#848489` | `#FFFFFF` |
| Dark | `#000000` | `#98989D` | `#FFFFFF` |
| Dark *(plus-lighter)* | `#000000` | `#A2A2A7` | `#FFFFFF` |

## Window backgrounds & Windows

Apply `NSColor.windowBackgroundColor` (resolves per appearance); hex is a design aid.

| Token | Light | Dark |
|---|---|---|
| Window Background (base) | `#FFFFFF` | `#1E1E1E` |
| Window · **No Sidebar** fill (active + inactive) | `#FFFFFF` | `#1E1E1E` |
| Window · **With Sidebar** fill (active + inactive) | `#FFFFFF` | `#000000` |

> With-sidebar dark windows go to pure `#000000` behind the sidebar; no-sidebar dark stays `#1E1E1E`.
> *(Window shadow/border recipe rows are excluded.)*

### Sidebar background

| State | Light | Dark |
|---|---|---|
| Active (key window) | `#FAFAFA` α0.8 | `#0C0C0C` α0.85 |
| Inactive | `#F4F4F4` | `#2E2E2E` α0.85 |

*(macOS 27 restores the active-window sidebar color — this is that value.)*

### Panels

Auxiliary/utility panel fills (shadow rows excluded): Light `#FFFFFF`; Dark = the Window Background
dark base (`#1E1E1E`).

## Materials (5 thicknesses)

Single-fill blur tint + alpha, thinnest → thickest. Apply SwiftUI `Material` / `NSVisualEffectView`.
All 5 thicknesses are real values in the export (incl. **Ultra Thick**).

| Material | Light | Dark |
|---|---|---|
| Ultra Thin | `#ECECEC` α0.38 | `#292929` α0.4 |
| Thin | `#ECECEC` α0.5 | `#292929` α0.49 |
| Regular | `#ECECEC` α0.63 | `#2C2C2C` α0.61 |
| Thick | `#ECECEC` α0.76 | `#2C2C2C` α0.71 |
| Ultra Thick | `#ECECEC` α0.88 | `#2C2C2C` α0.82 |

## Liquid Glass

Numeric fill stacks (top → bottom) for the macOS 27 glass surfaces. Version-dependent; apply via
`.glassEffect()` — these are the design-resource composites, not an API. *(Shadow-recipe rows are
excluded; each surface's shadow lives in the export.)*

| Surface | Light fills | Dark fills |
|---|---|---|
| Dock | `#4D4D4D` α0.3 · `#1A1A1A` α0.1 · `#FFFFFF` α0.08 | `#454545` α0.5 · `#1A1A1A` α0.1 · `#FFFFFF` α0.08 |
| Menus | `#E6E6E6` α0.55 | `#5A5A5A` α0.5 |
| Notification | `#BFBFBF` α0.25 · `#1A1A1A` | `#666666` α0.1 |
| Regular — Small | `#000000` α0.25 · `#FFFFFF` α0.25 · `#444444` α0.6 · `#F8F8F8` α0.2 | `#000000` · `#999999` α0.17 |
| Regular — Medium | `#FFFFFF` α0.7 · `#BFBFBF` α0.1 | `#1A1A1A` α0.5 · `#1A1A1A` α0.9 · `#1A1A1A` |
| Regular — Large | `#FFFFFF` α0.7 · `#BFBFBF` α0.1 | `#1A1A1A` α0.5 · `#1A1A1A` α0.5 · `#1A1A1A` |

> The export's Regular set is **size-based (Small/Medium/Large)**, plus Inactive/Tinted variants
> (omitted here) — it does not map to a "regular vs clear" split. See [[liquid-glass]].

## Separators

| Token | Value |
|---|---|
| Separator (light) | `#3C3C43` α0.29 |

*(Export ships the light separator only; apply `NSColor.separatorColor` for the dark-adaptive value.)*

## Focus ring & glyphs

**Global Focus Ring** — two stacked strokes, both `#0088FF`: outer α0.25, inner α0.15. (Input-field
focus borders are 3.5 px + 1 px; those live in the excluded control-recipe groups.) Color-area
outline = `#000000` α0.1.

**Glyph fills** (toolbar/control symbols):

| Role | Light | Dark |
|---|---|---|
| Neutral — Idle | `#000000` α0.7 | `#FFFFFF` α0.7 |
| Neutral — Disabled | `#000000` α0.22 | `#FFFFFF` α0.22 |
| Colored — Idle/Disabled | System Blue | System Blue |

## Window chrome — shadows & borders

Window drop shadows + the dark hairline border, by sidebar presence × window activation. Shadow columns
are **blur / color·alpha / offset-y / spread** (px @1× = pt); offset-x is 0. Every window shadow is a
**two-layer** stack: a large soft ambient shadow over a 1 px near-opaque contact line
(`blur 1 · #000000 α0.8 · y0 · spread 0`), so only the ambient (layer 0) varies — the contact layer is
constant and noted once below.

**Ambient shadow (layer 0):**

| Config | Activation | Light | Dark |
|---|---|---|---|
| No Sidebar | Active | blur 100 · `#000000` α0.4 · y+36 | blur 33 · `#000000` α0.4 · y+16 |
| No Sidebar | Inactive | blur 32 · `#000000` α0.2 · y+16 | blur 32 · `#000000` α0.2 · y+16 |
| With Sidebar | Active | blur 100 · `#000000` α0.4 · y+36 | blur 100 · `#000000` α0.4 · y+36 |
| With Sidebar | Inactive | blur 32 · `#000000` α0.2 · y+16 | blur 32 · `#000000` α0.2 · y+16 |

*Contact layer (layer 1), constant for all four configs and both appearances:* blur 1 · `#000000` α0.8
· y0 · spread 0.

> Dark **No-Sidebar Active** is softer/tighter (blur 33, y+16) than Light No-Sidebar Active (blur 100,
> y+36); With-Sidebar Active is blur 100 / y+36 in **both** appearances.

**Window border** (only the appearance/config that carries one is in the export):

| Config | Activation | Appearance | Border |
|---|---|---|---|
| No Sidebar | Active | Dark | 1 px `#FFFFFF` α0.2 |
| (all others) | — | — | — *(no border stroke in export)* |

## Panels — border & shadow

Auxiliary/utility panel chrome (the fills are already in the surfaces table). Same two-layer shadow
model as windows.

| Appearance | Border | Shadow |
|---|---|---|
| Light | — *(none)* | blur 20 · `#000000` α0.3 · y+5 · spread 0 |
| Dark | 1 px `#FFFFFF` α0.2 | blur 33 · `#000000` α0.4 · y+16 · spread 0  ·  blur 1 · `#000000` α0.8 · y0 · spread 0 |

*(Dark Panel shadow = the same two-layer ambient+contact stack as Window No-Sidebar Active Dark; Light
Panel is a single soft layer.)*

## Liquid Glass — surface shadows

The surfaces table carries only the glass **fills**; this is the matching **shadow** column. Each glass
surface's shadow is a deep multi-layer stack (ambient drop + hairline rim + inner edge highlights); the
compact table gives the **primary drop layer** (the visually dominant ambient shadow — layer 0 unless
noted) per surface. Full layer stacks are in the local export if a redline needs them.

| Surface | Light — primary drop | Dark — primary drop |
|---|---|---|
| Dock | blur 0 · `#000000` α0.25 · y0 · spread 0.5 *(rim; ambient built from inner layers)* | blur 0 · `#000000` α0.25 · y0 · spread 0.5 |
| Menus | blur 24 · `#000000` α0.3 · y+4 | blur 24 · `#000000` α0.3 · y+4 |
| Notification | blur 16 · `#000000` α0.1 · y+4 | blur 16 · `#000000` α0.1 · y+4 |
| Regular — Small | blur 20 · `#D9D9D9` α1 · x±20 · spread −30 *(side rim; + blur 15 `#000000` α0.02 y+8)* | blur 20 · `#B2B2B2` α1 · x±20 · spread −30 *(+ blur 15 `#000000` α0.04 y+8)* |
| Regular — Medium | blur 46 · `#000000` α0.25 · y+18 | blur 48 · `#000000` α0.45 · y+18 |
| Regular — Large | blur 46 · `#000000` α0.25 · y+18 | blur 48 · `#000000` α0.45 · y+18 |

> Dark Regular Medium/Large ambient shadows are heavier (blur 48, α0.45) than Light (blur 46, α0.25).
> The Small glass surfaces have **no single ambient drop** — their depth comes from horizontal rim
> shadows (`x±20, spread −30`) plus a faint `y+8` contact; the row shows those. Dock's depth is likewise
> rim-driven (`spread 0.5`), not a y-offset drop.

*(This addendum's Grays trio is already present in the static draft's "Grays" section — Black/Grey/White
× Light / Light Vibrant (plus-darker) / Dark / Dark (plus-lighter) — so it is **not** duplicated here.)*

See also: [[color]], [[typography]], [[materials]], [[liquid-glass]], [[design-tokens]], [[macos]].
