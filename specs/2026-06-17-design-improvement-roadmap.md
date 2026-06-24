# Design-improvement roadmap (post-program)

After the 4-sub-project design rebuild (SP-A→D) + rendered verification, the before/after benchmark
(old flat checklist vs new staged reviewer) proved the rebuild worked — **recall 0% → 75%, the old
reviewer rubber-stamped both broken screens** — and exposed exactly what to push next. These four items
target the revealed weaknesses, in the maintainer's chosen order: **#2 → #1 → #3 → #4.**

## What the benchmark exposed (the "why")
1. **Variance / over-flagging** — the new reviewer wrongly failed `monitoring-no-cta` one run, passed it
   another. Still pure LLM judgment with no deterministic floor.
2. **`verified-pass` / `level: visual` are self-reported** — the reviewer claims it rendered; nothing proves it.
3. **The 5 SP-B platform rubrics have zero behavioral coverage** — the benchmark has only web/iOS fixtures.

## The four

### #2 — Bigger benchmark + consistency metric  *(BUILD FIRST)*
Grow from 4 to ~10-15 fixtures across the audit §14 matrix, crucially adding **macOS-dense,
stretched-iPhone-on-iPad, web-as-iOS-cosplay / good-web-dashboard, and RTL** screens so the SP-B platform
rubrics get their first **behavioral** test (weakness #3). Run each fixture N times to **quantify** the
run-to-run variance (weakness #1) and tune the blocking rule where it over-flags. Grounding inherited from
SP-A/SP-B research (no new research pass). Fastest path to a trustworthy regression suite.

### #1 — Deterministic evidence layer  *(BUILD SECOND)*
From the rendered DOM (Playwright `browser_evaluate`), compute the genuinely-checkable facts — actual
contrast against the real background, hit-target geometry after layout, missing `prefers-color-scheme`,
off-grid *relationships* — and feed them to the reviewer as `evidence: computed`. Grounds the mechanical
half, cuts hallucination/variance, and makes `verified-pass` mean "real checks ran" (closes weakness #2).
The kernel of the deferred governance audit's P0-04. Highest ceiling; real engineering (start with the
web/CSS adapter).

### #3 — Computed "squint" hierarchy signal
Turn the grayscale/blur test into an objective visual-weight measure from the screenshot (downscale +
grayscale, compute where the visual mass lands, check it matches the intended primary). Makes the
reviewer's hardest, most-subjective dimension evidence-backed.

### #4 — State + localization rendering
Render the non-default states (loading / empty / error / disabled) and RTL / largest-text stress passes,
not just the happy path — exercising the layout-robustness + state-coverage modes we documented (SP-C) but
don't yet drive. Needs fixtures/scaffolds to expose state toggles.

## Smaller additions (opportunistic)
- **UX-writing depth** — a rubric for error messages (cause+impact+recovery), permission copy,
  destructive-action wording, empty-state next-steps (audit COPY-01/02).
- **Design-diff mode** — review a UI *change* (render before+after of a screen), not just one screen.

## Sequencing rationale
#2 first: fastest to value, the only item that behaviorally tests the shipped platform rubrics, and it
*quantifies* the variance that #1/#3 then *reduce*. #1 second: the structural fix (evidence under the
judgment). #3/#4: deepen specific dimensions once the evidence + benchmark infrastructure exists.
