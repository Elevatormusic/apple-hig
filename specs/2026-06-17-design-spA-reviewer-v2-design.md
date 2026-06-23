# SP-A — Reviewer v2: finding schema + mandatory design method (design spec)

**Part of:** the design-audit response program (design audit, June 17 2026). Sub-project A of four
(A reviewer foundation, B corpus depth, C scaffold+visual, D benchmark). The general/governance audit
(#1) is deferred except the one prerequisite noted below.

**Goal:** Turn `agents/design-reviewer.md` from a flat 11-item compliance checklist with a binary
verdict into a **staged design-review method** that judges the user's task, hierarchy, information
architecture, states, and platform fit — and that reports every finding with explicit authority,
severity, confidence, and evidence type, so a subjective judgment can never read as a measured fact.

**Why this is SP-A (the foundation):** every other sub-project (corpus depth, scaffold, benchmark)
emits or measures findings in the schema and verdict model defined here. Build it first.

**Prerequisite pulled from audit #1 (deliberate, minimal):** the verified-vs-advisory verdict +
confidence layer (audit-#1 P0-04). Without it, adding dozens of *subjective* design judgments on top
of today's binary `pass/fail` would amplify false positives — the exact failure both audits warn about.
Only the design-review-facing slice is pulled in here; the commit-gate integration stays deferred.

---

## Component 1 — The finding schema

Every finding the reviewer emits has this shape:

```
finding = {
  id:         string,                  // stable within a report
  ruleId:     string,                  // e.g. "hierarchy.competing-primary"
  category:   "hierarchy" | "task-fit" | "ia" | "state" | "error-recovery" |
              "accessibility" | "visual" | "interaction" | "platform-fit" | "content",
  authority:  "apple_published" | "platform_api_observed" | "wcag_external" |
              "project_recommendation" | "community_convention" | "inference",
  severity:   "critical" | "high" | "medium" | "low" | "advisory",
  confidence: "high" | "medium" | "low",
  evidence:   "static-code" | "computed" | "screenshot" | "a11y-tree" | "inferred",
  location:   { file?, line?, selector?, element?, screenState? },
  problem:    string,                  // what's wrong, quoting the offending code/element
  userImpact: string,                  // who is hurt and how (not just "violates rule X")
  fix:        string,                  // concrete change
  source:     string | null,          // Apple source_url / WCAG ref when authority warrants
  howToVerify:string                   // how a human confirms it (esp. for inferred findings)
}
```

`userImpact` is required and is what separates a design finding from a lint hit: a finding must name
the user consequence, not merely cite a rule.

## Component 2 — Verdict + verification level + the blocking rule

```
report = {
  schema: 1,
  scope:  "element" | "component" | "screen" | "flow",     // see proportionality valve
  level:  "static" | "visual" | "full",                    // how much was actually rendered
  platforms: [], stack: "", deploymentTarget: "" | null,
  stagesRun: [], stagesSkipped: [],                        // honesty about coverage
  findings: [ finding, ... ],
  verdict: "verified-pass" | "advisory-pass" | "fail" | "incomplete"
}
```

- `level`: **static** = code only; **visual** = some rendered modes; **full** = every mode the screen
  type requires (SP-C defines the mode set). A static-only review can **never** be `verified-pass`.
- `verdict`:
  - **verified-pass** — required rendered checks ran AND no `critical`/`high` with confidence ≥ medium.
  - **advisory-pass** — heuristic/static review, same finding bar.
  - **fail** — at least one `critical` or `high` finding at confidence ≥ medium.
  - **incomplete** — the reviewer could not establish the task/context confidently enough to judge
    hierarchy. It says so and lowers confidence rather than inventing a hierarchy.
- **Blocking rule:** only `critical`/`high` at confidence ≥ medium drive `fail`. A low-confidence
  design *preference* is reported as `advisory` and never blocks.

**Machine-readable last line** (evolves the current `HIG-VERDICT`):
`HIG-VERDICT: <verdict> level=<static|visual|full> scope=<element|component|screen|flow> (critical=n high=n medium=n low=n advisory=n)`

## Component 3 — Severity rubric (design-specific, audit §10)

- **critical** — primary task cannot be completed; a dangerous action is misleading; a critical warning
  is effectively hidden; navigation creates a dead end; accessibility blocks a core feature; reading
  order causes materially wrong understanding; responsive layout makes essential content unreachable.
- **high** — primary action/content unclear; multiple actions compete at one hierarchy level; missing
  error recovery; an important state is absent; IA materially increases mistakes; large-text or focus
  behavior breaks a core flow; the platform interaction model is substantially wrong.
- **medium** — noticeable friction; weak grouping; excessive density; inappropriate card/modal; a
  secondary accessibility issue; inconsistent action hierarchy; poor progressive disclosure.
- **low** — minor visual inconsistency; noncritical spacing/alignment; copy polish; small refinement.
- **advisory** — brand/aesthetic recommendation; community convention; alternative direction;
  low-confidence inference; preference rather than requirement.

## Component 4 — Confidence model

- **high** — directly measured or visually obvious (rendered evidence, or an unambiguous code fact).
- **medium** — supported by code and context.
- **low** — inferred from incomplete product information.

A low-confidence design preference must never block a release.

## Component 5 — The staged review method (replaces the flat checklist)

The reviewer's Procedure becomes seven stages, run in order, each producing findings in the schema:

1. **Context** — platform(s), device/window, input mode, deployment target, user type, screen purpose,
   primary task, success condition. If the task cannot be inferred confidently → mark `incomplete`.
2. **Screen model** — main content, current status, primary action (may be *none*), secondary actions,
   destructive actions, navigation, supporting info, advanced details; distinguish **global vs local**
   action hierarchies.
3. **Information architecture** — order, grouping, relationships, disclosure timing, navigation,
   density, decision burden (cognitive load), redundancy.
4. **Visual + task hierarchy** — expected vs observed attention order, dominant element, typography
   hierarchy, visual weight, container/card use, color emphasis, spacing *relationships*, content-vs-
   chrome layering, competing primary emphasis, critical-status prominence.
5. **Interaction + states** — the state matrix (default, hover/pointer, pressed, focused, selected,
   disabled, loading, empty, error, offline, permission-denied), feedback loop (ack→progress→outcome→
   recovery), error prevention/recovery, confirmation/undo, modal/navigation/search behavior, focus.
6. **Accessibility as evidence** — semantics (role/value/state), reading order, Dynamic Type reflow,
   contrast on the rendered background, target geometry after layout, motion/transparency, localization/
   RTL, alternative input. Each finding tagged `static-code | computed | screenshot | a11y-tree | inferred`.
7. **Platform fit** — components, navigation, window model, input conventions, version availability /
   deployment-target, responsive/adaptive behavior.

The existing 11 mechanical checks are **retained** but become detail inside stages 4–7 (e.g. target
size and contrast live in stage 6, hardcoded color in stage 4), so nothing currently caught is lost.

## Component 6 — Proportionality valve

Before running stages, the reviewer classifies the **request scope** and runs only the fitting stages:

| Scope | Stages run | Hard rule |
|---|---|---|
| element/snippet | relevant control checks (targets, label, contrast, its states) | **No** fabricated screen/task model |
| component | states + interaction + the component's local hierarchy | local hierarchy only |
| screen | all 7 | task model + hierarchy **mandatory** |
| flow | all 7 + flow-level (entry/back/cancel/save/resume, modal stacking) | sequence reviewed, not just screens |

This is the antidote to the audit's own risk of becoming "number-policing for states." Rigor scales to
the unit under review; `stagesSkipped` records what was intentionally not run.

## Component 7 — Integration into `agents/design-reviewer.md`

Rewrite the agent file to: (a) keep the **trust boundary** (untrusted-input/prompt-injection policy —
already specified in the program's Phase-0 task; include it here so SP-A ships it); (b) replace
"Procedure" + "Checklist" with the staged method + proportionality valve; (c) fold the existing 11
mechanical checks into stages 4–7 verbatim (no rule lost); (d) replace the output format with the
schema + the evolved `HIG-VERDICT` line; (e) keep "Looks good:" balanced reporting and the
"avoid false positives" guidance, reinforced by the confidence/blocking rule.

## Testing approach

A prompt-based reviewer is not deterministic, so SP-A's *testable* artifacts are:

1. **`data/schema/design-review-report.schema.json`** — a JSON Schema for `report`/`finding`. Tested
   with `test/design-review-schema.test.mjs`: valid sample reports pass; reports that are missing
   `userImpact`, use an unknown `authority`/`severity`, or claim `verified-pass` at `level: static`
   are rejected. (The schema doubles as the contract SP-D's benchmark and any future gate validate.)
2. **`test/reviewer-method.test.mjs`** — contract/presence tests on the rewritten agent file: the
   seven stage names, the proportionality table, the trust boundary, the verdict taxonomy, the blocking
   rule, and the evolved `HIG-VERDICT` format are all present; the flat "scan the checklist" procedure
   is gone.
3. **Fixtures** seeded for SP-D's behavioral benchmark live under `test/fixtures/design/` (created here,
   exercised there): at minimum a "perfect tokens, wrong hierarchy" screen and a "monitoring screen
   with no CTA" (must pass) — proving the method's two headline behaviors.

Behavioral measurement (does the reviewer actually catch the seeded failure?) is **SP-D**, not SP-A.

## In scope (SP-A) vs deferred

- **SP-A:** the schema + verdict model + severity/confidence rubric + the staged method +
  proportionality valve + the `design-reviewer.md` rewrite + the JSON schema + contract tests + seed
  fixtures.
- **SP-B:** corpus depth (contrast-role table, relational spacing, color roles, typography hierarchy,
  cards, glass-fit, brand, UX-writing) + platform design rubrics. *(References SP-A categories.)*
- **SP-C:** scaffold v2 (plan-before-code) + the rendered visual-verification mode set that defines when
  `level` reaches `visual`/`full`.
- **SP-D:** benchmark (fixtures + seeded failures + precision/recall harness + Opus judge-panel proxy).

## Research-validation findings (folded in — authoritative)

Grounded against primary sources (66 dimensions, Apple HIG + WCAG 2.1/2.2 + NN/g + axe-core). These
are binding on the implementation.

### Canonical contrast-role table (consumed here AND by SP-B)

| Role | Ratio | Authority | Source |
|---|---|---|---|
| Body / normal text | 4.5:1 | wcag_external | WCAG 1.4.3 (AA) |
| Large text (≥18pt / ≥14pt bold) | 3:1 | wcag_external | WCAG 1.4.3 (AA) |
| Placeholder (active input) | 4.5:1 | wcag_external | WCAG 1.4.3 |
| **Meaningful non-text glyph / icon-only-button symbol** | **3:1** | wcag_external | **WCAG 1.4.11** |
| UI-component / control state & boundary | 3:1 | wcag_external | WCAG 1.4.11 |
| Focus-indicator contrast | 3:1 | wcag_external | WCAG 1.4.11 (visibility separately: 2.4.7, no ratio) |
| Disabled / inactive control | exempt | wcag_external | WCAG 1.4.11 / 1.4.3 |
| Purely decorative glyph / image | exempt | wcag_external | WCAG 1.4.3 / 1.4.11 |
| Logotype / brand name | exempt | wcag_external | WCAG 1.4.3 |
| Meaning by color alone | prohibited | apple_published + wcag_external | Apple Color + WCAG 1.4.1 (Level A) |
| Enhanced (preferred legibility) | 7:1 (AAA — never a pass/fail floor) | wcag_external | WCAG 1.4.6 |

The reviewer must **assign the role before applying a ratio**, and must **not** flag decorative,
disabled, or logotype elements. The contrast numbers carry `authority: wcag_external` (Apple republishes
them; they originate with W3C).

### Authority-labeling rules (binding)

- **"One primary action per screen"** → `inference` on iOS/iPadOS/macOS/web. Reword the rule from
  "exactly one / competing = violation" to: *give the primary action clear visual prominence; multiple
  co-equal high-emphasis actions weaken hierarchy (NN/g: ≤2 dominant elements)*. Severity ≤ medium
  unless it demonstrably blocks the primary task. **Exception:** watchOS or the hardware Action button →
  `apple_published` ("single primary action" verbatim), higher severity allowed.
- **Visual hierarchy** → `apple_published` only when citing Apple's iOS Hierarchy theme; the general
  scale/contrast/proximity/attention-order mechanics → `community_convention` (NN/g).
- **44pt target** → `apple_published` *default* (28 floor; 60 visionOS); the "flag < 44" policy is a
  `project_recommendation`. Web targets: WCAG AA floor is **24px** (2.5.8); 44px is AAA (2.5.5) — never
  assert "WCAG requires 44."
- **4/8 spacing grid** → `community_convention`, severity ≤ low, never blocking. The `apple_published`
  spacing facts are the 16/20pt layout margins + tvOS 60/80 overscan.
- **Feedback loop, error-message quality, recognition-over-recall, progressive disclosure, cognitive
  load, state-coverage matrix** → `community_convention` (NN/g heuristics #1/#9/#6 + Progressive
  Disclosure 2006). Cross-cite WCAG **4.1.3** (status messages, AA), **3.3.1** (error identification, A),
  **3.3.4** (error prevention, AA) for the testable/blocking parts. Apple's Feedback page is
  `apple_published` for platform mechanics + "build in forgiveness: undo + confirmation for destructive
  actions."
- **VoiceOver** → broaden beyond "missing label" to require **value, traits/role, and announced state**
  (`apple_published` UIAccessibility) + cross-cite WCAG **4.1.2** Name/Role/Value and **1.1.1** (both
  Level A) to justify high/critical severity. Web role/value/state = WAI-ARIA (`community_convention`).
- **Tab-bar "2-5"** → `community_convention` (current HIG is qualitative "avoid too many"); the >5→More
  overflow is `platform_api_observed`.

### Refinement to Component 2 (blocking rule)

Hard-`fail` only on **A/AA-equivalent findings at confidence ≥ medium**. AAA-equivalent (7:1 contrast,
WCAG 2.3.3 motion) and all low-confidence items go `advisory` (non-blocking). Methodological precedent:
**WCAG-EM** (automated-then-mandatory-manual; scope before judging) backs the `level: static|visual|full`
ladder and "a static-only review can never be `verified-pass`" (`authority: wcag_external`).

### Refinement to Component 3 (severity wording)

Anchor the four blocking tiers to **axe-core** impact wording: `critical` = blocks the primary task /
blocks assistive-tech access to a core feature; `high`≈serious = partially/fully prevents; `medium`≈
moderate = some difficulty but generally not prevented; `low`≈minor = nuisance (still a real defect).
The extra `advisory` tier (preference/aesthetic/low-confidence) has no axe-core analog — keep it strictly
non-blocking and separate from `low`.

### Feeds SP-B (corpus) — corrections to apply there, not here

The full per-file corrections (e.g. `accessibility.md:16` glyph 4.5:1→3:1 with the 1.4.11 split + the
decorative/disabled exemptions; `tab-bars.md` "2-5" softening; spacing-grid authority; `feedback.md`
split-authority front-matter) are SP-B work. SP-A only encodes the **schema, the staged method, the
authority-labeling rules, the contrast-role table, and the severity model** that SP-B's corpus then
conforms to. (This also supersedes the program's Phase-0 contrast-contradiction task: the canonical
resolution is glyph = 3:1 per WCAG 1.4.11.)

## Architecture / isolation notes

- The JSON schema is the one durable interface; the agent `.md` and (later) the benchmark depend on it,
  not on each other.
- No new runtime dependency (schema validated by a tiny hand-rolled checker or `node:`-only Ajv-free
  validation in tests).
- The rewrite stays one file (`design-reviewer.md`); if it grows past ~250 lines, split the staged
  method into a referenced `agents/design-review-method.md` the agent loads — decide during the plan.
