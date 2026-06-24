# #3 — Computed "squint test" hierarchy signal (design spec)

**Roadmap item #3.** Hierarchy is the reviewer's hardest, most-subjective dimension — "what dominates this
screen?" was answered by eye, so it varied run to run. This makes the squint test **objective**: rank
every element by an estimated *visual weight*, so a hierarchy inversion (metadata or a secondary control
outshouting the title / primary action / critical status) becomes a measured finding, not a vibe.

## Model

`scripts/visual-weight.mjs` (unit-tested, dependency-free): `visualWeight({area, contrast, filled, bold})`
= **area × ink × contrast-factor**, where
- `contrast-factor = clamp((contrast − 1) / 20, 0, 1)` — 1:1 → 0 (invisible carries no weight), 21:1 → 1.
- `ink = filled ? 1 : 0.15 × (bold ? 1.5 : 1)` — a filled block covers ~100% of its bbox; text only ~15%,
  and bold text lays down more ink than regular.

`rankByWeight(elements)` sorts descending. The DOM probe (`references/dom-probe.js`) mirrors the same
formula, computing each element's rendered bbox area, whether it is a distinct *fill* (its background
contrasts with the page) vs text, the relevant contrast (fill-vs-page for blocks, text-vs-bg for text),
and boldness — then returns `visualWeightTop` (the focal points). The reviewer's Stage 4 reads it: if a
metadata/decorative element or a secondary control outweighs the intended primary — or the title/critical
status sits far down the list — that is an evidence-backed `hierarchy` finding (`evidence: computed`).

## Verification (live, against the real rendered DOM)

- **Broken screen** (`perfect-tokens-wrong-hierarchy.html`): the order-number metadata measured weight
  **3443**, outshouting the title (**314**, 11×) and the critical "Payment failed" status (**251**, 14×);
  two equal CTAs (4086 each) = competing primary. The inversion the screen was built to contain — measured.
- **Clean screen** (`good-ios-settings.html`): the large "Settings" title legitimately dominated (**3883**),
  content groups followed, no buried critical status. **No false inversion** — the signal only fires when
  something genuinely outshouts the title.

## Honest limits / future work

- **Heuristic, not pixel saliency.** It approximates perceived weight from DOM geometry + contrast; it does
  not rasterize and run a real saliency model. Good enough to catch gross inversions; not a substitute for
  the eye on subtle ones.
- **Web/CSS only** (no rendered DOM for native here), same as the #1 evidence layer.
- **Fill detection is background-color based** — gradient/image "blocks" and `box-shadow`-only emphasis are
  under-counted; large hero images are treated as a fixed strong block (contrast assumed 8:1).
- **"Intended primary" is still a judgment** the reviewer makes — the signal supplies the ranking, not the
  intent. Next (roadmap #4): render non-default states + RTL / largest Dynamic Type and re-measure.
