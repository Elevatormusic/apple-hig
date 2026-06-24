# apple-hig v2 — Audit-Response Program Plan (master)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended)
> or superpowers:executing-plans to implement each phase's sub-plan task-by-task. This master file is
> the **spine**: it sequences the phases and links to the detailed, bite-sized sub-plans. Do not execute
> from this file directly — execute from the per-phase plan files.

**Goal:** Turn `apple-hig` from "a useful but over-claiming heuristic reviewer" into an auditable,
evidence-backed design-review system whose public claims match its behavior, whose corpus separates
Apple-published facts from conventions, and whose commit gate cannot be cleared without a valid,
content-bound review report.

**Architecture principle (the thing that fixes the most findings at once):**
> **Structured data is the source of truth; Markdown and command output are generated from it.**
This single change dissolves the duplicated token tables, contradictory numbers, stale command text,
unsupported "exact-spec" claims, and manual version drift the audit found.

**Decisions already made by the maintainer (do not re-litigate):**
- **Gate direction = HARDEN (report-bound).** The gate stays a real gate, but a pass must be a
  validated, content-bound report — not a forgeable marker. (Audit offered "advisory"; rejected.)
- **Scope = full phased program, Phases 0–6.**

**Tech stack:** Node ESM (`.mjs`, `node:test`), JSON Schema (Ajv or a tiny hand-rolled validator to
avoid deps), GitHub Actions, Playwright (already an optional plugin) for the visual adapter, Swift for
the existing SDK probe. No new runtime dependencies in the plugin itself where avoidable.

---

## How this audit was triaged (verified against the repo, not taken on faith)

Every load-bearing finding below was confirmed in the current `main`:

| Audit ID | Confirmed in code | Phase |
|---|---|---|
| P0-07 contrast contradiction | `accessibility.md:16` (glyphs 4.5:1) vs `color.md:85` (glyphs 3:1) | 0 |
| P0-09 SessionStart cost | `hooks.json` echo + `README:169` "no model context cost" | 0 |
| P0-08 command namespace/count | bare `/hig-review` in docs; `index.html:233` "Three commands" (4 exist) | 0 |
| P0-01 "complete copy" | `README:15`, `index.html:149` vs LICENSE non-redistribution | 0 |
| P2-01 LOC misclassification | `loc-graph.mjs` buckets all `.md` as reference | 0 |
| P1-05 fixed font size | `hig-tokens.md:60` emits `.system(size:17…)` | 0 |
| P0-05 no injection boundary | `design-reviewer.md` has no untrusted-input policy | 0 |
| P0-10 no repo-wide CI | only `sdk-bridge.yml` (paths `scripts/**`) + `loc.yml` | 1 |
| P0-02 forgeable gate | `hig-gate.mjs:99` `runPass` writes marker w/o a report | 3 |
| P0-03 `git -C` mismatch | `isGitCommit` accepts `-C`; hook uses `process.cwd()` | 3 |
| P1-14/15 gate scope/fail-open | `DEFAULT_EXT` incl. `.ts/.js/.java/.xml`; `allow()` on errors | 3 |
| P1-16/17 notifier `main`/tmp | `version-check.mjs` fetches `main`; markers in `tmpdir()` | 5 |

**Findings I judged partly stale or low-value** (do opportunistically, not as gating work): P1-23
(animation "only" headline — `motion.md` is already mostly nuanced), P1-22 (MapKit — scaffold already
degrades gracefully), P1-02/03/04 (reviewer heuristic absolutism — wording).

**Findings whose full remedy is a much larger product** (kept, but explicitly staged and de-risked, not
treated as "must-ship-now"): the deterministic analyzer (P0-04), the fully structured corpus (P0-06 /
Phase 4), Reviewer v2 (Epic C), and the benchmark suite (Phase 6). The cheap, high-value kernels of
these (honest verdict labels, the specific contradiction fix, claim-authority *labels*) are pulled
forward into Phases 0–2.

---

## Phase map (each phase = its own executable sub-plan)

| Phase | Theme | Sub-plan file | Status |
|---|---|---|---|
| 0 | Stop overstating certainty (trust & correctness) | `2026-06-17-v2-phase0-trust-plan.md` | **written, ready** |
| 1 | Repository integrity (CI + consistency tests) | `2026-06-17-v2-phase1-integrity-plan.md` | **written, ready** |
| 2 | Reviewer v2 (evidence + honest verdicts) | `…-v2-phase2-reviewer-plan.md` | to author when reached |
| 3 | Gate hardening (report-bound) | `…-v2-phase3-gate-plan.md` | design below; author when reached |
| 4 | Structured corpus & tokens | `…-v2-phase4-corpus-plan.md` | to author when reached |
| 5 | Installer / updater / SDK lifecycle | `…-v2-phase5-lifecycle-plan.md` | to author when reached |
| 6 | Product validation (benchmarks) | `…-v2-phase6-validation-plan.md` | to author when reached |

**Why not write all seven keystroke-level plans now:** Phases 2–6 depend on artifacts produced earlier
(the report schema from P2 is consumed by the P3 gate; the token JSON from P4 changes `hig-tokens`).
Specifying their every step before Phase 0 reshapes the corpus would be premature and would drift.
This master file specifies them to **task level** (below); each is expanded to bite-sized steps
just-in-time, when its turn comes.

---

## Phase 0 — Stop overstating certainty  *(detailed plan exists)*

**Goal:** public docs and behavior match. **Exit:** no "complete copy"/"no model context cost"/wrong
command names remain; contradiction gone; LOC chart honest; injection boundary in place; SECURITY.md +
CHANGELOG.md exist. **Audit:** P0-01, P0-05, P0-07, P0-08, P0-09, P1-05, P2-01, P2-04, P2-15, P2-16, P1-24.

## Phase 1 — Repository integrity  *(detailed plan exists)*

**Goal:** no merge can bypass core validation. **Exit:** required `ci.yml` runs `node --test` (Linux/
macOS/Windows) + `claude plugin validate --strict` + JSON/YAML + internal-link + version-consistency +
command-inventory + LOC-freshness; branch protection requires it. **Audit:** P0-10, P2-03, P2-05, P0-08
(enforcement), P2-08 (seed).

## Phase 2 — Reviewer v2 (task-level spec)

**Goal:** the reviewer reports *what it actually checked* and never launders a guess as a fact.
**Tasks:** (a) `data/schema/review-report.schema.json` — the structured report (mode, verificationLevel,
findings[{authority,severity,confidence,evidenceType,location,source}], checksRun/Skipped, verdict).
(b) Verdict taxonomy `verified-pass | advisory-pass | fail | incomplete`; a missing visual/runtime check
*cannot* yield `verified-pass`. (c) Severity×confidence×evidence rubric (the audit's P1-12 matrix).
(d) Mandatory screen-level hierarchy contract (P1-01): purpose / primary task / expected vs observed
attention order / global+local action hierarchy. (e) `--changed` / `--baseline` / waiver support (P1-13).
(f) Deterministic static analyzer **core + one adapter** (web/CSS first: token resolution, computed
contrast where resolvable, target-size from declared CSS, off-grid relationships) — start small, prove
the evidence-layer pattern. (g) Visual adapter via Playwright (light/dark, narrow/wide, large-text,
focus order, target boxes). (h) Golden + adversarial fixtures (P2-09, §9.2/9.3). **Exit:** reviewer
output validates against the schema and distinguishes static/runtime/inferred/unverified.

## Phase 3 — Gate hardening (report-bound)  *(design below)*

**Goal:** a marker cannot be forged via the public CLI; a pass proves a defined check-set ran against
*this* staged tree. **Tasks:** (a) **Remove the unconditional `--pass`** from `hig-gate.mjs`. (b) Add
`hooks/report-verifier.mjs` that validates a review-report object (Phase-2 schema) before any marker is
written. (c) Bind the marker to `stagedTreeDigest` + `rulesetDigest` + `analyzerVersion` + `pluginVersion`
+ `expiresAt` (TTL); invalidate on any change. (d) **Fix `git -C`/target-repo resolution** — parse the
supported command grammar and resolve the real target, or return `unable-to-verify` (never a silent
pass) for unsupported shapes. (e) Ship a **native git `pre-commit` hook** + a **CI gate command** so the
check also runs outside Claude's Bash hook. (f) `strict` (fail-closed) vs `advisory` (fail-open) config,
documented — "mandatory" only describes strict mode. (g) Layered UI-relevance detection (globs +
project discovery + content heuristics) replacing the raw extension list (P1-14); include deleted UI
files. (h) Forgery + prompt-injection tests (D9). **Exit:** `runPass`-style direct approval is gone;
forged/stale/mismatched/incomplete reports are rejected by tests.

**Honest limitation (state it in docs):** without a trusted execution environment the *model* can still
emit a "pass" report, so this raises the forgery bar (no trivial `--pass`, content+ruleset+version+TTL
binding, schema validation, deterministic re-derivation of `stagedTreeDigest`) rather than proving
human-grade compliance. Phase-2 deterministic checks are what make a `verified-pass` meaningful.

**Report object (shared with Phase 2):**
```json
{ "schema":1, "pluginVersion":"x.y.z", "rulesetDigest":"sha256:…", "analyzerVersion":"…",
  "stagedTreeDigest":"sha256:…", "reviewedFiles":[], "checksRun":[], "checksSkipped":[],
  "findings":[], "verdict":"verified-pass|advisory-pass|fail|incomplete",
  "createdAt":"…", "expiresAt":"…" }
```

## Phase 4 — Structured corpus & tokens (task-level spec)

**Goal:** no duplicated manual numeric source of truth; every numeric rule has a claim type + provenance.
**Tasks:** `data/schema/{claims,tokens}.schema.json`; `data/tokens/ios-26.json`, `ios-27.json`;
claim-authority types (`apple_published | platform_api_observed | wcag_external |
project_recommendation | community_convention | inference | version_sensitive | legal_interpretation`);
per-claim `source{url,section,verified_at}`; platform/OS availability metadata; **generators**
(`scripts/build-corpus.mjs`) that emit the guideline Markdown tables, the `hig-tokens` output, and docs
snippets from the JSON; contradiction + staleness validators (P2-07/08); separate "reference swatch/ramp"
from "production semantic API" output (P1-06/07, E2/E3). **Exit:** Markdown is generated; editing a number
means editing one JSON file; CI fails on contradiction/missing provenance. **Depends on:** Phase 1 CI.

## Phase 5 — Installer / updater / SDK lifecycle (task-level spec)

**Goal:** upgrades safe, reversible, testable. **Tasks:** install ownership manifest
(`{version,tool,files[{path,sha256,owned}]}`); `install|update|uninstall|status|doctor|--dry-run|--backup`;
atomic temp-dir swap for vendored corpus + stale-file cleanup (P1-18); reject unknown flags; scope
cross-tool rules by UI globs (P1-19); move state from `tmpdir()` to the plugin data dir (P1-17); update
notifier checks a **release/tag**, not mutable `main`, with size cap + deadline + schema + ETag (P1-16);
SDK: clean temp builds in `finally`, validate `UIColor.getRed` success, JSON-Schema the probe/cache,
add `probeVersion`, precise `symbolAvailabilityCheck` naming, "SDK-resolved Mac Catalyst reference
values" terminology (P1-20/21). **Exit:** clean install/upgrade/uninstall fixtures pass on all OSes.

## Phase 6 — Product validation (task-level spec)

**Goal:** claims backed by repeatable evidence. **Tasks:** public benchmark suite (good/bad fixtures,
expected rule IDs/severity, precision/recall, false-pos/neg per file, run-to-run agreement, token usage,
% findings with deterministic evidence); multi-stack pilots; visual-regression suite; responsive demos
at real target size (P2-10); a release-quality dashboard; docs generated from the tested inventory.
**Exit:** the website can cite measured numbers instead of curated before/after screenshots.

---

## Sequencing & dependencies

```
Phase 0 ──▶ Phase 1 ──▶ Phase 2 ──▶ Phase 3
                 │            └────────────▶ (P3 consumes the P2 report schema)
                 └──▶ Phase 4 ──▶ Phase 5
                              └──▶ Phase 6 (consumes P2 fixtures + P4 data)
```
0 and 1 are prerequisites for everything (they make the repo safe to change fast). 2 must precede 3
(the gate validates the Phase-2 report). 4 can run parallel to 2/3 after 1. 5 and 6 are last.

## Risks / non-goals

- **Non-goal:** becoming a certification authority. We make claims *honest*, not *legally guaranteed*.
- **Risk:** Phase 2's deterministic analyzer is the largest single lift — keep it to one adapter first;
  do not block Phases 0–1 (pure wins) on it.
- **Risk:** `claude plugin validate --strict` behavior in CI on Windows/headless — validate early in
  Phase 1; fall back to a JSON-shape validator if the CLI is unavailable on a runner.

## Execution handoff

Each phase plan ends with the standard two options (Subagent-Driven vs Inline). Recommended order:
execute **Phase 0** first (fast, pure trust wins, unblocks honest positioning for the promotion work),
then **Phase 1**, then author + execute 2→3, with 4 in parallel after 1.

> Project note: per maintainer preference, any subagents dispatched to execute these plans use the
> Opus model tier (do not down-tier mechanical tasks).
