# SP-D — Design benchmark (design spec)

**Part of:** the design-audit response. Sub-project D of four (final). Measures whether the SP-A/B/C
rebuild actually works: does the reviewer **catch** seeded design failures and **not** false-positive on
correct screens? Addresses the audit's §14 + P2-09 ("website demos are curated evidence, not regression
proof").

**Goal:** a reproducible benchmark with seeded ground truth, real precision/recall/false-pos-neg scoring,
and an Opus judge-panel proxy for expert agreement (chosen over a human panel, which can't be automated;
labelled honestly as an LLM-judges-LLM proxy, not human ground truth).

## Components

1. **Seeded fixtures** (`test/fixtures/design/*.html`) + the ground-truth manifest
   (`expected.json`): each fixture declares `expectedVerdict`, `expectedCategories` (categories that
   SHOULD be flagged), and `mustNotFlag` (rules that must NOT be raised). Starter set (4): two failures
   (`perfect-tokens-wrong-hierarchy`, `hidden-critical-warning`) and two passes
   (`monitoring-no-cta` — correct without a CTA; `good-ios-settings` — a clean true negative). Extensible
   toward the audit's full §14 list (checkout, onboarding, dashboard, dense macOS inspector, RTL, …).
2. **Scorer** (`scripts/benchmark-score.mjs`, dependency-free, unit-tested): `scoreFixture(actual,
   expected)` → `{verdictMatch, truePositives, falseNegatives, falsePositives}`; `aggregate(results)` →
   `{precision, recall, verdictAccuracy, falsePositives, falseNegatives}`. recall = expected categories
   the reviewer flagged; a false positive = a `mustNotFlag` rule the reviewer raised (substring match).
3. **Runner** (`scripts/design-benchmark.workflow.js`, a Workflow): per fixture, dispatch an Opus agent
   that loads `agents/design-reviewer.md`, reads the fixture, applies the staged method (level=static),
   and returns `{verdict, categories, flags}` — **without** reading the answer key. Scores inline (a twin
   of the node scorer), then runs a 3-judge Opus panel per fixture (lenses: task/hierarchy,
   accessibility/states, false-positive discipline; majority = expert-agree). Returns per-fixture results,
   the aggregate, and the judge-panel agreement.

## How to run

`Workflow({ scriptPath: "…/apple-hig/scripts/design-benchmark.workflow.js" })` (or, if named-workflow
resolution finds it, `Workflow({ name: "design-benchmark" })`). It runs the **real** rebuilt reviewer, so
it both measures quality and acts as a regression check after future reviewer/corpus changes.

## Honesty / limits

- The judge-panel is an **LLM proxy** for expert agreement, not human ground truth (the design audit's
  human-agreement + task-completion study remains a documented, non-automatable future step).
- The runner reviews at `level: static` (no rendering in the harness), so it exercises the static path;
  the rendered modes (SP-C) are validated separately when a live preview exists.
- The starter set is 4 fixtures — enough to prove the two headline behaviors and guard regressions, not
  yet the full §14 matrix. Expanding fixtures is additive (drop an HTML file + an `expected.json` entry +
  the workflow's inlined list, which `test/benchmark-fixtures-sync.test.mjs` keeps in sync).

## Testing

- `scripts/benchmark-score.test.mjs` — the scorer's precision/recall/false-pos-neg + empty-input safety.
- `test/fixtures-manifest.test.mjs` (from SP-A) — fixtures + manifest are structurally valid (now 4).
- `test/benchmark-fixtures-sync.test.mjs` — the workflow's inlined fixtures match `expected.json` and it
  reuses the same scoring contract.
