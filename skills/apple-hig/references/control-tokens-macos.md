---
title: Control-State Token Recipes — macOS 27 (Golden Gate)
source_url: https://developer.apple.com/design/resources/
platforms: [macos]
value_type: exact-spec
last_verified: 2026-07-01
---

> 🔢 **exact-spec / version-dependent.** Transcribed from the current-generation (June 2026, macOS 27
> "Golden Gate") Apple **Design Resources** token export — the per-control **recipe** groups the
> consolidated [[design-tokens-macos]] surface file intentionally excludes. Apple states documented
> values are **for reference during design** and **may change per release** — re-verify each macOS
> release. In code, never hard-code these: draw controls with the semantic AppKit/SwiftUI control
> types (`NSButton`, `NSSwitch`, `NSSlider`, `NSSegmentedControl`, `Toggle`, `.buttonStyle(...)`,
> `.controlSize(...)`) so the system composites the correct state fills, focus ring, and vibrancy for
> the active appearance, accent, and window state. These tables are a **design aid** for redlining and
> for the whole-app design-QA gate, not runtime constants.
>
> Companion to [[design-tokens-macos]] (surface/type/color tables) and [[design-tokens]] (iOS). The
> **x- Kit** Figma-plumbing group is excluded (internal symbol backgrounds, not a design value).

# macOS 27 Control-State Recipes

## How to read these tables

The export models every control as a **layered recipe**, not a single flat color. Four things to know:

1. **Layers composite bottom-up.** Each cell lists layer **`0`** first (drawn first / lowest), then
   `1`, `2`… painted over it. A one-layer cell is just layer `0`. Multi-layer cells are written
   `layer0 · layer1 · …` in draw order.
2. **Alias rows reference a base token**, shown with an arrow — e.g. `-> System Colors / Blue (dark)`
   points at the macOS 27 System-Colors table in [[design-tokens-macos]], and `-> Fills / Light.1`
   points at that file's Fills ladder. Resolve the arrow to get the literal hex/alpha. Aliases keep the
   recipe honest: when Apple retunes Blue, every "prominent" button follows automatically.
3. **Vibrant layers use a blend, not plain alpha.** A layer tagged *(plus-lighter)* or
   *(plus-darker)* — or aliased to a `… Vibrant (use plus lighter/darker)` group — is composited with
   that Figma blend mode over the material/glass behind it, so it reads as light-on-dark or
   dark-on-light vibrancy rather than a literal fill. This is why the same nominal tier looks different
   on glass (Over-Glass) than on an opaque surface (Content Area).
4. **State numbering is Apple's, and sparse.** States are `01 - Idle`, `03 - Clicked`, `04 - Disabled`.
   **There is no `02`** in the export (the hover/rollover slot is unpopulated — the system derives it
   at runtime). A blank/`—` cell means *that combination is absent from the export* — it is **not**
   invented or interpolated here. Where a variant carries only Active (never Inactive), or only Light
   (never Dark), the missing axis is an em dash.

Two top-level contexts share the identical structure:

- **Content Area** — controls on an opaque window/content background.
- **Over-Glass** — the *same controls* rendered over a Liquid-Glass surface (toolbar, sidebar overlay,
  popover). Same axes; different fills because glass sits behind. The Over-Glass section **tables only
  the deltas** — rows that resolve to the same value as Content Area are marked **"= Content Area"**
  rather than repeated.

Shadow columns are **blur / color·alpha / offset-y / spread**, in **px at 1× (= pt)**; offset-x is 0
for every macOS control shadow in the export unless a value is shown. Border columns are **width /
color / alpha**. All widths in px @1×.

---

# CONTENT AREA

## Buttons — five variants

Rows are the **layered fills**. Axes: variant × state (Idle / Clicked / Disabled) × appearance
(Light / Dark). Layers listed in draw order (`·` separates). Alias arrows resolve into
[[design-tokens-macos]].

### 01 — Bordered

| State | Light | Dark |
|---|---|---|
| Idle | `#000000` α0.08 | `#FFFFFF` α0.07 |
| Clicked | `#000000` α0.16 | `#FFFFFF` α0.16 |
| Disabled | `#000000` α0.04 | `#FFFFFF` α0.04 |

### 02 — Bordered Tinted

Two layers: a System-Blue base under a Fills-tier tint.

| State | Light | Dark |
|---|---|---|
| Idle | -> System Colors / Blue (light) · -> Fills / Light.1 Primary | -> System Colors / Blue (dark) · -> Fills / Dark Vibrant (plus-lighter).1 Primary |
| Clicked | -> System Colors / Blue (**dark**) · -> Fills / Light.1 Primary | -> System Colors / Blue (dark) · -> Fills / Dark Vibrant (plus-lighter).1 Primary |
| Disabled | -> System Colors / Blue (light) · -> Fills / Light.1 Primary | -> System Colors / Blue (dark) · -> Fills / Dark Vibrant (plus-lighter).1 Primary |

> Note the Light **Clicked** base aliases the *Dark* Blue (`System Colors.Dark.8 Blue`) — deliberate in
> the export, a darker-tint press feedback; transcribed as-is, not a typo.

### 03 — Bordered Destructive

Two layers: System-Red base under a Fills tint.

| State | Light | Dark |
|---|---|---|
| Idle | -> System Colors / Red (light) · -> Fills / Light.1 Primary | -> System Colors / Red (dark) · -> Fills / Dark Vibrant (plus-lighter).1 Primary |
| Clicked | -> System Colors / Red (light) · -> Fills / Light.1 Primary | -> System Colors / Red (dark) · -> Fills / Dark Vibrant (plus-lighter).1 Primary |
| Disabled | -> System Colors / Red (light) · -> Fills / Light.1 Primary | -> System Colors / Red (dark) · -> Fills / Dark Vibrant (plus-lighter).1 Primary |

### 04 — Prominent (Default)

The default push button. Light Idle carries a vibrant-fill overlay; Dark Idle is a single Blue layer.

| State | Light | Dark |
|---|---|---|
| Idle | -> System Colors / Blue (light) · -> Fills / Light Vibrant (plus-darker).4 Quaternary | -> System Colors / Blue (dark) |
| Clicked | -> System Colors / Light Vibrant (plus-darker) / Blue · `#000000` α0.1 | -> System Colors / Dark (plus-lighter) / Blue · `#FFFFFF` α0.1 |
| Disabled | -> System Colors / Light Vibrant (plus-darker) / Blue | -> System Colors / Dark (plus-lighter) / Blue |

### 05 — Prominent (Default) Destructive

| State | Light | Dark |
|---|---|---|
| Idle | -> System Colors / Red (light) | -> System Colors / Red (dark) |
| Clicked | -> System Colors / Light Vibrant (plus-darker) / Red · `#000000` α0.1 | -> System Colors / Dark (plus-lighter) / Red · `#FFFFFF` α0.1 |
| Disabled | -> System Colors / Light Vibrant (plus-darker) / Red | -> System Colors / Dark (plus-lighter) / Red |

## Controls (checkbox / radio / switch cell fills)

Axes: **window-activation** (Active / Inactive) × **value** (Off / On) × state × appearance.

### Light

| Activation, Value | Idle | Clicked | Disabled |
|---|---|---|---|
| Active, Off | -> Fills / Light.1 Primary | `#000000` α0.19 | -> Fills / Light.3 Tertiary |
| Active, On | -> System Colors / Blue (light) | -> System Colors / Blue (**dark**) · -> Fills / Light Vibrant (plus-darker).2 Secondary | -> System Colors / Blue (light) · -> Fills / Light Vibrant (plus-darker).3 Tertiary |
| Inactive, Off | -> Fills / Light.1 Primary | `#000000` α0.19 | -> Fills / Light.4 Quaternary |
| Inactive, On | `#000000` α0.14 | `#000000` α0.06 · `#000000` α0.13 | -> Fills / Light.3 Tertiary |

### Dark

| Activation, Value | Idle | Clicked | Disabled |
|---|---|---|---|
| Active, Off | -> Fills / Dark.1 Primary | `#FFFFFF` α0.19 | -> Fills / Dark.3 Tertiary |
| Active, On | -> System Colors / Blue (dark) · -> Fills / Dark Vibrant (plus-lighter).3 Tertiary | -> System Colors / Blue (dark) · -> Fills / Dark Vibrant (plus-lighter).2 Secondary | -> System Colors / Blue (dark) · -> Fills / Dark Vibrant (plus-lighter).3 Tertiary |
| Inactive, Off | -> Fills / Dark.1 Primary | `#FFFFFF` α0.19 | -> Fills / Dark.4 Quaternary |
| Inactive, On | -> Fills / Dark.1 Primary | `#FFFFFF` α0.19 | -> Fills / Dark.4 Quaternary |

## Fills — Default & Selected (6-tier)

Two 6-tier ladders used for row/cell backgrounds inside controls. **Light and Dark are identical** for
both ladders (the export ships the same value in each appearance), so one column each.

| Tier | Default (Light = Dark) | Selected (Light = Dark) |
|---|---|---|
| 1 Primary | `#000000` α0.85 | `#FFFFFF` (α1.0) |
| 2 Secondary | `#000000` α0.5 | `#FFFFFF` α0.55 |
| 3 Tertiary | `#000000` α0.25 | `#FFFFFF` α0.25 |
| 4 Quaternary | `#000000` α0.1 | `#FFFFFF` α0.1 |
| 5 Quinary | `#000000` α0.05 | `#FFFFFF` α0.05 |
| 6 Seximal | `#000000` α0.03 | `#FFFFFF` α0.025 |

## Input Fields

Fills plus **borders**. Focus ring is **two stacked strokes** (3.5 px outer + 1 px inner), both aliasing
System Blue for the active appearance. Border color/alpha shown; width in px.

| State | Appearance | Fill | Border(s) |
|---|---|---|---|
| Idle | Light | `#FFFFFF` | 1 px `#000000` α0.05 |
| Idle | Dark | `#1E1E1E` | 1 px `#FFFFFF` α0.04 |
| Focus Ring | Light | — | **3.5 px** -> System Colors / Blue (light) · **1 px** -> System Colors / Blue (light) |
| Focus Ring | Dark | — | **3.5 px** -> System Colors / Blue (dark) · **1 px** -> System Colors / Blue (dark) |
| Disabled | Light | `#FFFFFF` α0.5 | 1 px `#000000` α0.04 |
| Disabled | Dark | `#1E1E1E` α0.5 | 1 px `#000000` α0.04 |

*(Focus Ring rows carry no fill — only the two strokes; the field keeps its Idle fill underneath.)*

## Knobs — Toggle (switch thumb)

Layered fills + a multi-layer inner/outer shadow. The **Clicked - Glow** and **Clicked - Shadow**
sub-nodes are separate **border** strokes drawn during the press.

### Fills

| State | Appearance | Fills (draw order) |
|---|---|---|
| Idle | Light | `#FFFFFF` |
| Idle | Dark | `#FFFFFF` α0.65 · `#FFFFFF` α0.45 · `#FFFFFF` α0.35 |
| Clicked | Light | `#FFFFFF` α0 · `#FF0000` |
| Clicked | Dark | `#FFFFFF` α0 |
| Disabled | Light | `#FFFFFF` α0.65 · `#FFFFFF` α0.45 · `#FFFFFF` α0.35 |
| Disabled | Dark | `#FFFFFF` α0.65 · `#FFFFFF` α0.45 · `#FFFFFF` α0.35 |

> The Light **Clicked** layer 1 is a full-opacity `#FF0000` — almost certainly a Figma authoring marker
> left in the export, not a real red thumb. Transcribed verbatim per the no-invention rule; **do not
> ship a red toggle** — treat layer 1 here as a placeholder.

### Shadows (blur / color·α / offset-y / spread, px)

The Light-Idle and Light-Disabled toggle shadows are single simple drop shadows; every other populated
toggle-shadow cell is the **same 6-layer stack** (a soft ambient + tight contact + two offset white rim
highlights + a hairline white ring):

| State | Appearance | Shadow |
|---|---|---|
| Idle | Light | 1 layer: blur 36 · `#000000` α0.05 · y+3 · spread 0 |
| Idle | Dark | 6-layer stack ▼ |
| Clicked | Light | 6-layer stack ▼ |
| Clicked | Dark | 6-layer stack ▼ |
| Disabled | Light | 6-layer stack ▼ |
| Disabled | Dark | 6-layer stack ▼ |

**6-layer stack ▼** (identical wherever referenced above):

| # | blur | color·α | offset (x,y) | spread |
|---|---|---|---|---|
| 0 | 44 | `#000000` α0.1 | 0, 0 | 0 |
| 1 | 4 | `#000000` α0.05 | 0, 0 | −0.5 |
| 2 | 1 | `#000000` α0.05 | 0, 0 | −0.25 |
| 3 | 1 | `#FFFFFF` α1 | 1.75, 2.5 | −1.5 |
| 4 | 2 | `#FFFFFF` α1 | −1.75, −2.5 | −1.5 |
| 5 | 1 | `#FFFFFF` α0.1 | 0, 0 | 0 |

### Clicked press borders

| Sub-node | Appearance | Border(s) |
|---|---|---|
| Clicked - Glow | Light | 1 px `#D9D9D9` (α1) · 0.5 px `#FFFFFF` α0.45 |
| Clicked - Glow | Dark | 1 px `#000000` α0.2 |
| Clicked - Shadow | Light | 1 px `#000000` (α1) |
| Clicked - Shadow | Dark | 1 px `#000000` (α1) |

## Knobs — Sliders

The export ships **only Light / Idle** for the slider knob (Dark and other states absent → em dash).

| State | Appearance | Fill | Shadow |
|---|---|---|---|
| Idle | Light | `#FFFFFF` | blur 5 · `#000000` α0.1 · y+1 · spread 0 |
| Idle | Dark | — | — |
| (other states) | — | — | — |

## Segmented Control

Only the **Active, On** selected-segment recipe is exported (unselected segments inherit the Bordered
button / Fills tiers). Two layers: Blue base + vibrant-fill overlay.

| State | Light | Dark |
|---|---|---|
| Idle | -> System Colors / Blue (light) · -> Fills / Light Vibrant (plus-darker).4 Quaternary | -> System Colors / Blue (dark) · -> Fills / Dark Vibrant (plus-lighter).4 Quaternary |
| Clicked | -> System Colors / Blue (light) · -> Fills / Light Vibrant (plus-darker).1 Primary | -> System Colors / Blue (dark) · -> Fills / Dark Vibrant (plus-lighter).1 Primary |
| Disabled | -> System Colors / Blue (light) · -> Fills / Light Vibrant (plus-darker).4 Quaternary | -> System Colors / Blue (dark) · -> Fills / Dark Vibrant (plus-lighter).4 Quaternary |

## Tracks (slider / progress groove)

Axes: activation (Active / Inactive) × **Filled** (the progress side) / **Unfilled** (the remainder) ×
state. Filled Idle = accent; Unfilled = a Fills tier.

### Light

| Activation, Segment | Idle | Clicked | Disabled |
|---|---|---|---|
| Active, Filled | -> System Colors / Blue (light) | -> System Colors / Blue (light) · -> Fills / Light.2 Secondary | -> Fills / Light Vibrant (plus-darker).5 Quinary |
| Active, Unfilled | -> Fills / Light.1 Primary | `#000000` α0.19 | -> Fills / Light.1 Primary |
| Inactive, Filled | -> Fills / Light.1 Primary | — | -> Fills / Light.3 Tertiary |
| Inactive, Unfilled | -> Fills / Light.1 Primary | — | -> Fills / Light.1 Primary |

### Dark

| Activation, Segment | Idle | Clicked | Disabled |
|---|---|---|---|
| Active, Filled | -> System Colors / Blue (dark) | -> System Colors / Blue (dark) · -> Fills / Dark.2 Secondary | -> Fills / Dark Vibrant (plus-lighter).5 Quinary |
| Active, Unfilled | -> Fills / Dark.1 Primary | `#FFFFFF` α0.19 | -> Fills / Dark.1 Primary |
| Inactive, Filled | -> Fills / Dark.1 Primary | — | -> Fills / Dark.3 Tertiary |
| Inactive, Unfilled | -> Fills / Dark.1 Primary | — | -> Fills / Dark.1 Primary |

### Tick Marks

| Tick | Light | Dark |
|---|---|---|
| Idle | -> Labels / Light.3 Tertiary | `#000000` α0.25 |
| Disabled | -> Labels / Light.4 Quaternary | `#000000` α0.1 |
| Centerpoint, Idle | `#000000` α0.85 | `#000000` α0.85 |

---

# OVER-GLASS

The **same controls over a Liquid-Glass surface**. Structure is identical to Content Area; only the
fills that change (because glass sits behind, so opaque fills give way to translucent/vibrant ones) are
tabled. Rows equal to Content Area are marked **"= Content Area"**.

**Variants present:** Over-Glass ships only **01 Bordered**, **04 Prominent**, **05 Prominent
Destructive** — **02 Bordered Tinted and 03 Bordered Destructive are absent** (em dash).

## Buttons

### 01 — Bordered (two-layer on glass)

| State | Light | Dark |
|---|---|---|
| Idle | `#000000` α0.12 · `#000000` α0.07 | `#FFFFFF` α0.12 · `#FFFFFF` α0.05 |
| Clicked | `#000000` α0.12 · `#000000` α0.13 | `#FFFFFF` α0.12 · `#FFFFFF` α0.13 |
| Disabled | `#000000` α0.06 · `#000000` α0.025 | `#FFFFFF` α0.06 · `#FFFFFF` α0.025 |

### 02 — Bordered Tinted / 03 — Bordered Destructive

— *(not in the Over-Glass export)* —

### 04 — Prominent (Default)

| State | Light | Dark |
|---|---|---|
| Idle | -> System Colors / Light Vibrant (plus-darker) / Blue | -> System Colors / Dark (plus-lighter) / Blue |
| Clicked | -> System Colors / Light Vibrant (plus-darker) / Blue · -> Fills / Light Vibrant (plus-darker).1 Primary | -> System Colors / Light Vibrant (plus-darker) / Blue · -> Fills / Dark Vibrant (plus-lighter).1 Primary |
| Disabled | -> System Colors / Light Vibrant (plus-darker) / Blue | -> System Colors / Dark (plus-lighter) / Blue |

### 05 — Prominent (Default) Destructive

| State | Light | Dark |
|---|---|---|
| Idle | -> System Colors / Dark (plus-lighter) / Red | -> System Colors / Light Vibrant (plus-darker) / Red |
| Clicked | -> System Colors / Light Vibrant (plus-darker) / Red · `#000000` α0.15 | -> System Colors / Dark (plus-lighter) / Red · `#FFFFFF` α0.15 |
| Disabled | -> System Colors / Light Vibrant (plus-darker) / Red | -> System Colors / Dark (plus-lighter) / Red |

## Controls

### Light

| Activation, Value | Idle | Clicked | Disabled |
|---|---|---|---|
| Active, Off | -> Fills / Light Vibrant (plus-darker).1 Primary | `#000000` α0.19 | -> Fills / Light Vibrant (plus-darker).3 Tertiary  *(+ shadow: blur 1 · `#000000` α0.02 · 0,0 · spread 0)* |
| Active, On | -> System Colors / Light Vibrant (plus-darker) / Blue · -> Fills / Light Vibrant (plus-darker).3 Tertiary | -> System Colors / Light Vibrant (plus-darker) / Blue · -> Fills / Light Vibrant (plus-darker).2 Secondary | -> System Colors / Light Vibrant (plus-darker) / Blue · -> Fills / Light Vibrant (plus-darker).3 Tertiary |
| Inactive, Off | -> Fills / Light Vibrant (plus-darker).1 Primary | `#000000` α0.19 | -> Fills / Light.3 Tertiary |
| Inactive, On | `#000000` α0.15 | `#EBEBEB` · `#000000` α0.13 | -> Fills / Light Vibrant (plus-darker).3 Tertiary |

### Dark

| Activation, Value | Idle | Clicked | Disabled |
|---|---|---|---|
| Active, Off | -> Fills / Dark Vibrant (plus-lighter).1 Primary | `#FFFFFF` α0.19 | -> Fills / Dark Vibrant (plus-lighter).3 Tertiary |
| Active, On | -> System Colors / Blue (dark) · -> Fills / Dark Vibrant (plus-lighter).3 Tertiary | -> System Colors / Blue (dark) · -> Fills / Dark Vibrant (plus-lighter).2 Secondary | -> System Colors / Blue (dark) · -> Fills / Dark Vibrant (plus-lighter).3 Tertiary |
| Inactive, Off | -> Fills / Dark.1 Primary | `#FFFFFF` α0.19 | -> Fills / Dark Vibrant (plus-lighter).5 Quinary |
| Inactive, On | -> Fills / Dark Vibrant (plus-lighter).1 Primary | `#FFFFFF` α0.06 · `#FFFFFF` α0.13 | -> Fills / Dark.4 Quaternary |

## Fills — Default & Selected

**= Content Area** (both ladders identical to the Content-Area Fills table above, same values in Light
and Dark).

## Knobs — Toggle

**Fills = Content Area's Dark 3-layer recipe in *both* appearances on glass:** Idle / Disabled =
`#FFFFFF` α0.65 · α0.45 · α0.35 (Light and Dark); Clicked = `#FFFFFF` α0 (Light and Dark).
**Shadows: all populated cells = the 6-layer stack ▼** (see Content Area). *(Over-Glass ships no
`#FF0000` Clicked marker and no separate Glow/Shadow border sub-nodes.)*

## Segmented Control (Active, On)

| State | Light | Dark |
|---|---|---|
| Idle | -> System Colors / Light Vibrant (plus-darker) / Blue · -> Fills / Light Vibrant (plus-darker).4 Quaternary | -> System Colors / Dark (plus-lighter) / Blue · -> Fills / Dark Vibrant (plus-lighter).4 Quaternary |
| Clicked | -> System Colors / Light Vibrant (plus-darker) / Blue · -> Fills / Light Vibrant (plus-darker).1 Primary | -> System Colors / Dark (plus-lighter) / Blue · -> Fills / Dark Vibrant (plus-lighter).1 Primary |
| Disabled | -> System Colors / Light Vibrant (plus-darker) / Blue · -> Fills / Light Vibrant (plus-darker).4 Quaternary | -> System Colors / Dark (plus-lighter) / Blue · -> Fills / Dark Vibrant (plus-lighter).4 Quaternary |

## Tracks

Note the **Unfilled** structure differs from Content Area: on glass, Unfilled is a **two-layer** fill
with **no per-state breakdown** (single Idle definition), so it is shown once.

### Light

| Activation, Segment | Idle | Clicked | Disabled |
|---|---|---|---|
| Active, Filled | -> System Colors / Light Vibrant (plus-darker) / Blue | -> System Colors / Light Vibrant (plus-darker) / Blue · -> Fills / Light Vibrant (plus-darker).2 Secondary | -> Fills / Light Vibrant (plus-darker).5 Quinary |
| Active, Unfilled *(no state axis)* | `#000000` α0.2 · `#000000` α0.07 | — | — |
| Inactive, Filled | -> Fills / Light Vibrant (plus-darker).1 Primary | — | -> Fills / Light Vibrant (plus-darker).3 Tertiary |
| Inactive, Unfilled *(no state axis)* | `#000000` α0.2 · `#000000` α0.07 | — | — |

### Dark

| Activation, Segment | Idle | Clicked | Disabled |
|---|---|---|---|
| Active, Filled | -> System Colors / Dark (plus-lighter) / Blue | -> System Colors / Dark (plus-lighter) / Blue · -> Fills / Dark Vibrant (plus-lighter).2 Secondary | -> Fills / Dark Vibrant (plus-lighter).5 Quinary |
| Active, Unfilled *(no state axis)* | `#FFFFFF` α0.04 · `#FFFFFF` α0.03 | — | — |
| Inactive, Filled | `#FFFFFF` α0.22 | — | `#FFFFFF` α0.1 |
| Inactive, Unfilled *(no state axis)* | `#FFFFFF` α0.04 · `#FFFFFF` α0.03 | — | — |

### Tick Marks

| Tick | Light | Dark |
|---|---|---|
| Idle | `#000000` α0.25 | `#404040` |
| Disabled | `#000000` α0.1 | `#1A1A1A` |
| Centerpoint, Idle | `#000000` α0.85 | `#D9D9D9` |

> Dark Over-Glass tick marks are **opaque greys** (`#404040` / `#1A1A1A` / `#D9D9D9`), not the
> alpha-on-black values Content Area uses — glass behind needs solid ticks to stay legible.

## Knobs — Sliders (Over-Glass)

— *(no slider-knob recipe in the Over-Glass export; use the Content Area Light/Idle knob)* —

---

# GLOBAL LEFTOVERS

Single-instance recipe tokens that live at the top level, not inside a control group.

## Color Area Outline

The hairline around a color well / color-picker swatch.

| Token | Border |
|---|---|
| Color Area Outline | 0.5 px `#000000` α0.1 |

## Progress Indicator — Fill Fade Mask (gradient)

A linear alpha mask (black→transparent) applied over the progress fill to fade its trailing edge. Stops
(position 0→1, black with the alpha shown):

| Stop | Color | Alpha | Position |
|---|---|---|---|
| 0 | `#000000` | 1.0 | 0.0 |
| 1 | `#000000` | 0.4 | ~0.397 |
| 2 | `#000000` | 0.0 | 1.0 |

*(Position 1 is `0.397180944055944` in the export; rounded to ~0.397 here.)*

---

*Compression note:* nothing is dropped. Where a cell equals another, it is labelled ("= Content Area",
"6-layer stack ▼") and defined once rather than reprinting the literal layers — every value remains
recoverable. The verbose toggle-shadow gradient is factored into the single **6-layer stack ▼** table.
The **x- Kit** group is the only group excluded (Figma plumbing, not a design value).

See also: [[design-tokens-macos]], [[design-tokens]], [[liquid-glass]], [[color]], [[macos]].