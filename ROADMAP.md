# Roadmap

The living roadmap. Dated program docs live in `specs/` (e.g. the
[2026-06-17 design-improvement program](specs/2026-06-17-design-improvement-roadmap.md), whose four
items shipped across v1.6.0–v1.7.1). Sourcing rule for everything below: numeric values are cited to
Apple's published HIG and design resources with version-dependent framing ("re-verify on Apple");
Apple's own files (fonts, token exports, templates) are never bundled into this repo — values are
documented, assets are linked.

## Active

- **Review router (1.8.0)** — routing-table-driven reviewer: per-subsystem focused passes, targeted
  `--only` audits, lazy per-row rule loading, fan-out for large reviews; three new routed subsystems
  (microcopy & consistency, static state-coverage, motion). Spec:
  [2026-06-24-review-router-design.md](specs/2026-06-24-review-router-design.md) — at the
  spec-review gate; implementation plan next.

## Next up: macOS 27 token refresh — correctness fixes

Verified against the current macOS design-resource generation (June 2026). Fix batch:

1. **Window backgrounds** (`platforms/macos.md`, `foundations/color.md`) — update the stale
   approximate hexes to the current generation (light `#FFFFFF` / dark `#1E1E1E`; with-sidebar dark
   `#000000`); note the old light value now corresponds to the Materials *Regular* base, not the
   window fill. Fix the `link` dark-value typo (`#0984FF` → `#0A84FF`) in `design-tokens.md` +
   `color.md`.
2. **macOS type ramp** (`platforms/macos.md`) — add the 11-style macOS ramp (sizes, default +
   emphasized weights, leadings, 0.85-alpha label color; note loose/tight leading variants). Reword
   the "macOS has no iOS-style Dynamic Type ramp" lines so they deny only the *auto-scaling
   mechanism*, not the existence of a macOS size ramp. Add sidebar active/inactive fills (the
   macOS 27 sidebar behavior the file already describes in prose).
3. **Color ladders + accent refresh** (`foundations/color.md`, `references/design-tokens.md`) —
   update the iOS accent table in place to the current generation (the 27-gen values are identical
   across the iOS and macOS kits); add the macOS label alpha ladder (6 tiers incl. quinary/seximal),
   the new iOS quinary label tier, system-fill ladders, vibrant label/fill variants and the
   plus-lighter/plus-darker convention.
4. **Materials + Liquid Glass values** (`foundations/materials.md`, `foundations/liquid-glass.md`) —
   material tint/alpha table for all five thicknesses (drop the stale "ultraThick is not a standard
   material" claim); macOS Liquid Glass numeric appendix (Dock, Menus, Notification, Regular
   Small/Medium/Large, light+dark fills and shadows); focus-ring spec.
5. **Web profile touch-ups** (`profiles/web.md`) — Profile B gets a clearly-labeled *site-observed*
   anchor block (marketing-site color/type/radius conventions, `community_convention` authority);
   Base 3 gains the clause that the ship-SF prohibition targets third parties (Apple's own web
   properties ship SF under Apple's license).

## New capability: macOS control-state token layer

The current macOS design-resource generation defines things the plugin has no equivalent of at any
level — not missing rows, missing *categories*. Needs its own spec (design questions: where these
live, how the reviewer consumes them, how they feed the review-router's state subsystem and the
native JUCE probe):

- **Per-control, per-state recipes** — five button variants (bordered / bordered-tinted /
  bordered-destructive / prominent / prominent-destructive) × idle/clicked/disabled; toggle knobs
  (incl. clicked-glow), slider tracks/knobs/tick marks, segmented controls, input fields
  (idle/focus/disabled fills *and* borders). Enables deterministic "is this state styled to spec"
  checks instead of qualitative state guidance.
- **Over-glass context** — a parallel recipe set for the same controls when placed on Liquid Glass;
  the concept that control styling is context-dependent.
- **Window-activation dimension** — active vs inactive window variants for controls and surfaces.
- **Shadows and window/panel borders** — elevation values (windows active/inactive ×
  with/without-sidebar, panels, glass surfaces, knobs) and the standardized macOS 27 window-border
  specs; the plugin currently has no shadow/elevation values on any platform.
- **Token composition** — recipes are layered aliases (accent color + vibrant fill compositing);
  document the model, not just resolved values.
- **Glyph fills** (colored/neutral/primary × idle/disabled), **selected-state fill ladder**, and a
  **progress-indicator fade mask** — smaller, same family.

## Queued: remaining platform token audits (same method as macOS)

Current-generation design-resource exports now cover iOS/iPadOS, watchOS, and visionOS (local-only,
never committed — same rule as above). Each gets the macOS treatment: adversarially-verified audit of
the platform's rubric + token claims against the export, then a fix/coverage pass:

- **iOS/iPadOS 27** — beyond the accent refresh in the fix batch: elevated vs base background ramp,
  the new quinary label tier, `Labels - Liquid Glass` variants, iOS `Controls` state tokens, ramp
  Bold/Italic variants (Body bold is w600, not w700), materials values.
- **watchOS** — the watch type ramp (incl. Footnote 1/2), system colors, and the four Vibrant
  families (backgrounds/colors/fills/labels) — the watchOS rubric currently has no numeric layer.
- **visionOS** — XL Title 1/2 display styles, the visionOS ramp, labels, materials.
- **tvOS** — no export available yet; re-audit when one exists.

## Queued (existing backlog)

- **Reviewability ideas** ([spec](specs/2026-06-24-reviewability-ideas.md)) — blind-spot-honest
  verdicts (likely folds into the review-router verdict logic), reviewability-by-construction,
  reviewability adapter.
- **Design-coverage gap-audit batch** — motion probe + motion tokens, `## Design rubric` sections for
  iOS/watchOS, component-consistency probe, flow Stage-8, cognitive accessibility, minimum on-screen
  time for transient messages.
- **Native measurement B + C** — SwiftUI/UIKit static extraction; SwiftUI `ImageRenderer`
  render-and-measure (companions to the shipped JUCE probe).
- **v2 governance-audit program** (deferred; `specs/2026-06-17-v2-*`).
