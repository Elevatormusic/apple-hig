# SP-B — Corpus depth + platform design rubrics (design spec)

**Part of:** the design-audit response. Sub-project B of four. Consumes SP-A's finding schema, authority
vocabulary, and contrast-role table. Grounded by two Opus research-validation passes (SP-A authority map;
SP-B platform-rubric research, 58 primary-sourced rules).

**Goal:** Bring the on-disk corpus up to the SP-A method — fix the mislabeled/contradictory/incorrect
values the research caught, and add **per-platform design rubrics** so the reviewer judges a screen by
its actual platform's conventions, not iOS defaults. Pure corpus content; no code beyond consistency tests.

## Component 1 — Confirmed factual corrections (highest priority; the reviewer is currently wrong)

These are not stylistic; they are wrong against primary sources:

1. **`accessibility.md:16`** — "4.5:1 minimum for body text and meaningful glyphs" → meaningful **non-text
   is 3:1 (WCAG 1.4.11)**, not 4.5:1 (text only). Split text vs non-text; add the decorative/disabled/
   logotype exemptions; update the checklist line (`:73`). Resolves the `accessibility.md`↔`color.md`
   contradiction (color.md is already right). *(Authority: wcag_external.)*
2. **`tvos.md:35-36`** — overscan "~90 px horizontal / 60 px vertical" → Apple's published value is
   **80pt sides / 60pt top-bottom** (the 90 figure and the px-vs-pt unit are both wrong). *(apple_published, Layout.)*
3. **`visionos.md:24-25`** — target spacing "≥ ~4 pt" → Apple's guidance is **≥16pt margin around bounds
   OR ≥60pt center-to-center** (eye-tracking imprecision). *(apple_published, Eyes + Accessibility table.)*
4. **`tab-bars.md:22`** — "2–5 tabs" stated as exact-spec → the current HIG is qualitative ("avoid too
   many"); the **numeric 2–5 is `community_convention`** and the >5→More overflow is `platform_api_observed`.

## Component 2 — Authority relabels (from the SP-A research, corpus side)

- `layout.md` 4/8 spacing grid → keep the existing "common convention, not an official Apple spec" hedge;
  ensure no rule cites it as `apple_published`. The Apple spacing facts are the 16/20pt margins + tvOS
  60/80 overscan.
- `feedback.md` front-matter → the feedback-loop / error-quality / recognition model is NN/g
  (`community_convention`) with WCAG cross-cites (4.1.3 / 3.3.1 / 3.3.4); Apple's Feedback page is
  `apple_published` only for platform mechanics ("undo + confirmation for destructive actions").
- Add a canonical **contrast-role table** to `accessibility.md` (body 4.5:1, large 3:1, non-text 3:1 per
  1.4.11, disabled/decorative/logotype exempt, color-alone prohibited, 7:1 AAA-never-a-floor) — the same
  table SP-A's reviewer references, so corpus and reviewer agree.

## Component 3 — Per-platform design rubrics (the new content)

Add a "Design rubric (what to check differently here)" section to each platform file, from the SP-B
research (mustCheck lists + the iOS-defaults-that-are-wrong-here). Condensed:

- **`macos.md`** — density is correct (inspectors/source-lists/dense toolbars idiomatic); judge control
  size against macOS sizes (~28/24/20pt, `platform_api_observed` — not a hard gate), not iOS 44pt;
  complete menu bar (every command, standard menus, disable-don't-hide); **no toolbar-only actions**
  (toolbar is removable → every command also in the menu bar); Full Keyboard Access + standard shortcuts;
  pointer hover + secondary-click context menus; sidebar→content→detail nav (flag a bottom tab bar);
  inspectors/panels not modal sheets for auxiliary UI; resizable restorable windows (fixed-size = defect);
  first-class multi-selection; **no Dynamic Type** (fixed ~13pt body).
- **`ipados.md`** — reject "stretched iPhone" (restructure for regular width, don't pad margins);
  size-class-driven (check compact AND regular + the transition); design for any window size + continuous
  resize (Stage Manager); sidebar+split for multi-section; co-equal touch+pointer+keyboard; pointer
  effects; keyboard shortcuts; popovers (adapt to sheet in compact); inter-app + multi-item drag (never
  the only path); multiple windows where it aids; primary touch targets stay ≥44pt but secondary
  pointer controls may be denser; 20pt regular / 16pt compact margins by size class. ~320pt sidebar is a
  soft reference (`platform_api_observed`), not a gate.
- **`tvos.md`** — everything actionable must be **focusable** with an obvious focused state (no cursor/
  touch); use the **system focus effect** (parallax/lift), never color-alone; target floor **66pt default
  / 56pt min** (> iOS 44); overscan **80/60pt**; 8-feet legibility + content-as-hero; minimize text entry
  (`community_convention`); Top Shelf for top-row apps; layered parallax icon; honor Reduce Motion.
- **`visionos.md`** — gaze target **60pt default**, **16pt margin / 60pt center-to-center** spacing;
  rounded interactive shapes (eyes drift to corners); eyes+hands (look + pinch), arms resting; right
  spatial container (Window/Volume/Space; default Shared Space); controls in **ornaments** (not in-window
  chrome); glass material over passthrough + legibility check; content in comfortable FOV; motion comfort
  (animate objects not viewpoint; no large/peripheral/oncoming motion); Digital-Crown immersion control.
- **web** (extend `universal.md` web note or add `technologies/web-design.md`) — **do not flag a web app
  for lacking iOS chrome** (HIG is Apple-platform-scoped); desktop-web conventions at pointer widths;
  URL/History/Back native (not app-modal nav); **visible managed focus** (`:focus-visible`, WCAG 2.4.7/
  2.4.11 — `wcag_external`); semantic HTML + native form controls before ARIA; responsive via CSS
  media/container + `prefers-*` (not size classes); dual pointer (fine+coarse); web/OS keyboard
  conventions (no Mac menu bar; branch Cmd/Ctrl); **no SF Pro / SF Symbols off Apple platforms** (license —
  `apple_published`); Apple's look on web is **conditional** on a genuine Apple-ecosystem surface +
  web-licit substitutes, else it's cosplay (`inference`); the 3 official web components (Apple Pay on the
  Web, Sign in with Apple JS, MapKit JS) ARE Apple-governed (`apple_published`).

## Component 4 — Authority discipline + soft-number guards (binding)

- **Web standards are NOT Apple's.** Focus, keyboard operability, semantic HTML, responsive breakpoints,
  contrast ratios, modifier handling → `wcag_external` / `community_convention` (W3C/WHATWG/MDN). Only the
  HIG-scoping boundary, the SF font/Symbols licenses, and the 3 official web components are
  `apple_published` on the web.
- **Soft numbers (never hard pass/fail gates):** macOS ~28/24/20pt control heights (AppKit defaults);
  iPad ~320pt sidebar; visionOS 28pt table minimum (60pt is the practical gaze check). Label
  `platform_api_observed`, treat as references.
- **Don't over-prescribe optional capabilities:** a simple iPad app may stay tab-bar-based; multiple
  windows / drag-drop / three-column split are "where it aids the workflow," not universal mandates.
- **Version volatility:** Liquid Glass + the WWDC25-sourced rules (iPad window-controls wrapping, macOS
  control-shape size split) are fast-moving — keep the "re-verify on Apple / after WWDC" banners.

## Testing approach

1. **`test/corpus-contrast-roles.test.mjs`** — assert `accessibility.md` and `color.md` agree (non-text =
   3:1, never 4.5:1; the decorative/disabled exemptions present). Extends SP-A's contrast-consistency test.
2. **`test/corpus-platform-facts.test.mjs`** — assert the confirmed factual values: `tvos.md` overscan
   says 80/60pt (no "90"); `visionos.md` says 16pt/60pt center-to-center (no "≥ ~4 pt"); `tab-bars.md`
   does not present "2–5" as exact-spec without the convention caveat.
3. Per-platform rubric presence tests (each platform file contains its "Design rubric" section with its
   signature checks) — added per rubric task.

## In scope (SP-B) vs deferred

- **SP-B:** Components 1–4 (factual corrections + authority relabels + the 5 platform rubrics + the
  canonical contrast table in the corpus + tests).
- **Not SP-B:** the structured-data corpus rearchitecture (generate-MD-from-JSON) — that's the deferred
  governance audit's Phase 4. SP-B edits the Markdown directly, conforming it to SP-A's vocabulary.

## Plan (task breakdown)

- **Task 1 (detailed):** the four confirmed factual corrections + the two consistency tests. *(Done first
  — they're outright bugs.)*
- **Task 2:** canonical contrast-role table into `accessibility.md`; `feedback.md` + `layout.md` +
  `tab-bars.md` authority relabels.
- **Tasks 3–7:** the macOS / iPadOS / tvOS / visionOS / web design rubrics (one task each; drop in the
  grounded `mustCheck` content from the SP-B research, with per-rule authority + a presence test).
