# Changelog

All notable changes to the apple-hig plugin. This project follows [Keep a Changelog](https://keepachangelog.com/)
and [semantic versioning](https://semver.org/).

## [1.9.0] — 2026-07-02

The review router: reviews are now driven by a routing table
(`references/review-router.md`) — one row per design subsystem — so coverage is explicit, focused,
and cheap to target.

### Added
- **The routing table:** 14 subsystem rows (typography, color, layout, buttons, navigation, motion,
  states, microcopy, accessibility, icons, forms, feedback, platform-fit, data-viz), each indexing
  its rubric dims + rules files + method (`static`/`probe`/`both`). Rows lazy-load their rules only
  when they run; typography/color/buttons/states rows load the 1.8.0 per-platform token and
  control-recipe references.
- **Targeted audits:** `/hig-review --only buttons,motion` reviews exactly those rows — one
  subsystem's rules in context, nothing else.
- **Deterministic microcopy checks** (`scripts/microcopy-checks.mjs`, unit-tested): casing
  consistency (the one near-fail), redundant copy (off by default), long all-caps (INFO, NN/g),
  unexplained acronym (WCAG 3.1.4 AAA — always advisory, audience allowlist, pro-tool profile),
  ellipsis correctness, destructive-verb prompt-to-verify. Authority tiers are research-validated;
  casing is never cited to WCAG 3.1.2.
- **Static state-coverage row:** the source's branches ARE the state model — a missing
  loading/error/empty branch is flagged as the missing state; present branches are judged by the
  Stage-5 pass bars, and state *styling* by the control-recipe tables on macOS/iOS.
- **Static motion row:** reads `@keyframes`/`transition`/animation calls + tokens; flags
  paint-property loops, missing reduced-motion fallbacks, ad-hoc durations.
- **Blind-spot-honest verdicts:** reports carry `coverage` + `blindSpots[]`; a blind spot covering
  a review-relevant area caps the verdict at `advisory-pass` (invariant C, enforced in
  `validate-review-report.mjs`); the `HIG-VERDICT` line gains `rows=<ran>/<applicable> blind=<n>`.
- **Fan-out:** large reviews dispatch one reviewer per row-group in parallel (`--only` per
  subagent) and merge into a single verdict.
- **Fixtures:** states (missing-branches list) + motion (unreduced paint-property pulse) join the
  behavioral benchmark set.

## [1.8.0] — 2026-07-01

The platform token layer: full, verified numeric token references for **iOS/iPadOS 27, macOS 27,
watchOS, and visionOS**, transcribed from the current-generation Apple Design Resources exports
(values cited, files never bundled) with 100% export coverage.

### Added
- **Platform token references:** `references/design-tokens-macos.md`, `design-tokens-ios.md`,
  `design-tokens-watchos.md`, `design-tokens-visionos.md` — type ramps incl. real bold-variant
  weights and Loose/Tight leading variants, label/fill ladders incl. the quinary/seximal tiers,
  27-generation system palettes, backgrounds/surfaces (incl. the dark elevated ramps), materials,
  Liquid Glass fills + shadows, separators, vibrant families, macOS window/panel shadow + border
  geometry, the complete watch per-size ramp, and visionOS specular border/shadow geometry.
- **Control-state recipe references:** `references/control-tokens-macos.md` (five button variants ×
  idle/clicked/disabled, window-activation variants, over-glass context deltas, input-field focus
  geometry, toggle/slider knobs and tracks, the layered-alias composition model) and
  `references/control-tokens-ios.md` (toggle/slider recipes).
- **Profile wiring:** web Profile B gains site-observed apple.com reference anchors and Base 3 the
  third-party clause (Apple's own properties ship SF under Apple's license); the desktop rubric can
  load the macOS token/recipe references as an optional Apple-grade reference aesthetic — never
  `apple_published` requirements on non-Apple hosts.
- **Routing:** the skill's exact-numbers step now routes to the per-platform token references and
  the control-recipe files; each platform file points at its token reference.
- **Tests:** token keystone corpus tests, recipe alias-resolution + merge-seam guards, and
  cross-file palette/value sync tests (`design-tokens.md` ↔ `design-tokens-ios.md` ↔ `/hig-tokens`
  ↔ `integrations/apple-hig.md`).

### Fixed
- **27-generation system palette** in `design-tokens.md`, the `/hig-tokens` fallback, and
  `color.md` (blue is now `#0088FF`/`#0091FF`; red/orange/teal/mint/cyan/indigo/purple/brown and
  yellow-dark also shifted).
- **macOS window backgrounds** `#FFFFFF`/`#1E1E1E` (the stale ~`#ECECEC`/~`#323232` pair removed;
  `#ECECEC` is now the Materials-Regular light base).
- **Link pair** tracks systemBlue (`#0088FF`/`#0091FF`; fixes the `#0984FF` typo), quinary label
  tier added, elevated background ramps documented, `dark-mode.md` systemBlue updated.
- **macOS wording** now denies only Dynamic Type *auto-scaling* (macOS ships a real size ramp);
  dropped the stale "ultraThick is not a standard HIG material" claim (macOS 27 defines Ultra
  Thick); added the Apple Design Resources License citation to `licensing-and-assets.md`.

## [1.7.1] — 2026-06-23

Patch — the JUCE design probe now **compiles on the common `JUCE_WEB_BROWSER=0`** configuration. Validated on
a real **JUCE 8.0.4** build, where v1.7.0's native review otherwise worked end-to-end (valid descriptor, 90%
accessibility coverage, honest 73% introspectable-coverage reporting) and caught a real clipped label a manual
pass had missed.

### Fixed
- **Compile blocker:** `juce::WebBrowserComponent` only exists when `JUCE_WEB_BROWSER=1`; that reference is now
  guarded with `#if JUCE_WEB_BROWSER`, so apps built with it `=0` (very common) compile cleanly.
- **JUCE-8 deprecation:** replaced `Font::getStringWidthFloat` (deprecated; fails a `-Werror` build) with a
  `TextLayout` width.
- **Warning:** dropped the unused `type` parameter in `resolveColours`.
- **False positives:** the root node is now emitted as `(0,0,w,h)`, so it correctly contains its children and
  no longer reads as overlapping every one of them; the containment check also gained a small tolerance for
  residual window/border offsets.

## [1.7.0] — 2026-06-23

Native **JUCE / C++** design review — the "measure, don't guess" capability extended beyond the browser to
native desktop UIs.

### Added
- **JUCE design probe** (`skills/apple-hig/references/juce-design-probe.h`) — a header-only, `#if JUCE_DEBUG`
  drop-in that walks a live `Component` + accessibility tree and emits a `native-render` JSON descriptor
  (+ a snapshot PNG). No Projucer/CMake change.
- **Native review** (`scripts/native-review.mjs`; `/hig-review <descriptor.json>` runs it) — runs the
  existing contrast / geometry / visual-weight math on the descriptor to produce **measured** findings: low
  contrast, sub-24px targets, clipped/truncated text, duplicate/overlapping rows, hierarchy. Same engine as
  the web path.
- **`evidence: extracted` tier** — deterministic from the live component tree, and honest about its limits: a
  native review reaches at most `advisory-pass`, **never `verified-pass`** (it is not a pixel render), and
  contrast is scored only on introspectable standard-widget nodes with a **coverage ratio** reported, so a
  heavily custom-painted UI is never mistaken for "fully reviewed".

### Notes
- The probe targets **JUCE 6.1+** for accessibility enrichment (the core works on 6.0/6/7/8); call it on the
  message thread once the editor is shown. See `references/native-juce-review.md`.
- RTL is not assessed (JUCE has no bidi through JUCE 8); stress is reflow-only.
- The probe header is **new in this release** and not yet compile-validated against a production JUCE build —
  if you hit a build issue, please [open an issue](https://github.com/Elevatormusic/apple-hig/issues) and
  it'll be fixed quickly. The `native-review` engine + CLI that produce the findings are fully tested.

## [1.6.0] — 2026-06-23

A major upgrade to the `design-reviewer`: it now **measures** what it can instead of eyeballing it, and
judges web, macOS, and desktop software by their own standards rather than forcing iOS conventions onto them.
All additive and backward-compatible.

### Added
- **Measured evidence (rendered review).** When the reviewer can render a screen (Playwright), it runs a DOM
  probe that computes **real WCAG contrast** against the actual background (with alpha compositing),
  **interactive-target geometry**, and dark-mode support — attached as `evidence: computed`, so a
  `verified-pass` now means real checks ran, not a guess.
- **Computed "squint test" hierarchy.** An objective visual-weight ranking (rendered area × ink × contrast)
  flags a hierarchy inversion — metadata or a secondary control out-shouting the title, primary action, or
  critical status — as a measured finding (heuristic, capped at `confidence: medium`).
- **State + stress pass.** A DOM stress probe measures whether a screen survives **largest text (Dynamic
  Type AX5 / 200% resize)**, the **WCAG 1.4.12 text-spacing** overrides, **narrow reflow (320 CSS px)**, and
  **RTL mirroring** — reporting clipping, truncation, overlap, lost content, and physical-CSS that won't
  mirror. Plus non-default-state pass-bars (error / empty / loading / offline) and a static "unhandled state"
  gap check.
- **Two new web profiles + a desktop profile.** The web rubric is now `profiles/web.md` with two scope-bound
  profiles — **Web Application** and **Marketing / Content Website** — graded by WCAG + web conventions. New
  `profiles/desktop-cross-platform.md` reviews Windows / Linux / Electron / Qt / Java software by host-OS
  conventions (Fluent / GNOME / KDE). Both reuse Apple's transferable principles only — never iOS chrome.
- **Benchmark suite.** A scored benchmark (`scripts/design-benchmark.workflow.js`) of seeded fixtures with a
  consistency metric, to measure the reviewer's verdict accuracy and stability.
- **`/hig-sync` documented** across the site and listing; CI now runs the full test suite unfiltered.

### Changed
- **`design-reviewer` rebuilt** from a flat checklist to a staged method (context → platform calibration →
  screen model → hierarchy → states → accessibility-as-evidence → platform-fit) with a proportionality valve
  and a structured finding schema (authority, severity, confidence, evidence) — and honest verdicts (static
  review can never be `verified-pass`).
- **macOS rubric overhauled** to a full 23-dimension set. Corrected the Dynamic-Type framing (macOS has no
  Dynamic Type ramp — it uses "Use Preferred Reading Size"), the control-size pair (28×28 default / 20×20
  min), and removed a Larger-Text overclaim.
- **Authority discipline tightened** across rubrics: WCAG facts stay `wcag_external` even on macOS; nothing in
  the desktop profile is `apple_published`; the only `apple_published` web facts are the SF-font license and
  the three official Apple web components.

### Fixed
- The reviewer no longer forces iOS chrome onto web or desktop targets, and no longer mis-judges macOS density
  or iPad layouts as defects (calibrates to the platform first).
- Removed fabricated/mismatched source URLs and corrected several authority mis-tags surfaced by review.

## [1.5.0] — 2026-06-16

- SessionStart update notifier (notify-only, one check per 24h, `HIG_UPDATE_CHECK=off` to disable).

## Earlier

- 1.3.0–1.4.x: MapKit JS / web Maps scaffolding, perf guidance, the icon-webfont→inline-SVG fix.
- 1.0.0: initial release — router skill, on-disk HIG reference, `design-reviewer`, `/hig-review`,
  `/hig-scaffold`, `/hig-tokens`.
