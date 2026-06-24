# Changelog

All notable changes to the apple-hig plugin. This project follows [Keep a Changelog](https://keepachangelog.com/)
and [semantic versioning](https://semver.org/).

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
