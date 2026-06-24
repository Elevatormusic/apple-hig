# #4 — State + stress (RTL / largest-text / reflow) review (design spec)

**Roadmap item #4.** The reviewer judged the happy path. This adds the states that actually break — error,
empty, loading, offline — and three layout-stress axes (largest Dynamic Type / 200% resize, WCAG text-
spacing, narrow reflow, RTL mirroring), measuring breakage (clip / truncate / overlap / lost content)
deterministically from the rendered DOM. **Platform-calibrated** (the stress that applies differs by target).

## Grounded facts (R1 research — Apple HIG + W3C primary sources, adversarially verified)

All authority tags use the plugin's vocabulary; numbers are sourced, with overclaim traps called out.

### Layout-stress thresholds
- **Resize text — WCAG 2.2 SC 1.4.4 (AA):** text scales to **200%** with no loss of content/function; only
  captions + images-of-text exempt. Failure **F69** = clipped/truncated/obscured. `wcag_external`.
- **Reflow — SC 1.4.10 (AA):** single-column at **320 CSS px width** (≡ 1280px @ 400% zoom — the *same*
  requirement, test once), no two-dimensional scrolling; 256 CSS px height for horizontally-scrolling
  content. Exceptions (whitelist before flagging): maps/diagrams, video, games, presentations, data-table
  *grid* only, kept-in-view toolbars. **F102** = content that *disappears* at 320px (more severe than
  truncation). `wcag_external`.
- **Text spacing — SC 1.4.12 (AA), currently ABSENT from the plugin:** survive line-height ≥ **1.5**,
  paragraph ≥ **2×**, letter ≥ **0.12×**, word ≥ **0.16×** font size, changing nothing else. A tolerance to
  test, not a style to apply. `wcag_external`.
- **Largest Dynamic Type (AX5):** Body **~53pt** (`platform_api_observed`, OS-version-dependent, *not*
  Apple-published; spread 46–53pt) / 17pt default ≈ **3.12×**. NON-LINEAR per style — a flat root scale
  over-scales titles; **iOS/iPadOS only — macOS has no Dynamic Type.** Apple requires testing through AX5;
  fixed chrome (tab/nav labels) may legitimately not scale if a Large Content Viewer exists — not a defect.
- **Overlap (F69):** boxes collide when `getBoundingClientRect` rects intersect; require > ~1px depth on the
  smaller dimension to suppress sub-pixel noise; only between sibling/non-ancestor text/control nodes
  (exclude parent containment + decorative overlays). Run *after* the RTL flip + largest type.
- **Truncation:** `scrollWidth > clientWidth` with overflow hidden/clip + no reveal (horizontal);
  `scrollHeight > clientHeight` with overflow hidden (vertical). Distinct from reflow-loss (vanished content).

### States to render (with pass bars)
- **Error** — names *what happened*, the *cause*, and a concrete *recovery* action; plain language, no raw
  codes, blames the situation not the user; inline > modal. Needs a non-color channel (`role=alert`/aria-live
  + text). `apple_published` (WWDC17 Writing Great Alerts + Alerts HIG) + WCAG 1.4.1.
- **Empty** — explains what belongs + helpful tone (`apple_published`, Writing HIG) and exposes a first-
  action affordance (`inference`). Fail = blank/dead-end.
- **Loading** — something appears immediately (placeholder mirroring layout > bare spinner); determinate
  bar when duration known, indeterminate spinner only for short unknown waits; failure branch renders the
  error state with retry *without losing place*. ("skeleton" is the plugin's gloss, not Apple's term;
  Apple says "placeholder text, graphics, or animations".) `apple_published`.
- **Offline / no-permission** — a specialization of error with its own recovery path.
- In a **static** review, a component rendering only the happy path with no error/empty/loading branch
  *necessarily* produces a blank/frozen/dead-end screen in those conditions — flag the absence as an
  "unhandled non-default state" gap (severity scaled by likelihood: network → loading+error; lists → empty).

### RTL mirroring (SC + Apple RTL)
- Base direction must be in **markup** (`dir="rtl"` on root), not CSS — missing it for RTL content = hard
  fail. `wcag_external` (W3C i18n).
- **Physical directional CSS** for layout/spacing/alignment (`left`/`right`, `margin/padding-left/right`,
  `text-align:left/right`, `float:left/right`, `position:…left`) does NOT mirror — the logical counterparts
  (`inset-inline-start/end`, `margin/padding-inline-*`, `text-align:start/end`, `float:inline-*`) are the
  pass condition. Highest-yield not-RTL-ready signal. (The "80% of RTL issues" stat is folklore — excluded.)
- **Mirror:** layout/reading order, back/forward chevrons, sliders/progress, disclosure chevrons, natural
  text alignment, semantically-named directional symbols. **Do NOT mirror:** media transport/timeline,
  clocks, music notation, graph axes, phone numbers/country codes, numeral glyphs, logos. Flipping a
  must-not-mirror element is itself a failure.
- **Bidi:** isolate embedded opposite-direction runs (`dir`/`<bdi>`/`dir=auto`); don't flag correct bidi
  reordering as breakage; do flag an un-isolated phone number/Latin run that visibly scrambles.

## Build
- `scripts/layout-robustness.mjs` (unit-tested): the constants above + `boxesOverlap` / `intersectionArea` /
  `overlapDepth` / `isHorizClipped` / `isVertClipped` / `hasHorizontalScroll`.
- DOM **stress probe** (extends references/): the reviewer applies a stress transform (`dir=rtl`; root-scale;
  inject the 1.4.12 spacing; narrow to 320px) then re-runs the probe, which returns clipped/truncated/
  overlapping/lost nodes + an RTL physical-CSS lint — tagged `evidence: computed`.
- Reviewer **robustness pass** + the platform calibration (web = reflow/resize/spacing/RTL; macOS = window-
  min/Larger-Text/Increase-Contrast, no Dynamic Type; iOS = AX5) — folded into the rubric overhaul (R2).
- Stress fixtures (a screen that clips at AX5; one that 2D-scrolls at 320px; one with physical-CSS RTL leaks;
  one missing error/empty/loading branches) + benchmark entries.

## Honest limits
- Web/CSS render only; native is judged from source, not a live render. The AX5 3.12× is a Body-accurate
  approximation (non-linear per style) — re-read on device for fidelity; flag, don't fail, fixed chrome.
