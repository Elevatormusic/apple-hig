# #1 — Deterministic evidence layer (design spec)

**Roadmap item #1.** The reviewer judged *everything* by eye, which is the root of its variance. This adds
a deterministic floor for the **checkable** facts, so they become `evidence: computed` (measured) instead
of `inferred` (guessed) — grounding the mechanical half and making `verified-pass` mean "real checks ran."

## Components (this increment — the web/CSS adapter)

1. **`scripts/wcag-contrast.mjs`** (dependency-free, unit-tested): `relativeLuminance`, `contrastRatio`,
   `meetsAA(ratio, 'normal'|'large'|'nontext')`, and **`blendOver(fg, bg, alpha)`** — alpha compositing,
   which matters: a translucent `rgba(60,60,67,0.6)` label reads ~3.45:1 over white, *not* the opaque
   ~9:1. This is the measured core; the browser probe mirrors the same constants.
2. **`skills/apple-hig/references/dom-probe.js`**: a function the reviewer passes to Playwright
   `browser_evaluate` after rendering. It returns MEASURED facts: `textContrastFailures` (real contrast
   against the *effective* (alpha-composited, ancestor-walked) background, sized normal vs large),
   `smallTargets` (interactive `getBoundingClientRect` < 24px), and `darkMode` (a `prefers-color-scheme`
   rule exists).
3. **Reviewer wiring** (`agents/design-reviewer.md`): the Playwright tier now runs the probe and tags its
   findings `evidence: computed` (high confidence); a `verified-pass` rests on the probe's evidence.

## Verification (how this increment was checked)

Live, against the real rendered DOM (not just unit tests): the probe was run on `good-ios-settings.html`.
It **found a real bug** — it ignored alpha and so under-reported translucent text — which the live run
caught and the fix (alpha compositing) corrected. Re-run confirmed it then measured the seven secondary
labels at 3.3–3.44:1. That also revealed the fixture's "clean" secondary text genuinely failed 4.5:1
(the LLM's earlier flag was right); the fixture was corrected to a real clean negative (5.23:1), and the
probe then reported zero failures. So the layer is proven to compute correct WCAG contrast on real pixels.

## Honest limits / future work

- **Web/CSS only.** Native (SwiftUI/UIKit) has no rendered DOM here; computed evidence is web-target.
- **Backgrounds:** the ancestor-walk finds the first opaque background; it does **not** resolve
  `background-image`/gradients/overlapping siblings — those can mis-measure (flag for runtime check).
- **Over-reporting:** decorative/disabled/logotype text may appear in `textContrastFailures`; the reviewer
  must apply the contrast-role exemptions before flagging (the probe's `note` says so).
- **Next deterministic checks** (future): focus-visible presence, target *spacing* (not just size),
  reading/focus order from the accessibility tree, off-grid *relationships*. This increment ships the
  highest-value one (contrast) end-to-end.
