# Review Router (1.9.0) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the routing-table-driven reviewer specced in
[2026-06-24-review-router-design.md](2026-06-24-review-router-design.md): per-subsystem focused
passes, targeted `--only` audits, lazy per-row rule loading, the three gap-closer subsystems
(microcopy & consistency, static state-coverage, motion), the blind-spot-honest verdict, and
fan-out for large reviews.

**Architecture:** One new deterministic script (`scripts/microcopy-checks.mjs`, unit-tested against
the exact examples that motivated it), one new thin routing table
(`skills/apple-hig/references/review-router.md`), driver changes in `agents/design-reviewer.md` and
`commands/hig-review.md`, and a new verdict invariant in `scripts/validate-review-report.mjs`.
Everything else is indexed, not restated — rows point at existing rubric dims and the 1.8.0
token/control references.

**Tech Stack:** Markdown guideline/agent files; dependency-free Node ESM scripts; `node --test`.

## Global Constraints

- Commit author `Elevatormusic <22101396+Elevatormusic@users.noreply.github.com>`; **no Claude
  co-author trailer**. Do not push (maintainer gates publishing).
- Work in an isolated worktree on branch `feat/review-router`.
- Authority discipline is load-bearing (the spec's microcopy section is research-validated):
  casing-consistency is the ONLY microcopy check that may reach `medium`; everything else is
  `low`/`advisory`/INFO; redundant-copy and glyph-*standardization* are **off by default**; never
  cite WCAG 3.1.2 for casing; SC 3.1.4/3.1.3 are AAA → always advisory.
- The router **indexes** rubrics/references; if a row needs prose, it gets ≤4 lines of method
  notes, never a restated ruleset.
- Version bump to **1.9.0** (4 spots: `package.json:3`, `.claude-plugin/plugin.json:4`,
  `.claude-plugin/marketplace.json:9` + `:16`) in the final task only.
- Run `npm test` from the worktree root; suite must stay green after every task.

---

### Task 1: microcopy checks script + unit tests

**Files:**
- Create: `scripts/microcopy-checks.mjs`
- Test: `test/microcopy-checks.test.mjs`

**Interfaces:**
- Produces: `runMicrocopyChecks(labels, options?) -> Finding[]` where `labels: string[]`,
  `options: { enable?: {redundantCopy?, glyphStandardization?}, profile?: 'default'|'pro-tool',
  acronymAllowlist?: string[], sectionLabel?: string, persistedData?: boolean }` and
  `Finding = { check, severity, authority, message, offenders: string[] }`.
  Also exports each check individually for testing: `casingConsistency`, `redundantCopy`,
  `longAllCaps`, `unexplainedAcronym`, `placeholderGlyphs`, `destructiveVerb`.
- Consumed by: the router table's microcopy row (Task 2) and the driver (Task 3) — the reviewer
  runs it via Bash when reviewing source, or applies the same definitions manually when Bash is
  unavailable (the agent has no Bash: the COMMAND runs it; see Task 4).

- [ ] **Step 1: Write the failing test**

Create `test/microcopy-checks.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  runMicrocopyChecks, casingConsistency, redundantCopy, longAllCaps,
  unexplainedAcronym, placeholderGlyphs, destructiveVerb,
} from '../scripts/microcopy-checks.mjs';

// —— the motivating examples (a real pro-audio app's labels) ——
test('casing consistency: same concept in two case patterns fires (the COMBINE MODE case)', () => {
  const f = casingConsistency(['COMBINE MODE', 'Combine mode', 'Input Device']);
  assert.equal(f.length, 1);
  assert.equal(f[0].check, 'casing-consistency');
  assert.equal(f[0].severity, 'medium'); // the one deterministic near-fail
  assert.equal(f[0].authority, 'apple_published');
  assert.deepEqual(f[0].offenders.sort(), ['COMBINE MODE', 'Combine mode']);
});

test('casing consistency: acronyms and distinct concepts do not fire', () => {
  assert.equal(casingConsistency(['OK', 'Ok']).length, 0); // allowlisted acronym-ish token
  assert.equal(casingConsistency(['Left', 'Right', 'USB', 'usb device']).length, 0); // different concepts
});

test('redundant copy: virtual x3 in one control string fires (off by default, on when enabled)', () => {
  const s = 'Output (Virtual Cable) VIRTUAL AUDIO virtual device';
  assert.equal(runMicrocopyChecks([s]).filter(f => f.check === 'redundant-copy').length, 0); // default OFF
  const f = redundantCopy([s]);
  assert.equal(f.length, 1);
  assert.equal(f[0].severity, 'low');
  assert.match(f[0].message, /virtual/i);
});

test('redundant copy: sibling parallelism and 2x within-string do NOT fire (needs >=3)', () => {
  assert.equal(redundantCopy(['Left ear — Left channel']).length, 0); // 2x = judgment call, not deterministic
  assert.equal(redundantCopy(['Min', 'Max', 'Left', 'Left']).length, 0); // across-sibling repeats exempt
});

test('long all-caps: passage-style fires INFO, short glanceable labels do not (NN/g)', () => {
  const f = longAllCaps(['PREFERRED DEPTH IN THE MIX', 'COMBINE MODE', 'HEQ']);
  assert.equal(f.length, 1);
  assert.equal(f[0].severity, 'info');
  assert.equal(f[0].authority, 'community_convention');
  assert.deepEqual(f[0].offenders, ['PREFERRED DEPTH IN THE MIX']);
});

test('unexplained acronym: HEQ fires advisory; allowlist + units + explained do not', () => {
  const f = unexplainedAcronym(['HEQ', 'USB input', 'Level (dB)', 'SNR (signal-to-noise ratio)']);
  assert.equal(f.length, 1);
  assert.deepEqual(f[0].offenders, ['HEQ']);
  assert.equal(f[0].authority, 'wcag_external'); // SC 3.1.4 — AAA, always advisory
  assert.equal(f[0].severity, 'low');
  // pro-tool profile drops it to info
  const pro = unexplainedAcronym(['HEQ'], { profile: 'pro-tool' });
  assert.equal(pro[0].severity, 'info');
});

test('placeholder glyphs: ... -> … fires by default; dash standardization only when enabled', () => {
  const f = placeholderGlyphs(['Loading...', 'Ready']);
  assert.equal(f.length, 1);
  assert.equal(f[0].check, 'ellipsis-correctness');
  assert.equal(f[0].authority, 'apple_published');
  const std = placeholderGlyphs(['—', '-', 'N/A'], { standardization: true });
  assert.ok(std.some(x => x.check === 'glyph-standardization'));
  assert.equal(placeholderGlyphs(['—', '-', 'N/A']).filter(x => x.check === 'glyph-standardization').length, 0);
});

test('destructive verb: Remove fires as prompt-to-verify advisory; medium only when persistedData', () => {
  const f = destructiveVerb(['Remove', 'Add device']);
  assert.equal(f.length, 1);
  assert.equal(f[0].severity, 'advisory');
  assert.match(f[0].message, /confirm|undo/i); // worded as verify-this, not asserted violation
  const gated = destructiveVerb(['Remove'], { persistedData: true });
  assert.equal(gated[0].severity, 'medium'); // the gated WCAG 3.3.4 case
});

test('runMicrocopyChecks: defaults = casing + all-caps + acronym + ellipsis + destructive; no WCAG 3.1.2 anywhere', () => {
  const f = runMicrocopyChecks(['COMBINE MODE', 'Combine mode', 'Loading...', 'HEQ', 'Remove']);
  const checks = new Set(f.map(x => x.check));
  assert.ok(checks.has('casing-consistency'));
  assert.ok(checks.has('ellipsis-correctness'));
  assert.ok(!checks.has('redundant-copy'));
  for (const x of f) assert.doesNotMatch(x.message, /3\.1\.2/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/microcopy-checks.test.mjs`
Expected: FAIL with `Cannot find module ... microcopy-checks.mjs`

- [ ] **Step 3: Write the implementation**

Create `scripts/microcopy-checks.mjs`:

```js
// Deterministic microcopy checks (review-router "Microcopy & consistency" row).
// Definitions are research-validated (spec 2026-06-24, microcopy section): every check is
// advisory-tier except casing-consistency (the one deterministic near-fail). Do NOT cite
// WCAG 3.1.2 for casing (it governs language, not capitalization); SC 3.1.4/3.1.3 are AAA.
const STOPWORDS = new Set(['a', 'an', 'the', 'of', 'in', 'on', 'to', 'and', 'or', 'for', 'with']);
const DEFAULT_ACRONYM_ALLOWLIST = ['OK', 'USB', 'URL', 'ID', 'PDF', 'HTML', 'CSS', 'API', 'GPS', 'WIFI', 'HDMI', 'USBC', 'AM', 'PM'];
const UNIT_TOKENS = new Set(['DB', 'HZ', 'KHZ', 'MS', 'PT', 'PX', 'FPS', 'KB', 'MB', 'GB']);
const NO_VALUE_TOKENS = ['—', '–', '-', 'N/A', 'n/a', 'NA', '--'];
const DESTRUCTIVE_VERBS = /^(delete|remove|erase|reset|discard|clear|revoke|unlink)\b/i;

const tokens = (s) => s.split(/[^A-Za-z0-9]+/).filter(Boolean);
const isAcronymish = (t) => /^[A-Z]{2,6}[0-9]?$/.test(t);
const find = (check, severity, authority, message, offenders) =>
  ({ check, severity, authority, message, offenders });

// 1) Casing consistency — apple_published (Writing HIG: one casing style, applied consistently).
export function casingConsistency(labels, opts = {}) {
  const allow = new Set((opts.acronymAllowlist ?? DEFAULT_ACRONYM_ALLOWLIST).map(a => a.toUpperCase()));
  const groups = new Map();
  for (const s of labels) {
    const norm = tokens(s).map(t => t.toLowerCase()).join(' ');
    if (!norm) continue;
    // single tokens that are acronyms/allowlisted can't establish a casing conflict
    const toks = tokens(s);
    if (toks.length === 1 && (allow.has(toks[0].toUpperCase()) || UNIT_TOKENS.has(toks[0].toUpperCase()))) continue;
    if (!groups.has(norm)) groups.set(norm, new Set());
    groups.get(norm).add(s);
  }
  const out = [];
  for (const [norm, forms] of groups) {
    if (forms.size >= 2) {
      out.push(find('casing-consistency', 'medium', 'apple_published',
        `"${norm}" ships in ${forms.size} different case patterns on one surface — pick title case OR sentence case and apply it consistently (Writing HIG).`,
        [...forms]));
    }
  }
  return out;
}

// 2) Redundant copy (DRY) — apple_published principle, inference detector. OFF by default.
// Deterministic threshold: a non-stopword token >=3x within ONE control's string (2x needs the
// disambiguation judgment the reviewer applies, not a script), or control-token == section label.
export function redundantCopy(labels, opts = {}) {
  const out = [];
  const section = opts.sectionLabel ? tokens(opts.sectionLabel).map(t => t.toLowerCase()) : [];
  for (const s of labels) {
    const counts = new Map();
    for (const t of tokens(s).map(t => t.toLowerCase())) {
      if (STOPWORDS.has(t)) continue;
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    for (const [t, n] of counts) {
      if (n >= 3) {
        out.push(find('redundant-copy', 'low', 'inference',
          `"${t}" appears ${n}x in one label ("${s}") — cut the repeats if the meaning survives (Writing HIG: be concise; detector is inference).`, [s]));
      } else if (n >= 1 && section.includes(t)) {
        out.push(find('redundant-copy', 'low', 'inference',
          `"${t}" repeats the section label "${opts.sectionLabel}" — usually droppable inside its own section.`, [s]));
      }
    }
  }
  return out;
}

// 3) Long all-caps — community_convention (NN/g: all-caps AIDS short glanceable labels, hurts runs).
export function longAllCaps(labels, opts = {}) {
  const maxChars = opts.maxChars ?? 15;
  const out = [];
  for (const s of labels) {
    const letters = s.replace(/[^A-Za-z]/g, '');
    if (!letters || letters !== letters.toUpperCase()) continue;
    const words = tokens(s);
    if (words.length === 1 && isAcronymish(words[0])) continue;
    if (words.length > 2 || s.length > maxChars) {
      out.push(find('long-all-caps', 'info', 'community_convention',
        `Passage-style all-caps "${s}" hurts scanability (NN/g); short eyebrow labels are fine — this one is ${words.length} words.`, [s]));
    }
  }
  return out;
}

// 4) Unexplained acronym — wcag_external SC 3.1.4 Abbreviations (AAA -> always advisory).
export function unexplainedAcronym(labels, opts = {}) {
  const allow = new Set((opts.acronymAllowlist ?? DEFAULT_ACRONYM_ALLOWLIST).map(a => a.toUpperCase()));
  const severity = opts.profile === 'pro-tool' ? 'info' : 'low';
  const joined = labels.join('\n');
  const out = [];
  const seen = new Set();
  for (const s of labels) {
    for (const t of tokens(s)) {
      if (!isAcronymish(t) || allow.has(t) || UNIT_TOKENS.has(t.toUpperCase()) || seen.has(t)) continue;
      seen.add(t);
      // explained anywhere on the surface? "XXX (expansion)" or "expansion (XXX)"
      const explained = new RegExp(`${t}\\s*\\(|\\(\\s*${t}\\s*\\)`).test(joined) &&
        new RegExp(`${t}\\s*\\([^)]{4,}\\)|[^(]{4,}\\(\\s*${t}\\s*\\)`).test(joined);
      if (!explained) {
        out.push(find('unexplained-acronym', severity, 'wcag_external',
          `"${t}" has no expansion/gloss on this surface (WCAG 3.1.4, AAA — advisory). Add it to the audience allowlist if it is house-standard.`, [t]));
      }
    }
  }
  return out;
}

// 5) Placeholder glyphs — split: ellipsis correctness (apple_published, default-on) vs
// no-value standardization (community_convention/inference, off-by-default).
export function placeholderGlyphs(labels, opts = {}) {
  const out = [];
  const dots = labels.filter(s => s.includes('...'));
  if (dots.length) {
    out.push(find('ellipsis-correctness', 'low', 'apple_published',
      'Use the ellipsis character … (U+2026), not three periods (Writing HIG / typography).', dots));
  }
  if (opts.standardization) {
    const used = NO_VALUE_TOKENS.filter(tok => labels.some(s => s.trim() === tok));
    if (used.length >= 2) {
      out.push(find('glyph-standardization', 'advisory', 'community_convention',
        `Mixed no-value placeholders (${used.join(' vs ')}) for the same semantic — standardize on one (fires only on standalone comparable values).`, used));
    }
  }
  return out;
}

// 6) Destructive verb — apple_published principle (Alerts HIG), worded as PROMPT-TO-VERIFY since
// confirm/undo is invisible in a label. Medium ONLY in the gated WCAG 3.3.4 case.
export function destructiveVerb(labels, opts = {}) {
  const out = [];
  for (const s of labels) {
    if (tokens(s).length <= 4 && DESTRUCTIVE_VERBS.test(s.trim())) {
      out.push(find('destructive-verb', opts.persistedData ? 'medium' : 'advisory',
        'apple_published',
        `"${s}" is destructive — VERIFY it has a confirmation or undo (not asserted as a violation; a label cannot show the handler).${opts.persistedData ? ' Persisted/legal/financial data: WCAG 3.3.4 (AA) applies.' : ''}`, [s]));
    }
  }
  return out;
}

export function runMicrocopyChecks(labels, options = {}) {
  const enable = options.enable ?? {};
  const out = [
    ...casingConsistency(labels, options),
    ...longAllCaps(labels, options),
    ...unexplainedAcronym(labels, options),
    ...placeholderGlyphs(labels, { ...options, standardization: enable.glyphStandardization ?? false }),
    ...destructiveVerb(labels, options),
  ];
  if (enable.redundantCopy) out.push(...redundantCopy(labels, options));
  return out;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- test/microcopy-checks.test.mjs`
Expected: PASS (9 tests). Then `npm test` — full suite green.

- [ ] **Step 5: Commit**

```bash
git add scripts/microcopy-checks.mjs test/microcopy-checks.test.mjs
git commit -m "feat(router): deterministic microcopy checks (casing, DRY, all-caps, acronym, glyphs, destructive-verb) with validated authority tiers"
```

---

### Task 2: the routing table

**Files:**
- Create: `skills/apple-hig/references/review-router.md`
- Test: `test/review-router.test.mjs`

**Interfaces:**
- Produces: a markdown table whose rows are
  `| subsystem | scopes | rubric dims | rules files | method |` — the driver (Task 3) resolves rows
  by the `subsystem` ids; `rules files` are repo-relative paths under `skills/apple-hig/`;
  `method` ∈ `static` / `probe` / `both`. Subsystem ids (exact strings Tasks 3–4 use):
  `typography`, `color`, `layout`, `buttons`, `navigation`, `motion`, `states`, `microcopy`,
  `accessibility`, `icons`, `forms`, `feedback`, `platform-fit`, `data-viz`.
- After the table: one "Method notes" block ≤4 lines per NEW subsystem (microcopy/states/motion).

The file content (write it exactly; ≤90 lines): frontmatter
(`title: Review Router`, `value_type: universal`, `last_verified: 2026-07-02`), a 6-line intro
(what a row is, scope-gating, `--only`, lazy loading, blind-spot duty), then the table with these
rows (paths abbreviated here — write them repo-relative in the file):

| subsystem | scopes | rubric dims | rules files | method |
|---|---|---|---|---|
| typography | component+ | platform rubric "Typography & hierarchy" | `references/design-tokens-<platform>.md` + `guidelines/foundations/typography.md` | static |
| color | component+ | "Color / contrast / dark mode" + contrast thresholds dim | `references/design-tokens-<platform>.md` + `guidelines/foundations/color.md`, `dark-mode.md` | both |
| layout | component+ | "Layout & spacing" | `guidelines/foundations/layout.md` | probe |
| buttons | element+ | "Components & controls" | `references/control-tokens-macos.md` / `-ios.md` + `guidelines/components/buttons.md` | both |
| navigation | screen+ | "Navigation & IA" | platform rubric + `guidelines/patterns/navigation.md` | static |
| motion | component+ | "Motion & animation" | `guidelines/foundations/motion.md` | static |
| states | component+ | "States" dim + Stage-5 pass bars | `references/control-tokens-<platform>.md` (state recipes) | static |
| microcopy | element+ | "Content & writing / voice" | `scripts/microcopy-checks.mjs` definitions | static |
| accessibility | element+ | the accessibility dims (contrast/targets/keyboard/SR) | `guidelines/foundations/accessibility.md` | both |
| icons | component+ | iconography guidance | `guidelines/foundations/sf-symbols.md`, `interface-icons.md` | static |
| forms | component+ | "Forms & validation" | `guidelines/patterns/data-entry.md` | both |
| feedback | component+ | "Feedback & affordances" | `guidelines/patterns/feedback.md` | both |
| platform-fit | screen+ | "Platform-fit" + cardinal sins | platform rubric / profile | static |
| data-viz | component+ | charts guidance | `guidelines/components/charts.md` | probe |

Method notes (exact text to include):

```markdown
## Method notes — the three new subsystems

- **microcopy** (static, deterministic): collect every visible label/value string in scope; run the
  definitions in `scripts/microcopy-checks.mjs` (the command runs the script; agents without Bash
  apply the same definitions manually). Defaults: casing/all-caps/acronym/ellipsis/destructive ON,
  redundant-copy + glyph-standardization OFF; pro-tool audiences drop acronym+all-caps to INFO.
- **states** (static, reads the source's branches): find the state model (enum / `isLoading`-style
  flags / switch); enumerate expected states for the component class (fetch→loading+error+empty;
  list→empty; capability→offline/no-permission); a missing branch IS the missing state — flag the
  absence (Stage-5 pass bars judge the present branches' copy/recovery). On macOS/iOS, judge state
  *styling* against the control-tokens recipe tables.
- **motion** (static): read `@keyframes`/`transition`/`animation` (web) or animation calls (native)
  + duration/easing tokens; flag layout/paint-property animation, missing reduced-motion fallback,
  ad-hoc durations when motion tokens exist. Runtime *feel* stays eyeball-only — a `probe`-less
  motion row is a declared blind spot only when animation code exists and can't be read.
```

- [ ] **Step 1: Write the failing test**

Create `test/review-router.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const root = new URL('../', import.meta.url);
const routerPath = new URL('skills/apple-hig/references/review-router.md', root);

const SUBSYSTEMS = ['typography', 'color', 'layout', 'buttons', 'navigation', 'motion', 'states',
  'microcopy', 'accessibility', 'icons', 'forms', 'feedback', 'platform-fit', 'data-viz'];

test('router table: all subsystems present with valid scope + method', () => {
  const r = readFileSync(routerPath, 'utf8');
  for (const s of SUBSYSTEMS) assert.match(r, new RegExp(`\\|\\s*${s}\\s*\\|`), `row missing: ${s}`);
  const rows = r.split('\n').filter(l => SUBSYSTEMS.some(s => l.match(new RegExp(`^\\|\\s*${s}\\s*\\|`))));
  assert.equal(rows.length, SUBSYSTEMS.length);
  for (const row of rows) {
    assert.match(row, /\|\s*(element|component|screen|flow)\+?\s*\|/, `bad scope: ${row}`);
    assert.match(row, /\|\s*(static|probe|both)\s*\|\s*$/, `bad method: ${row}`);
  }
});

test('router table: every referenced rules file exists (no dangling)', () => {
  const r = readFileSync(routerPath, 'utf8');
  const refs = [...r.matchAll(/`((?:guidelines|references|scripts)\/[^`]+?\.(?:md|mjs))`/g)].map(m => m[1]);
  assert.ok(refs.length >= 12, 'expected rules-file references in the table');
  for (const p of refs) {
    const full = p.startsWith('scripts/')
      ? new URL(p, root)
      : new URL('skills/apple-hig/' + p.replace('<platform>', 'macos'), root);
    assert.ok(existsSync(full), `dangling rules file: ${p}`);
  }
});

test('router: method notes cover the three new subsystems + blind-spot duty in the intro', () => {
  const r = readFileSync(routerPath, 'utf8');
  for (const s of ['microcopy', 'states', 'motion']) assert.match(r, new RegExp(`\\*\\*${s}\\*\\*`));
  assert.match(r, /blind[- ]spot/i);
  assert.match(r, /--only/);
});
```

- [ ] **Step 2: Run test to verify it fails** — `npm test -- test/review-router.test.mjs` → ENOENT.

- [ ] **Step 3: Write `review-router.md`** per the layout above (frontmatter, intro, table, method
notes). Rules-file paths must be real — verify each with Glob while writing; use
`design-tokens-<platform>.md` / `control-tokens-<platform>.md` placeholders only where the test
substitutes `macos`.

- [ ] **Step 4: Run test to verify it passes**, then the full suite.

- [ ] **Step 5: Commit**

```bash
git add skills/apple-hig/references/review-router.md test/review-router.test.mjs
git commit -m "feat(router): the routing table - 14 subsystem rows indexing rubric dims + 1.8.0 token/control references, with method notes for microcopy/states/motion"
```

---

### Task 3: the driver in design-reviewer.md

**Files:**
- Modify: `agents/design-reviewer.md` (insert a routing section between "Step 0 — Classify the
  request scope" (ends line ~42) and "## The review method" (line ~44); update "## Reference (load
  on demand)" (lines 22–30); extend "## Output format" (lines 252–273))
- Test: `test/reviewer-method.test.mjs` (append)

**Interfaces:**
- Consumes: `review-router.md` subsystem ids (Task 2), `runMicrocopyChecks` definitions (Task 1).
- Produces: the reviewer emits per-finding `subsystem: <id>`, a `coverage` line, and a
  `blindSpots[]` block; the `HIG-VERDICT:` line gains ` rows=<ran>/<applicable> blind=<n>`
  (Task 5's validator + Task 4's command depend on these exact names).

- [ ] **Step 1: Write the failing test** — append to `test/reviewer-method.test.mjs` (match its
existing style — it reads the agent file and asserts method text):

```js
test('reviewer routes through the router table with lazy per-row loading', () => {
  assert.match(agent, /review-router\.md/);
  assert.match(agent, /Step 0\.5|Route the review/i);
  assert.match(agent, /--only/);
  assert.match(agent, /lazy|only when that row runs|per-row/i);
  assert.match(agent, /subsystem/);
});

test('reviewer verdict carries coverage + blind spots and never passes over a blind spot', () => {
  assert.match(agent, /blindSpots/);
  assert.match(agent, /coverage/i);
  assert.match(agent, /rows=<?\w*>?\/\w*|rows=/);
  assert.match(agent, /blind spot[^.]*never[^.]*(pass|clean)|never[^.]*pass[^.]*blind/i);
});
```

(If the file's read helper differs, adapt to its existing `agent` constant — do not add a second
file-read.)

- [ ] **Step 2: Run to verify it fails.**

- [ ] **Step 3: Edit `agents/design-reviewer.md`** — three edits:

3a. In "## Reference (load on demand)" append one sentence:
"Load `${CLAUDE_PLUGIN_ROOT}/skills/apple-hig/references/review-router.md` FIRST — it is the index
of review subsystems; load each row's rules files only when that row runs."

3b. Insert after Step 0's table, before "## The review method":

```markdown
## Step 0.5 — Route the review (the router drives coverage)

Load `references/review-router.md`. Resolve the applicable rows:
- An explicit `--only <subsystems>` in the request wins: exactly those rows, nothing else.
- Otherwise scope-gate: element → the element+ rows relevant to the control (typically
  buttons/color/accessibility/microcopy/states); component → + its component+ rows; screen/flow →
  all applicable rows. Rows gated out are "not reviewed (out of scope)" — one line in the report,
  NOT blind spots.
Then audit **row by row**: load that row's rules files (and nothing else), run its method
(`static` = read the source; `probe` = the rendered checks below; `both` = both), and tag every
finding with `subsystem: <row id>`. The three method notes in the router file define the
microcopy/states/motion passes. A row whose method cannot run (probe row with nothing rendered,
custom-paint region, states the source declares but you cannot drive) is a **blind spot** — record
it, never silently skip. Stages 1–7 below remain the how-to-judge method; the router decides
*which* subsystems get a pass and *what rules* are in context while judging them.
```

3c. In "## Output format": add `Subsystem: <subsystem>` to the per-finding block (after
`Category:`); before the HIG-VERDICT line add:

```markdown
Then **Coverage:** `rows ran / rows applicable` + a **Blind spots:** list (one line each: row or
region + why it couldn't be reviewed) + one line naming rows out of scope. **A blind spot covering
a review-relevant area caps the verdict at `advisory-pass`** (or `incomplete`) — never `verified-
pass`, and never an unqualified clean bill; name the gaps next to the verdict.
```

and change the machine-readable line to:

`HIG-VERDICT: <verdict> level=<static|visual|full> scope=<element|component|screen|flow> rows=<ran>/<applicable> blind=<n> (critical=n high=n medium=n low=n advisory=n)`

- [ ] **Step 4: Run the tests, then the full suite** (existing reviewer tests assert Output-format
text — if one asserts the OLD HIG-VERDICT shape, update that assertion to the new shape in the
same commit and say so in the commit body).

- [ ] **Step 5: Commit**

```bash
git add agents/design-reviewer.md test/reviewer-method.test.mjs
git commit -m "feat(router): reviewer drives coverage through the router - Step 0.5 routing, lazy per-row rules, subsystem-tagged findings, coverage + blind-spot verdict"
```

---

### Task 4: `--only` + microcopy script wiring + fan-out in the command

**Files:**
- Modify: `commands/hig-review.md`
- Test: `test/reviewer-method.test.mjs` (append; same file — command assertions live there or in
  `test/platform-binding.test.mjs`; put them wherever hig-review.md is already read, else read it
  in the new test block)

**Interfaces:**
- Consumes: subsystem ids (Task 2), the reviewer's `--only` handling (Task 3),
  `scripts/microcopy-checks.mjs` CLI-ability via `node -e` import (no CLI wrapper needed — the
  command instructs running checks through a one-liner).

- [ ] **Step 1: Failing test** (append):

```js
test('hig-review supports --only targeted audits and the fan-out path', () => {
  const cmd = readFileSync(new URL('../commands/hig-review.md', import.meta.url), 'utf8');
  assert.match(cmd, /--only/);
  assert.match(cmd, /review-router\.md/);
  assert.match(cmd, /fan[- ]?out|one design-reviewer per/i);
  assert.match(cmd, /microcopy-checks\.mjs/);
});
```

- [ ] **Step 2: Run to verify it fails.**

- [ ] **Step 3: Edit `commands/hig-review.md`** — after the "**Target:** $ARGUMENTS" block add:

```markdown
**Targeted audit (`--only`):** if `$ARGUMENTS` contains `--only <subsystems>` (comma-separated ids
from `references/review-router.md`, e.g. `--only buttons,motion`), pass the flag through to the
design-reviewer verbatim — it audits exactly those router rows and loads only their rules. This is
the cheap path: use it when I name specific areas.

**Microcopy assist:** when the review includes the `microcopy` row and you have Bash, extract the
visible label strings and run the deterministic checks yourself, then hand the findings to the
reviewer as input:
`node -e "import('${CLAUDE_PLUGIN_ROOT}/scripts/microcopy-checks.mjs').then(m=>console.log(JSON.stringify(m.runMicrocopyChecks(JSON.parse(process.argv[1])),null,1)))" '<json-array-of-strings>'`

**Fan-out (large reviews):** when the target spans many screens/components (a directory, a whole
app), dispatch **one design-reviewer per router row-group** in parallel via the Task tool — each
subagent gets the same target plus `--only <row>` so its entire context is one subsystem — then
merge: dedupe by file:line, keep each finding's subsystem tag, recompute the coverage line from the
union, and emit ONE combined verdict (the strictest of the parts; any part's blind spots carry
into the combined report).
```

- [ ] **Step 4: Tests + full suite.**

- [ ] **Step 5: Commit**

```bash
git add commands/hig-review.md test/reviewer-method.test.mjs
git commit -m "feat(router): /hig-review --only targeted audits, microcopy script assist, per-row fan-out for large reviews"
```

---

### Task 5: blind-spot invariant in the validator (+ schema)

**Files:**
- Modify: `scripts/validate-review-report.mjs`
- Modify: `data/schema/design-review-report.schema.json` (verify the path with Glob first; add
  optional `coverage` (number 0–1) and `blindSpots` (array of strings) properties)
- Test: `test/severity-selfcheck.test.mjs` (append — it already unit-tests `validateReport`; if it
  doesn't import `validateReport`, put the cases in a new `test/blind-spot-verdict.test.mjs`)

- [ ] **Step 1: Failing test:**

```js
test('invariant C: blind spots forbid verified-pass', () => {
  const base = { schema: 1, scope: 'screen', level: 'full', findings: [] };
  const bad = validateReport({ ...base, verdict: 'verified-pass', blindSpots: ['custom-painted cal graph'] });
  assert.equal(bad.valid, false);
  assert.ok(bad.errors.some(e => /blind/i.test(e)));
  const ok = validateReport({ ...base, verdict: 'advisory-pass', blindSpots: ['custom-painted cal graph'] });
  assert.equal(ok.valid, true);
  const clean = validateReport({ ...base, verdict: 'verified-pass' }); // absent blindSpots = fine
  assert.equal(clean.valid, true);
});
```

- [ ] **Step 2: Run to verify it fails.**

- [ ] **Step 3: Implement** — in `validate-review-report.mjs` after Invariant B:

```js
  // Invariant C (blind-spot honesty): a blind spot covering a review-relevant area forbids a
  // verified clean bill. blindSpots is optional; when present and non-empty, the verdict must
  // degrade to advisory-pass / incomplete / fail.
  if (Array.isArray(report.blindSpots) && report.blindSpots.length > 0 && report.verdict === 'verified-pass')
    e('verified-pass is not allowed with blind spots (degrade to advisory-pass or incomplete and name the gaps)');
  if (report.blindSpots !== undefined && !Array.isArray(report.blindSpots))
    e('blindSpots must be an array of strings when present');
  if (report.coverage !== undefined && !(typeof report.coverage === 'number' && report.coverage >= 0 && report.coverage <= 1))
    e('coverage must be a number in [0,1] when present');
```

Schema json: add both properties (optional). Keep `schema: 1` (backwards-compatible optional
additions; the invariant only fires when the field is present).

- [ ] **Step 4: Tests + full suite.** **Step 5: Commit**

```bash
git add scripts/validate-review-report.mjs data/schema/design-review-report.schema.json test/severity-selfcheck.test.mjs
git commit -m "feat(router): invariant C - blind spots forbid verified-pass; coverage + blindSpots in the report contract"
```

---

### Task 6: state-coverage + motion behavioral fixtures

**Files:**
- Create: `test/fixtures/design/states-missing-branches.html` (a component with a fetch-and-render
  and NO loading/error/empty branch — the absence is the defect; header comment declares
  `expected: unhandled non-default state`)
- Create: `test/fixtures/design/motion-no-reduce.html` (a CSS `@keyframes` loop animating
  `box-shadow` (paint) with no `prefers-reduced-motion` guard; header comment declares the two
  expected findings)
- Test: `test/fixtures-manifest.test.mjs` — follow its existing convention for registering
  fixtures (read it first; add the two fixtures wherever it enumerates the set)

Steps: read the manifest test to learn the registration shape → add fixtures + registration
(failing first if the manifest asserts counts) → full suite → commit
`feat(router): behavioral fixtures for the states + motion rows`.

---

### Task 7: CHANGELOG + 1.9.0 + final suite

**Files:** `CHANGELOG.md` (new entry, matching house style), the four version spots → `1.9.0`.

Entry summary (adapt to what actually shipped): the review router — routing table, `--only`
targeted audits, lazy per-row rule loading, subsystem-tagged findings, microcopy/states/motion
rows (deterministic microcopy checks with validated authority tiers), blind-spot-honest verdicts
(coverage + blindSpots + invariant C), fan-out for large reviews, rows wired to the 1.8.0
token/control references.

Steps: CHANGELOG → bump ×4 → `npm test` (all green incl. version-consistency) →
`git status --short` (nothing unintended) → commit `release: 1.9.0 - the review router`.

---

## Self-review notes (applied)

- Spec coverage: table+driver (T2/T3), `--only`+scope-gate (T3/T4), three subsystems (T1 microcopy
  deterministic + T2 method notes + T6 fixtures), token wiring (T2 rows), blind-spot verdict
  (T3 output + T5 invariant), fan-out (T4), tests per spec section, EARS-example fixtures (T1 tests
  use the exact strings), version/CHANGELOG (T7).
- Deliberate scope holds: no mechanical recipe-diff checker; no whole-app crawling; the
  benchmark run against the new fixtures is post-build validation, not `npm test`.
- Type consistency: subsystem ids defined once (T2) and reused verbatim in T3/T4 tests;
  `runMicrocopyChecks(labels, options)` signature identical in T1 code, T1 tests, and T4's
  one-liner.
