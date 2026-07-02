---
title: Design Tokens — watchOS
source_url: https://developer.apple.com/design/resources/
platforms: [watchos]
value_type: exact-spec
last_verified: 2026-07-01
---

# Design Tokens — watchOS (Apple Watch)

> 🔢 **exact-spec / version-dependent.** Transcribed from the current-generation (June 2026, "27"
> era) **Apple Design Resources** watchOS UI Kit token export. watchOS is **SF Compact** with its
> own type ramp — do **not** reuse the iOS ramp. Sizes are in **pt** (the export encodes px at 1×,
> where 1 px = 1 pt). Values are a **design aid** and may shift release to release — apply through
> the API (`Font.system` / `Color`), never hard-code. See [[typography]], [[color]], and the
> consolidated [[design-tokens]] (iOS reference set).

> ⌚ **Per-watch-size ramp.** The watch type ramp scales across five case-size classes
> (`1 xSmall`, `2 Small (38mm)`, `3 Large (40/41/42mm)`, `4 xLarge (44/45/49mm)`, `5 xxLarge`,
> `6 xxxLarge`). Tables below **lead with the default `3 Large (40 mm + 41 mm + 42 mm)` tier** and
> give the full min→max range in a note. Each style is identical across Left / Center / Right
> alignment (only the alignment property differs) and all ramp text tokens carry color `#FFFFFF`
> (dark-context default) with letter-spacing `0`.

## Type ramp — watchOS (SF Compact, default `3 Large` tier)

All styles **SF Compact**, letter-spacing 0. Weight is Regular (400) except **Headline** = Semibold
(600). Leading (pt) = size × line-height ratio. This export encodes **no separate Bold/emphasized
ramp** — only the single weight per style shown here.

| Style | Weight | Size (pt) | Leading (pt) | lh ratio |
|---|---|---|---|---|
| Large Title | Regular | 36 | 38.5 | 1.069 |
| Title 1 | Regular | 34 | 36.5 | 1.074 |
| Title 2 | Regular | 28 | 30.5 | 1.089 |
| Title 3 | Regular | 19 | 21.5 | 1.132 |
| Headline | **Semibold** | 16 | 18.5 | 1.156 |
| Body | Regular | 16 | 18.5 | 1.156 |
| Caption 1 | Regular | 15 | 17.5 | 1.167 |
| Caption 2 | Regular | 14 | 16.5 | 1.179 |
| Footnote 1 | Regular | 13 | 15.5 | 1.192 |
| Footnote 2 | Regular | 12 | 14.5 | 1.208 |

- **watch-specific:** the ramp carries **two Footnote tiers** (Footnote 1 and Footnote 2 —
  smaller than iOS's single Footnote) and **no Callout / Subhead** style. `Footnote 2` bottoms out
  at **10 pt** (`1 xSmall`), the smallest text in the kit.

### Per-size series (all six size classes)

Size pt *(lh ratio)* per size class: `1 xSmall · 2 Small (38mm) · 3 Large (40–42mm, default) ·
4 xLarge (44/45/49mm) · 5 xxLarge · 6 xxxLarge`. Weight is constant per style; the lh ratio
loosens as sizes shrink. (Each style also ships Left/Center/Right-aligned variants — same values.)

| Style | 1 xS | 2 S (38mm) | 3 L (default) | 4 xL | 5 xxL | 6 xxxL |
|---|---|---|---|---|---|---|
| Large Title | 30 (1.083) | 32 (1.078) | 36 (1.069) | 40 (1.063) | 41 (1.061) | 42 (1.060) |
| Title 1 | 28 (1.089) | 30 (1.083) | 34 (1.074) | 38 (1.066) | 39 (1.064) | 40 (1.063) |
| Title 2 | 24 (1.104) | 26 (1.096) | 28 (1.089) | 30 (1.083) | 31 (1.081) | 32 (1.078) |
| Title 3 | 17 (1.147) | 18 (1.139) | 19 (1.132) | 20 (1.125) | 21 (1.119) | 22 (1.114) |
| Headline | 14 (1.179) | 15 (1.167) | 16 (1.156) | 17 (1.147) | 18 (1.139) | 19 (1.132) |
| Body | 14 (1.179) | 15 (1.167) | 16 (1.156) | 17 (1.147) | 18 (1.139) | 19 (1.132) |
| Caption 1 | 13 (1.192) | 14 (1.179) | 15 (1.167) | 16 (1.156) | 17 (1.147) | 18 (1.139) |
| Caption 2 | 12 (1.208) | 13 (1.192) | 14 (1.179) | 15 (1.167) | 16 (1.156) | 17 (1.147) |
| Footnote 1 | 11 (1.227) | 12 (1.208) | 13 (1.192) | 14 (1.179) | 15 (1.167) | 16 (1.156) |
| Footnote 2 | 10 (1.250) | 11 (1.227) | 12 (1.208) | 13 (1.192) | 14 (1.179) | 15 (1.167) |

## Colors — System (watchOS palette)

Watch system colors are dark-context tuned and **match the iOS 27 dark-appearance palette** (the
watch UI is always dark) — e.g. watch Blue `#0091FF` = iOS 27 dark Blue (iOS light is `#0088FF`),
watch Red `#FF4245` = iOS 27 dark Red. There is no light column on watchOS. Apply via `Color.red`
etc.; these hexes are a design aid.

| # | token | hex |
|---|---|---|
| 1 | Red | #FF4245 |
| 2 | Orange | #FF9230 |
| 3 | Yellow | #FFD600 |
| 4 | Green | #30D158 |
| 5 | Mint | #00DAC3 |
| 6 | Teal | #00D2E0 |
| 7 | Cyan | #3CD3FE |
| 8 | Blue | #0091FF |
| 9 | Indigo | #6D7CFF |
| 10 | Purple | #DB34F2 |
| 11 | Pink | #FF375F |
| 12 | Brown | #B78A66 |
| — | System Grey | #9BA0AA |
| — | System White | #F2F4FC |

## Labels

The opaque **Labels** group in this export carries a single entry — the light-appearance primary
label. The full label ladder (Primary → Quaternary) lives in **Vibrant Labels** below, which is
how watchOS renders label tiers over the dark, vibrant UI.

| token | hex |
|---|---|
| Primary (Light) | #000000 |

## Vibrant families

watchOS layers content over blurred, vibrant backgrounds. Each vibrant token is a **stack of fills**
(indices `0…n`, listed background→foreground) that composite to the effective color; alpha shown as
`a=` (omitted = 1.0). Reproduce by layering the fills in order — a single flat hex will not match.

### Vibrant Backgrounds

| material | fills (index :: hex a=) |
|---|---|
| Ultra Thin | 0 #3D3D3D a=0.5 · 1 #D9D9D9 |
| Thin | 0 #3D3D3D a=0.53 · 1 #D9D9D9 |
| Regular | 0 #666666 a=0.7 · 1 #B5B5B5 |
| Thick | 0 #262626 a=0.83 · 1 #D9D9D9 |
| Vibrant Blur Top | gradient: #000000 a=1 @0 → #000000 a=0 @1 |
| Vibrant Blur Bottom | gradient: #000000 a=0 @0 → #000000 a=1 @1 |

- The two **Vibrant Blur** entries are two-stop vertical gradients (top = opaque black fading out;
  bottom = transparent black fading in) — edge scrims for content legibility.

### Vibrant Colors

Each hue is a 5-fill stack: fill `0` is a neutral `#808080` scrim (alpha varies), fills `1–4` are
the tinted hue at varying alpha. Hue and per-fill alpha:

| hue | tint hex | fill alphas 0·1·2·3·4 |
|---|---|---|
| Blue | #2094FA | 0.45 · 0.4 · 0.5 · 0.5 · 0.45 |
| Cyan | #5AC8FA | 0.65 · 0.6 · 0.6 · 0.45 · 0.45 |
| Green | #04DE71 | 0.55 · 0.5 · 0.65 · 0.4 · 0.5 |
| Indigo | #787AFF | 0.45 · 0.4 · 0.4 · 0.5 · 0.7 |
| Mint | #00F5EA | 0.5 · 0.5 · 0.4 · 0.35 · 0.65 |
| Orange | #FF9500 | 0.6 · 0.55 · 0.5 · 0.55 · 0.35 |
| Pink | #FA114F | 0.45 · 0.4 · 0.2 · 0.7 · 0.7 |
| Red | #FF3B30 | 0.6 · 0.5 · 0.45 · 0.6 · 0.6 |
| Yellow | #FFD60A | 0.8 · 0.65 · 0.4 · 0.3 · 0.55 |

- Fill `0` alpha is the neutral `#808080` scrim; fills `1–4` use the **tint hex** at the listed
  alpha. (Note, compressed — the per-fill hex is constant per hue; only alpha varies.)

### Vibrant Fill

Three-fill stacks (0 = white overlay, 1 = dark base, 2 = a red plus-lighter accent marker).

| tier | fill 0 | fill 1 | fill 2 |
|---|---|---|---|
| Primary | #FFFFFF a=0.25 | #262626 | #FF0000 a=0.5 |
| Secondary | #FFFFFF a=0.06 | #1A1A1A | #FF0000 a=0.3 |
| Tertiary | #FFFFFF a=0.06 | #0F0F0F | #FF0000 a=0.3 |

### Vibrant Labels

The watch label ladder. Primary is a single opaque white; Secondary → Quaternary are stacks
(0 = white overlay, 1 = dark base, 2 = a red accent marker).

| tier | fill 0 | fill 1 | fill 2 |
|---|---|---|---|
| Primary | #FFFFFF | — | — |
| Secondary | #FFFFFF a=0.24 | #404040 | #FF0000 a=0.7 |
| Tertiary | #FFFFFF a=0.08 | #2B2B2B | #FF0000 a=0.6 |
| Quaternary | #FFFFFF a=0.08 | #1A1A1A | #FF0000 a=0.5 |

- The `#FF0000` fills across Vibrant Fill/Labels are **design-time accent markers** (the export's
  swatch for "tint goes here"), not literal red — the effective tint comes from the face/app accent.

## Notes

- **Complications** draw text as **SF Compact / rounded numerals**; see [[complications]].
- **Materials / Liquid Glass:** the watch export exposes vibrancy through the Vibrant families above
  rather than a separate materials group. See [[materials]], [[liquid-glass]].
- **No Fill ladder, gray ramp, separator, or focus-ring group** is present in this watchOS export —
  those tiers are expressed through the Vibrant families. See [[color]] for the cross-platform model.

See also: [[design-tokens]], [[color]], [[typography]], [[complications]], [[watchos]].