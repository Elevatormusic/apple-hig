# Reviewability — ideas backlog (saved 2026-06-24, not yet specced)

Three related ideas raised while designing the review-router. Theme: **reviewability honesty** (never imply a
clean pass over areas the reviewer couldn't see) and **reviewability by construction** (make UIs the plugin
can review *completely*). Saved to come back to — none is built or specced yet.

## 1. Blind-spot honesty in the verdict — never blindly "pass"

When the reviewer is blind to part of a UI — a **custom-painted region** (`measurable:false`), an **unrendered
area** (states it didn't drive into, native code with no probe, an opaque widget it can't introspect) — the
verdict must **surface those blind spots prominently**, not return a clean pass that implies the unseen areas
are fine. A "pass" has to be qualified: *"passed the N% I could measure; could NOT review: the custom-painted
cal graph, the error/loading states, …"*

- Make it a **first-class verdict requirement**, not a footnote: a `coverage` figure + an explicit
  `blindSpots[]` list on every report, and a hard rule that `verified-pass` (and even a plain `pass`) is
  **forbidden when a blind spot covers a review-relevant area** — it must degrade to `advisory-pass` or
  `incomplete` with the gaps named.
- Partly seeded already (the coverage ratio, the `evidence: extracted` tier, "static can never be
  verified-pass") — this makes the *warning* explicit and mandatory so a partial review is never mistaken for
  a complete one. **This is the smallest/highest-value of the three and the most aligned with the current
  router work** — could be folded into the router's verdict logic when we build it.

## 2. Reviewability by construction — design-time guidance

If apple-hig is installed while a frontend is being **built**, it should steer the developer to design so the
reviewer can later review it **completely** — the UI equivalent of writing testable code. Prefer
introspectable, standard patterns over opaque ones that become blind spots:

- **`/hig-scaffold` + the skill** bake in: semantic markup / standard widgets (so contrast + geometry are
  measurable), explicit state branches (so state-coverage is readable from source), declared design tokens
  (so values are extractable), and — for genuinely custom drawing — an exposed accessibility/descriptor hook.
- A short "reviewability" note in the guidance: *"a custom-painted region is a review blind spot; prefer a
  standard control, or expose a descriptor/accessibility hook so the reviewer can measure it."*

## 3. Reviewability adapter — convert an unreviewable UI into a reviewable one

A feature that takes a UI that's **unreadable without rendering** (custom paint, opaque canvas) and converts
it into something the plugin can read + review. The **JUCE design probe** (Component tree → `native-render`
descriptor) and the planned **SwiftUI/UIKit static extraction** are the first instances of this idea — this
generalizes them into an **adapter layer**:

- For native: an introspection hook the dev adds to custom components so they emit a descriptor entry (today
  they're `measurable:false`).
- For pixels-only regions (a hand-drawn graph): **snapshot pixel-sampling + region/role detection** to
  recover *something* reviewable (e.g. "this chart-shaped region has no detectable axis labels"), short of
  full introspection.
- The honest ceiling: an adapter recovers structure the original threw away; it won't match a UI built
  reviewably from the start (which is why idea #2 matters).

---

### Related queued work (so this backlog is findable in one place)
- The **review-router** ([spec](2026-06-24-review-router-design.md)) is the active thread; idea #1 likely
  folds into its verdict logic.
- The **design-coverage gap-audit batch** (motion probe + tokens, the missing **iOS/watchOS rubrics**, the
  component-consistency probe, the flow Stage-8, cognitive-a11y) — queued.
- **Native-measurement sub-projects B + C** — SwiftUI/UIKit static extraction + `ImageRenderer` (idea #3 is
  the same family).
