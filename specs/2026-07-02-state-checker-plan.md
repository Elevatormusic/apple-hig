# State Checker (1.10.0) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build [2026-07-02-state-checker-design.md](2026-07-02-state-checker-design.md): the JUCE
probe state sweep, the additive descriptor extension, the dependency-free recipe parser, and the
three check tiers wired into the native review path.

**Architecture:** New `scripts/recipe-tokens.mjs` (parser) + `stateFindings()` in
`scripts/native-review.mjs`; additive fields in `scripts/native-descriptor.mjs` +
`schemas/native-render.schema.json`; a `hig::sweepStates` section in
`skills/apple-hig/references/juce-design-probe.h`. The verified research (grammar rules, J-claims,
direction-model exception list) is the implementation reference:
`private/2026-07-02-state-checker-research.json` (local-only).

**Tech Stack:** Dependency-free Node ESM + `node --test`; header-only JUCE C++ (no local compile —
maintainer validates on-device, as with v1.7.0).

## Global Constraints

- Commit author `Elevatormusic <22101396+Elevatormusic@users.noreply.github.com>`; no Claude
  co-author trailer; never push; worktree branch `feat/state-checker`.
- Never touch anything under paths containing `EARS_program` or `ears-bridge`.
- The research JSON is the ground truth for grammar rules, the sweep ordering, and the tier-2
  exception list — when implementing, read it from the MAIN checkout's `private/` (gitignored,
  absent from the worktree). Cite JUCE facts in code comments as "(verified: juce_Button.cpp)".
- Native reviews stay `advisory-pass`-capped; all new findings are `evidence: extracted`.
- Version bump to **1.10.0** (4 spots) in the final task only. Suite green after every task —
  check via exit code (`npm test > /dev/null 2>&1 && echo GREEN`), never through a pipe.
- **Execution model (maintainer's choice):** Fable 5 orchestrates; each task is implemented by a
  fresh **Opus 4.8** subagent; every task then gets a **Fable 5** two-stage recheck (spec
  compliance, then code quality) before the next task starts.

---

### Task S1: recipe parser (`scripts/recipe-tokens.mjs`)

**Files:** Create `scripts/recipe-tokens.mjs`; Test `test/recipe-tokens.test.mjs`.
**Interfaces — Produces:**
`parseRecipes({ controlTokensText, designTokensText }) -> { tables, cells, arrows, resolve(aliasPath) -> {hex, alpha}|null, get(context, group, variant, appearance, state) -> Cell[] }`
and `compositeAlpha(layers: {alpha:number}[]) -> number` (= `1−∏(1−αᵢ)`).

TDD contract (write first, verify red, implement, verify green — the counts are the
machine-verified ground truth; if the implementation disagrees with a count, the implementation is
wrong):

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseRecipes, compositeAlpha } from '../scripts/recipe-tokens.mjs';
const ref = (p) => readFileSync(new URL('../skills/apple-hig/references/' + p, import.meta.url), 'utf8');
const R = parseRecipes({ controlTokensText: ref('control-tokens-macos.md'), designTokensText: ref('design-tokens-macos.md') });

test('pinned grammar counts (machine-verified 2026-07-02)', () => {
  assert.equal(R.tables.length, 29);
  assert.equal(R.cells.filter(c => c.kind !== 'key').length, 273);
  assert.equal(R.arrows.length, 158);
  assert.equal(new Set(R.arrows.map(a => a.target)).size, 29);
  assert.equal(R.arrows.filter(a => R.resolve(a.raw) === null).length, 0, 'every alias resolves');
  assert.equal(R.cells.filter(c => c.kind === 'unparseable').length, 0);
});

test('spot cells: literal, focus-ring strokes, equality marker, absent', () => {
  const idle = R.get('CONTENT AREA', 'Buttons', '01 — Bordered', 'Light', 'Idle');
  assert.equal(idle[0].layers[0].hex.toUpperCase(), '#000000');
  assert.equal(idle[0].layers[0].alpha, 0.08);
  const focus = R.cells.find(c => c.kind === 'border' && c.strokes?.some(s => s.widthPx === 3.5));
  assert.ok(focus, 'the 3.5px focus-ring stroke parses');
  assert.ok(R.cells.some(c => c.kind === 'equals-content-area'));
  assert.ok(R.cells.some(c => c.kind === 'absent'));
});

test('compositeAlpha', () => {
  assert.ok(Math.abs(compositeAlpha([{ alpha: 0.5 }, { alpha: 0.5 }]) - 0.75) < 1e-9);
  assert.equal(compositeAlpha([{ alpha: 1 }]), 1);
});
```

Implementation per the research grammar (H1 context axis `/^# (CONTENT AREA|OVER-GLASS|GLOBAL
LEFTOVERS)$/`, H2 groups, H3 `/^### (\d\d) — (.+)$/` | `Light`/`Dark` | sub-recipes; cell rules
incl. `·` layer split, all arrow forms, `α`/`a=`/`(a1.0)` alpha variants, bold-width strokes,
U+2212 offsets, `= Content Area`, em-dash). Commit: `feat(state-checker): dependency-free recipe
parser pinned to the machine-verified grammar`.

### Task S2: the three tiers (`stateFindings` in native-review.mjs)

**Files:** Modify `scripts/native-review.mjs`; Test `test/state-checks.test.mjs`.
**Interfaces — Produces:** `stateFindings(descriptor, opts?: { aestheticProfile?: 'apple-macos' })
-> findings[]` (shape matches the existing finding emitters); wired into
`reviewNativeDescriptor()` output + its verdict/blind-spot plumbing (descriptor `sweep.blindSpots`
merge into the review result).

TDD contract (synthetic descriptors; write first):

```js
test('tier 1: a control identical across ALL swept states fires; one equal pair does not', ...);
test('tier 2: disabled louder than normal fires on composite contrast; recipe-corpus exceptions suppressed', ...);
test('tier 3: opt-in recipe diff — expected-equal pair differing fires; without the profile no tier-3 findings', ...);
test('sweep blind spots surface in the review result (invariant C food)', ...);
```

Each test builds a minimal descriptor `{ meta, elements: [{ id, role: 'button', states: {...} }],
sweep: {...} }`; tolerance for "identical" = per-channel ≤2/255 across mean + grid. The tier-2
suppression table is transcribed from the research JSON's `directionModel` exceptions (cite each
in a comment). Commit: `feat(state-checker): inertness/direction/recipe-diff tiers on swept
descriptors`.

### Task S3: descriptor extension

**Files:** Modify `scripts/native-descriptor.mjs`, `schemas/native-render.schema.json`; Test:
extend `test/native-path.test.mjs` (follow its existing shape) — old descriptors (no `states`/
`sweep`) still validate; new fields validate; malformed `states` rejected. Commit:
`feat(state-checker): additive native-render descriptor fields for the state sweep`.

### Task S4: the probe sweep (C++ header)

**Files:** Modify `skills/apple-hig/references/juce-design-probe.h`; update
`skills/apple-hig/references/native-juce-review.md` (usage + declared side effects + blind spots)
and the router `states` row method note (one line: swept descriptors carry measured states).
**Requirements (each maps to a verified J-claim; cite in comments):**
- `sweepStates(Component& root)` walks the same tree as `describeComponentTree`; Buttons get
  normal/over/down/disabled(+toggle where `getClickingTogglesState` or ToggleButton); other
  components disabled-only.
- Ordering per the spec's protocol (enabled/toggle first, `setState` LAST, snapshot, restore in
  reverse; radio-group siblings saved/restored).
- Root snapshot per state via the existing 3-param `createComponentSnapshot`; sample the control's
  root-relative rect through one `Image::BitmapData` scope; skip `a==0` pixels; emit mean rgb +
  mean alpha + 4×4 grid.
- All `JUCE_DEBUG`-gated, message-thread `jassert`, no new JUCE-version-specific APIs (compiles on
  JUCE 6.1+ like the rest of the header).
- Descriptor JSON emission matches Task S3's schema exactly.
No local compile: the task's "test" = full `npm test` (docs/tests untouched by C++) + a dedicated
Fable line-by-line header review against the J-claims (Task S6) + the maintainer's on-device build.
Commit: `feat(state-checker): probe-side state sweep (verified ordering + restore protocol, sampled
per-state colors, declared blind spots)`.

### Task S5: fixture + docs

**Files:** Extend `test/fixtures/native/ears-like.json` (one inert swept control — the seeded bug —
one healthy swept control, + the `sweep` block); extend `test/native-path.test.mjs` (the inert
control must produce the tier-1 finding through the real `reviewNativeDescriptor` path; blind
spots appear in output). Commit: `feat(state-checker): golden fixture sweeps + end-to-end native
path assertions`.

### Task S6: release + review

CHANGELOG 1.10.0 entry (house style; honest compile caveat), version bump ×4, full suite via exit
code, no-private-staged check, then the final fresh-context Fable review (header vs J-claims is
the designated risk center; parser vs pinned counts; tier semantics vs the spec's reframing;
release hygiene). Fix findings, re-verify, commit
`release: 1.10.0 - the recipe-consuming state checker`.

## Self-review notes (applied)

- Spec coverage: parser S1, tiers S2, descriptor S3, sweep+docs S4, fixture/e2e S5, release S6;
  blind-spot wiring in S2+S4; equality-as-ground-truth in S2 tier 3.
- The C++ compile gap is explicit (S4/S6) — same honesty as v1.7.0.
- Names used consistently: `parseRecipes`/`compositeAlpha` (S1) consumed in S2; `states`/`sweep`
  fields (S3) consumed in S2/S4/S5.
