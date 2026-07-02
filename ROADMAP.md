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

## Shipped in 1.8.0: the platform token layer

Everything in the two sections below **shipped in v1.8.0** (2026-07-01): the four platform token
references + two control-state recipe references, the 27-generation corrections, and the
web/desktop profile wiring (macOS values usable as reference aesthetics for Apple-style websites
and Windows/Mac desktop software). Design/plan docs for this program are maintained locally.

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

## Next up (continued): the platform token layer covers ALL export content

The program above grew to the full four-platform scope (design/plan docs maintained locally). All
four platform exports were audited and drafted with adversarial row-by-row verification, and a
deterministic coverage matrix proved **100% of non-plumbing export tokens** are carried (colors
1,022/1,022, typography 492/492, shadow/border/gradient 97/97; only Figma-internal `x- Kit`
excluded):

- **iOS/iPadOS 27** — accent refresh, elevated background ramps, quinary label tier,
  `Labels - Liquid Glass`, real Bold-variant weights (Body bold = w600), materials + Liquid Glass
  incl. shadows and the Widget Glass gradient, toggle/slider control recipes.
- **macOS 27** — full ramp + ladders + surfaces + materials + Liquid Glass (fills AND shadows),
  window/panel shadow + border geometry (the macOS 27 standardized window borders), and the
  control-state recipe layer: five button variants × states, window-activation (active/inactive)
  variants, over-glass context deltas, input-field focus geometry, layered-alias composition model.
- **watchOS** — the watch ramp with the complete per-size table (all six size classes ×
  ten styles), system colors, the four Vibrant families, edge-scrim gradients.
- **visionOS** — XL Title ramp, glass-tuned system colors, labels, materials incl. specular
  border/shadow geometry.
- **tvOS** — no export available yet; audit when one exists.
- Follow-on (queued): the reviewer *capability* that consumes the recipe tables mechanically
  (deterministic control-state checks feeding the review-router's states subsystem and the native
  JUCE probe); a `/hig-tokens --platform` flag.

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
