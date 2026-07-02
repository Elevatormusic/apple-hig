---
title: Control Tokens — iOS / iPadOS 27
source_url: https://developer.apple.com/design/resources/
platforms: [ios, ipados]
value_type: exact-spec
last_verified: 2026-07-01
---

# Control Tokens — iOS / iPadOS 27 ("Golden Gate")

> 🔢 **exact-spec / version-dependent.** Transcribed from the current-generation (June 2026,
> iOS/iPadOS **27**) **Apple Design Resources** token export (the `Controls` group). Apple states
> these values are for **reference during design** and **fluctuate release to release** — build with
> the semantic controls (`Toggle`, `Slider`) and their system tint, never these hex/alpha as runtime
> constants. Companion to the platform static tables in `references/design-tokens-ios.md`; the deeper
> control recipes live only here. See [[toggles]], [[sliders]], [[design-tokens]], [[color]].
>
> **iOS ships only the toggle / slider-track recipes in this export.** There are **no** button or
> segmented-control state tokens on iOS — those exist on **macOS only** for now. If you need button /
> segmented recipes, use the macOS control-tokens reference.

## How to read these tables

- **Recipes are layered.** A control state can stack multiple fills / borders / shadows. `Layer 0`
  paints first (bottom); higher layers composite on top. Order is preserved from the export.
- **Alias rows** reference a base token elsewhere instead of a literal value; they render with an
  arrow, e.g. `-> System Colors / Blue (light)`. Resolve the arrow in `references/design-tokens-ios.md`.
- **The state axes are explicit in the row/column structure:** *variant* (Filled / Unfilled for
  tracks; the single knob for toggles) × *control-state* (Idle / Clicked / Disabled) × *appearance*
  (Light / Dark). iOS has **no window-activation (Active/Inactive) axis** — that split is macOS-only;
  the export's `Active,` prefix on track names is the literal token name, not a second activation
  state, so it is folded into the variant label below.
- **Missing combinations are an em dash (—)**, never invented. The iOS export ships only the state
  slices listed; e.g. tracks have no `02 - Hovered` and knobs ship idle + a two-part clicked treatment
  only.
- **Vibrancy/blend note:** where a layer is a translucent white/black over a tinted base (e.g. the
  Clicked track's second fill), it is the plus-lighter (white-over) / plus-darker (black-over)
  darkening convention Apple uses to press-darken a control — the same model documented for the
  vibrant label/fill ramps in the static tables.
- Shadow/border px == pt at 1x. `offset-y` positive = downward.

The `Controls` group is **19 rows** total: Knobs - Toggle (7 rows across Light/Dark) + Tracks (12 rows
across Light/Dark). Every row is transcribed below; nothing is compressed or skipped.

## Knobs — Toggle

The moving knob of a `Toggle`. **Idle** = the resting pill knob (a solid white fill + a soft drop
shadow — Light only in the export; Dark inherits the same white knob with no separate idle token).
**Clicked** = the pressed knob, expressed as two stacked border treatments the export names
`… - Glow` (a light rim) and `… - Shadow` (a dark rim). There is **no Disabled knob token**.

### Knob fill + idle shadow

| State | Light | Dark |
|---|---|---|
| 01 Idle · fill | `#FFFFFF` | — |
| 01 Idle · shadow | `#000000` α0.05 · blur 36 · offset-y 3 · spread 0 | — |

### Knob clicked — border layers (Glow then Shadow)

Two named clicked sub-states, each a solid border; layer index preserved.

| Clicked sub-state | Layer | Light | Dark |
|---|---|---|---|
| 03 Clicked · **Glow** | 0 | `#D9D9D9` α1.0 · width 1 | `#000000` α0.2 · width 1 |
| 03 Clicked · **Glow** | 1 | `#FFFFFF` α0.45 · width 0.5 | — |
| 03 Clicked · **Shadow** | 0 | `#000000` α1.0 · width 1 | `#000000` α1.0 · width 1 |

> The Light Glow is a two-layer rim (an opaque light-grey stroke + a translucent white highlight);
> Dark ships only the single translucent-black Glow stroke and the black Shadow stroke. No Glow layer 1
> exists in Dark (—).

## Tracks

The slider/toggle track. Two variants: **Filled** (the tinted, "on" portion) and **Unfilled** (the
recessed, "off" portion). Only the `Active` track set exists in the export (no Inactive track tokens on
iOS). Control-states present: **Idle**, **Clicked**, **Disabled** (Disabled ships for Unfilled only).

### Filled track (the tinted "on" fill)

Layer 0 aliases System Blue (the default control tint); the Clicked state adds a press-darkening
overlay as layer 1.

| Variant / State | Layer | Light | Dark |
|---|---|---|---|
| Active · Filled · 01 Idle | 0 | -> System Colors / Blue (light) `#0088FF` | -> System Colors / Blue (dark) `#0091FF` |
| Active · Filled · 03 Clicked | 0 | -> System Colors / Blue (light) `#0088FF` | -> System Colors / Blue (dark) `#0091FF` |
| Active · Filled · 03 Clicked | 1 | `#000000` α0.08 *(plus-darker press overlay)* | `#FFFFFF` α0.08 *(plus-lighter press overlay)* |
| Active · Filled · 04 Disabled | — | — | — |

> Filled has **no Disabled token** in the export (—). The Clicked overlay flips polarity by
> appearance: black-over in Light, white-over in Dark, both at α0.08 — the standard press-darkening
> convention rather than a distinct color.

### Unfilled track (the recessed "off" fill)

Single-layer neutral fills; polarity flips by appearance (black-on-light, white-on-dark).

| Variant / State | Light | Dark |
|---|---|---|
| Active · Unfilled · 01 Idle | `#000000` α0.1 | `#FFFFFF` α0.1 |
| Active · Unfilled · 03 Clicked | `#000000` α0.19 | `#FFFFFF` α0.19 |
| Active · Unfilled · 04 Disabled | `#000000` α0.1 | `#FFFFFF` α0.1 |

> Unfilled Disabled resolves to the **same value as Idle** (α0.1) in this export — the disabled track
> is dimmed via the knob/label, not the track fill. Only the Unfilled track ships a Disabled token; the
> Filled track does not.

## Coverage of the Controls group

- **Included (19/19):** Knobs - Toggle Idle fill (Light), Idle shadow (Light), Clicked-Glow borders
  (Light L0/L1, Dark L0), Clicked-Shadow border (Light, Dark) — 7 rows; Tracks Filled Idle
  (Light/Dark alias), Filled Clicked L0 alias (Light/Dark) + L1 overlay (Light/Dark), Unfilled
  Idle/Clicked/Disabled (Light/Dark) — 12 rows.
- **Compressed:** none. Multi-layer states are expanded to one row per layer; single-value states are
  one row. Em dashes mark combinations Apple did not ship (Dark idle knob, Filled Disabled, Glow L1
  in Dark).
- **Skipped:** none.

See also: [[toggles]], [[sliders]], [[color]], [[design-tokens]], `references/design-tokens-ios.md`
(static tables), the macOS control-tokens reference (buttons / segmented / input recipes).