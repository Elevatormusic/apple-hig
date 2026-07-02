---
title: Design Tokens — visionOS (Apple Vision Pro)
source_url: https://developer.apple.com/design/resources/
platforms: [visionos]
value_type: exact-spec
last_verified: 2026-07-01
---

> 🔢 **exact-spec / version-dependent.** Transcribed from the current-generation (June 2026,
> "27" / Golden Gate era) **Apple Design Resources** visionOS token export. Apple states these
> values are *for reference during design* and **may change from release to release** — re-verify
> on Apple. In code, apply the **semantic API** (`Color` / `UIColor`); hex is a design aid, not a
> runtime constant. See [[color]], [[typography]], [[materials]], [[liquid-glass]], [[visionos]],
> [[spatial-layout]].

# Design Tokens — visionOS (Apple Vision Pro)

visionOS UI is drawn **on glass, floating over unpredictable passthrough**, so the token export is
organized differently from iOS/macOS: color and type share **numbered groups** (`1 Red`, `2 XL
Title 2 …`), and every text style carries a **vibrancy tier** column rather than a single fixed
color. Foreground colors are **white by default** (light text reads on the dark-tinted glass) with
label-alpha baked in.

## Type ramp (SF Pro, default size)

visionOS extends the ramp upward with two **XL Title** display styles above Large Title. Sizes and
leading are from the export (leading = size × line-height ratio, rounded to pt). Group numbers are
the export's ordering.

| Style | Weights present | Size (pt) | Leading (pt) | Notes |
|---|---|---|---|---|
| XL Title 1 (grp 1) | Semibold, Bold | 48 | 56 | display, above Large Title |
| XL Title 2 (grp 2) | Semibold, Bold | 38 | 46 | display |
| Large Title (grp 3) | Semibold, Bold | 29 | 38 | vs iOS 34 pt |
| Title 1 (grp 4) | Medium, Semibold, Bold | 24 | 32 | |
| Title 2 (grp 5) | Medium, Semibold, Bold | 22 | 28 | |
| Title 3 (grp 6) | Medium, Semibold, Bold | 19 | 24 | vs iOS 20 pt |
| Headline (grp 7) | Semibold, Bold | 17 | 22 | |
| Body (grp 8) | Regular, Medium | 17 | 22 | |
| Subheadline (grp 9) | Regular | 15 | 20 | |
| Callout (grp 10) | Medium, Semibold | 15 | 20 | vs iOS 16 pt |
| Footnote (grp 11) | Regular, Medium, Bold | 13 | 18 | |
| Caption 1 & 2 (grp 12) | Regular, Medium, Bold | 12 | 16 | one combined group |

Font: **SF Pro**, tracking (letter-spacing) **0** at every style in the export. Weight map:
Regular = 400, Medium = 500, Semibold = 600, Bold = 700. Only the weights listed above ship per
style (e.g. XL Titles have no Regular; Subheadline is Regular-only; Caption 1 and 2 share one
size). Apply via `.font(.largeTitle)` / `.extraLargeTitle` / `.extraLargeTitle2`; never hardcode pt.

## Text vibrancy tiers (foreground on glass)

Each text style resolves through **five foreground tiers** (the per-style color column). This is the
visionOS equivalent of iOS label/secondaryLabel — pick a tier, not a hex.

| Tier | Resolves to | Meaning |
|---|---|---|
| 1 Primary | White (Labels) = #FFFFFF **α 0.96** (some styles #FFFFFF α 0.96 inline) | default text |
| 2 Vibrant Secondary | White (Labels) / #FFFFFF (opaque on smaller styles) | secondary, vibrant |
| 3 Vibrant Tertiary | White (Labels) / #FFFFFF | tertiary, vibrant |
| 4 Quaternary | #FFFFFF (a few styles α 0.96) | least-emphasis |
| 5 Black | Black = #000000 (a few styles α 0.96) | for light/inverted surfaces |

Note (compression): tiers 2–4 are **white** on essentially every style; the display styles (grp
1–2) and some large titles pin tier 1 to `White (Labels)` while the mid/small styles inline
`#FFFFFF α 0.96`. Tier 5 Black is `{Black}` on most styles, `#000000 α 0.96` on a handful
(Headline, Body Medium, Callout Medium). Treat these as **API tokens** (`.primary` /
`.secondary` …); the alpha deltas are the export's, not something to hardcode.

## System colors (12)

visionOS ships a saturated-for-glass system palette (numbered `1`–`12`). Values differ from iOS —
they're pushed brighter so they hold up over passthrough.

| # | token | hex | # | token | hex |
|---|---|---|---|---|---|
| 1 | Red | #FF4245 | 7 | Cyan | #3CD3FE |
| 2 | Orange | #FF9230 | 8 | Blue | #0091FF |
| 3 | Yellow | #FFD600 | 9 | Indigo | #6B5DFF |
| 4 | Green | #30D158 | 10 | Purple | #DB34F2 |
| 5 | Mint | #00DAC3 | 11 | Pink | #FF375F |
| 6 | Teal | #00D2E0 | 12 | Brown | #B78A66 |

Default tint = **Blue #0091FF**. Apply via `Color.blue` etc. so the system adapts them to the
glass and vibrancy.

## Labels / grays / anchors

| token | hex / alpha | note |
|---|---|---|
| White (Labels) | #FFFFFF **α 0.96** | primary foreground anchor (light text on glass) |
| Labels / Light / 1 Primary | #000000 | primary label on a light surface |
| Labels / Dark - Vibrant / 2 Secondary | #999999 | secondary label, dark vibrant |
| Gray | #98989D | system gray anchor |
| Black | #000000 | anchor |

Note: this export ships a **single system Gray** (not the iOS gray→gray6 ladder) plus the
`White (Labels)` / `Black` anchors and two explicit Labels entries; the full label ladder is
carried per-text-style as the five vibrancy tiers above, not as standalone `secondaryLabel` tokens.

## Materials (glass over passthrough)

visionOS materials are **glass fills + specular borders + shadows** rather than the iOS
ultra-thin→thick blur scale. Fills are given as color + alpha; borders/shadows are recipes (values
below are the fill layer; full border/shadow geometry lives in the raw export).

| Material | Fill | Note |
|---|---|---|
| System Thin | #FFFFFF | thin glass |
| System Regular | #000000 | regular glass base |
| System Thick | #000000 | thick glass base |
| Glass Platter | #959595 **α 0.25** | ornament/platter glass; white specular border |
| Recessed Material View | #000000 **α 0.1** | inset well; soft inner shadow |
| Fills / Primary | #FFFFFF | primary fill over glass |
| Fills / Vibrant Secondary | #FFFFFF | vibrant secondary fill |
| Fills / Vibrant Tertiary | #FFFFFF | vibrant tertiary fill |
| Vibrant Separator | #FFFFFF | separator over glass |
| Buttons / Idle (System Lighter) | #FFFFFF **α 0.08** | rest button glass |
| Buttons / System Light + Blur | #FFFFFF **α 0.08** | |
| Buttons / System Lighter + Specular | #FFFFFF **α 0.08** | + #979797 border, soft shadow |
| Buttons / System Hover | #FFFFFF | look/hover highlight |
| Buttons / Pinched | #FFFFFF **α 0.2** | pinch/press state |
| Buttons / Disabled | #FFFFFF | disabled |

### Border + shadow geometry (specular recipes)

Widths/blurs/offsets in px @1×; offset-x = 0 unless shown.

| Material | Border | Shadow |
|---|---|---|
| Buttons / System Lighter + Specular | #979797 α1, 0.5px | #000000 α0.1, blur 4, offset-y 2 |
| Glass Platter | #FFFFFF α1, 1.4px | — |
| Recessed Material View | — | outer #000000 α0.08, blur 4, offset 1/1.5 · inner highlight #FFFFFF α0.3, blur 1, offset-y −0.5 |

Apply materials via SwiftUI `Material` / `.glassEffect()`; these values are the design-time
appearance, not literals to reproduce.

## What this export does NOT carry

- **No dimension tokens** — no spacing scale, no corner-radius scale, and **no gaze/hit-target
  size** (the 60 pt eye-tracking target lives in [[accessibility]] / [[spatial-layout]], sourced
  from Apple's Accessibility control-size table, not from this token file). Those remain
  **untestable against this export**.
- Excluded per scope: **x- Kit** (Figma plumbing) groups. (visionOS ships no per-control
  state-recipe groups in this export; its material border/shadow geometry is tabled above.)

See also: [[color]], [[typography]], [[materials]], [[liquid-glass]], [[visionos]],
[[spatial-layout]], [[accessibility]].
