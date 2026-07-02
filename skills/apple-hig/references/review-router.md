---
title: Review Router
source_url: https://developer.apple.com/design/human-interface-guidelines
platforms: [ios, ipados, macos, watchos, tvos, visionos, web, desktop]
value_type: universal
last_verified: 2026-07-02
---

# Review Router — which design subsystems get a pass, and what rules ride along

This table drives the design-reviewer's coverage. One row per design subsystem: the **scopes** it
applies to (`element+` = element and larger, etc.), the **rubric dims** it is judged by (the router
*indexes* the rubrics — it never restates them), the **rules files** to lazy-load *only when that
row runs*, and the **method** (`static` = read the source; `probe` = render & measure; `both`).
A request's scope (or an explicit `--only <subsystems>` filter) selects the rows; the reviewer then
audits row by row, one subsystem in context at a time. Rows that are gated out are "not reviewed
(out of scope)"; a row whose method **cannot run** (probe with nothing rendered, custom paint,
undrivable states) is a **blind spot** and must be reported as one — never silently skipped.
`<platform>` in a rules path = the review target's platform (macOS/iOS have control-recipe files;
watchOS/visionOS have token references only).

| subsystem | scopes | rubric dims | rules files | method |
|---|---|---|---|---|
| typography | component+ | platform rubric "Typography & hierarchy" | `references/design-tokens-<platform>.md` + `guidelines/foundations/typography.md` | static |
| color | element+ | "Color / contrast / dark mode" + the contrast-thresholds dim | `references/design-tokens-<platform>.md` + `guidelines/foundations/color.md` + `guidelines/foundations/dark-mode.md` | both |
| layout | component+ | "Layout & spacing" | `guidelines/foundations/layout.md` | probe |
| buttons | element+ | "Components & controls" | `references/control-tokens-macos.md` / `references/control-tokens-ios.md` + `guidelines/components/buttons.md` | both |
| navigation | screen+ | "Navigation & IA" | platform rubric + `guidelines/patterns/navigation.md` | static |
| motion | component+ | "Motion & animation" | `guidelines/foundations/motion.md` | static |
| states | element+ | "States" dim + the Stage-5 non-default-state pass bars | `references/control-tokens-<platform>.md` (state recipes, macOS/iOS) | static |
| microcopy | element+ | "Content & writing / voice" | `scripts/microcopy-checks.mjs` definitions + `guidelines/foundations/writing.md` | static |
| accessibility | element+ | the accessibility dims (contrast / targets / keyboard / VoiceOver / reduce-*) | `guidelines/foundations/accessibility.md` | both |
| icons | component+ | iconography guidance | `guidelines/foundations/sf-symbols.md` + `guidelines/foundations/interface-icons.md` | static |
| forms | component+ | "Forms & validation" | `guidelines/patterns/data-entry.md` | both |
| feedback | component+ | "Feedback & affordances" | `guidelines/patterns/feedback.md` | both |
| platform-fit | screen+ | "Platform-fit" + the cardinal-sin lists | the platform rubric / profile file itself | static |
| data-viz | component+ | charts guidance (custom paint limits apply) | `guidelines/components/charts.md` | probe |

**Default row sets by scope** (the proportionality valve; `--only` overrides):
element → buttons · color · accessibility · microcopy · states.
component → + typography · layout · motion · forms · feedback · icons.
screen/flow → all applicable rows (navigation, platform-fit, data-viz join).

## Method notes — the three new subsystems

- **microcopy** (static, deterministic): collect every visible label/value string in scope; run the
  definitions in `scripts/microcopy-checks.mjs` (the command runs the script; agents without Bash
  apply the same definitions manually). Defaults: casing/all-caps/acronym/ellipsis/destructive ON,
  redundant-copy + glyph-standardization OFF; pro-tool audiences drop acronym+all-caps to INFO.
- **states** (static, reads the source's branches): find the state model (enum / `isLoading`-style
  flags / switch); enumerate expected states for the component class (fetch → loading+error+empty;
  list → empty; capability → offline/no-permission); a missing branch IS the missing state — flag
  the absence (the Stage-5 pass bars judge the present branches' copy/recovery). On macOS/iOS,
  judge state *styling* against the control-tokens recipe tables.
- **motion** (static): read `@keyframes`/`transition`/`animation` (web) or animation calls (native)
  + duration/easing tokens; flag layout/paint-property animation, missing reduced-motion fallback,
  ad-hoc durations when motion tokens exist. Runtime *feel* stays eyeball-only — a probe-less
  motion row is a declared blind spot only when animation code exists and cannot be read.
