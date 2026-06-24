# JUCE / C++ Design Probe — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A drop-in JUCE C++ probe emits a JSON descriptor (+ snapshot PNG) of a live `Component` tree; the plugin runs its existing measurement math on it to produce real `evidence: extracted` design findings for native JUCE UIs.

**Architecture:** A C++ header walks the component + accessibility tree → a JSON descriptor matching `schemas/native-render.schema.json`. A new `scripts/native-review.mjs` consumes that descriptor and reuses `wcag-contrast.mjs` (contrast), `layout-robustness.mjs` (overlap/target geometry), and `visual-weight.mjs` (hierarchy), scoping measured findings to introspectable nodes and emitting a coverage ratio. The reviewer gains a native-descriptor input mode and a new `evidence: extracted` tier (deterministic, but never `verified-pass`).

**Tech Stack:** Node.js (built-in `node:test`, ESM `.mjs`, zero deps) for the review side; C++17 + JUCE 6.1+ (`juce_core`/`juce_gui_basics`/`juce_graphics`) for the probe header.

## Global Constraints

- **JUCE 6.1+** for the accessibility block (version-macro gated); JSON/geometry/snapshot core works on 6.0/6/7/8.
- **Message-thread only** — read methods carry no MM assertion; off-thread = silent UB.
- **Header-only**, `#if JUCE_DEBUG`-guarded, every function `inline`; no Projucer/CMake change.
- **`evidence: extracted`** for all native findings (deterministic, not a true pixel render) → native review can reach `advisory-pass`, **never `verified-pass`**.
- **Custom-paint is the dominant limit** — scope measured contrast to introspectable (`measurable:true`) nodes; emit a coverage ratio; **never claim full WCAG**. Never fabricate a `findColour`-based number for a custom-painted node.
- **Geometry in root logical coords**; **font size = `getHeightInPoints()`**; **contrast floors 4.5 / 3.0** (reuse `wcag-contrast.mjs`); **target floor 24 CSS px** (pointer/desktop, WCAG 2.5.8 — not Apple 44pt).
- **RTL is CUT** (JUCE bidi limit). Stress = **reflow only** for v1.
- **Zero new npm deps.** Validation is hand-rolled (no ajv).
- The C++ probe is **written + reviewed here, compile/run-validated by the user** on a real JUCE app (EARS Bridge) — documented honestly, never claimed green.

## File Structure

- `scripts/validate-review-report.mjs` *(modify)* — add `extracted` to the evidence vocabulary.
- `schemas/native-render.schema.json` *(create)* — the descriptor contract (documentation artifact).
- `scripts/native-descriptor.mjs` *(create)* — `validateDescriptor(obj)` (dependency-free required-field check) + the field list.
- `scripts/native-review.mjs` *(create)* — `reviewNativeDescriptor()` + `contrastFindings`/`geometryFindings`/`hierarchyFindings`/`coverage`, reusing the three existing math modules.
- `test/fixtures/native/ears-like.json` *(create)* — a golden descriptor with seeded issues (clipped caption, duplicate row, sub-target button, custom-paint node).
- `scripts/native-review.test.mjs`, `scripts/native-descriptor.test.mjs`, `test/evidence-tier.test.mjs` *(create)* — tests.
- `skills/apple-hig/references/juce-design-probe.h` *(create)* — the C++ probe (user-gated compile).
- `test/juce-probe-structure.test.mjs` *(create)* — structural guard on the header (API calls present, schema fields match, `#if JUCE_DEBUG`).
- `agents/design-reviewer.md` *(modify)* — native-descriptor input mode + `evidence: extracted` usage.
- `skills/apple-hig/references/native-juce-review.md` *(create)* — instrument + run docs.

---

### Task 1: The `evidence: extracted` tier

**Files:**
- Modify: `scripts/validate-review-report.mjs`
- Test: `test/evidence-tier.test.mjs`

**Interfaces:**
- Produces: an exported `EVIDENCE` array including `'extracted'`, ordered `['inferred','extracted','computed', …]`; a `canVerifiedPass(evidence)` predicate that is `false` for `'inferred'`/`'extracted'`.

- [ ] **Step 1: Write the failing test** — `test/evidence-tier.test.mjs`

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EVIDENCE, canVerifiedPass } from '../scripts/validate-review-report.mjs';

test('extracted sits between inferred and computed and cannot reach verified-pass', () => {
  assert.ok(EVIDENCE.includes('extracted'));
  assert.ok(EVIDENCE.indexOf('inferred') < EVIDENCE.indexOf('extracted'));
  assert.ok(EVIDENCE.indexOf('extracted') < EVIDENCE.indexOf('computed'));
  assert.equal(canVerifiedPass('extracted'), false);
  assert.equal(canVerifiedPass('inferred'), false);
  assert.equal(canVerifiedPass('computed'), true);
});
```

- [ ] **Step 2: Run it, expect FAIL** — `node --test test/evidence-tier.test.mjs` → fails (EVIDENCE/canVerifiedPass not exported).
- [ ] **Step 3: Implement** — in `scripts/validate-review-report.mjs` add (and reconcile with any existing evidence list):

```js
export const EVIDENCE = ['inferred', 'extracted', 'computed', 'screenshot', 'wcag', 'platform_api', 'apple_published'];
export const canVerifiedPass = (evidence) => evidence === 'computed' || evidence === 'screenshot';
```
(If an evidence enum already exists, insert `'extracted'` directly after `'inferred'` instead of redefining, and export `canVerifiedPass`.)

- [ ] **Step 4: Run it, expect PASS.** Then `node --test` (whole suite) stays green.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat(native): evidence:extracted tier (deterministic, never verified-pass) [juce-probe]"`

---

### Task 2: Descriptor schema + validator + golden fixture

**Files:**
- Create: `schemas/native-render.schema.json`, `scripts/native-descriptor.mjs`, `test/fixtures/native/ears-like.json`
- Test: `scripts/native-descriptor.test.mjs`

**Interfaces:**
- Produces: `validateDescriptor(obj) → string[]` (empty = valid). Element fields: `id, type, role, label, value, bounds:{x,y,w,h}, fg, bg, fgIntrospectable, bgIntrospectable, fontPt, bold, visible, showing, enabled, checkable, checked, measurable, snapshotMayBeBlank, textOverflows`. `meta` fields: `juceVersion, scaleFactor, rootBounds, snapshotPath, shown, axCoverageRatio`.

- [ ] **Step 1: Write the failing test** — `scripts/native-descriptor.test.mjs`

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateDescriptor } from './native-descriptor.mjs';
const fx = JSON.parse(readFileSync(new URL('../test/fixtures/native/ears-like.json', import.meta.url)));

test('the golden fixture validates', () => assert.deepEqual(validateDescriptor(fx), []));
test('missing meta or elements is reported', () => {
  assert.ok(validateDescriptor({}).length >= 1);
  assert.ok(validateDescriptor({ meta: {}, elements: [{}] }).some((e) => /bounds|type/.test(e)));
});
test('every element carries the measurable flag and root-logical bounds', () => {
  for (const el of fx.elements) { assert.equal(typeof el.measurable, 'boolean'); assert.equal(typeof el.bounds.w, 'number'); }
});
```

- [ ] **Step 2: Run it, expect FAIL** (module + fixture missing).
- [ ] **Step 3a: Create the golden fixture** — `test/fixtures/native/ears-like.json` (seeded EARS-Bridge-like issues):

```json
{
  "meta": { "juceVersion": "8.0.0", "scaleFactor": 1, "rootBounds": { "x": 0, "y": 0, "w": 1180, "h": 820 }, "snapshotPath": "snapshot.png", "shown": true, "axCoverageRatio": 0.8 },
  "elements": [
    { "id": "title", "type": "Label", "role": "label", "label": "EARS Bridge", "value": "", "bounds": { "x": 60, "y": 80, "w": 160, "h": 28 }, "fg": "#ffffff", "bg": "#1c1c1e", "fgIntrospectable": true, "bgIntrospectable": true, "fontPt": 20, "bold": true, "visible": true, "showing": true, "enabled": true, "checkable": false, "checked": false, "measurable": true, "snapshotMayBeBlank": false, "textOverflows": false },
    { "id": "status1", "type": "Label", "role": "label", "label": "SNR — IR — THD —", "value": "", "bounds": { "x": 300, "y": 80, "w": 520, "h": 22 }, "fg": "#9a9a9e", "bg": "#1c1c1e", "fgIntrospectable": true, "bgIntrospectable": true, "fontPt": 13, "bold": false, "visible": true, "showing": true, "enabled": true, "checkable": false, "checked": false, "measurable": true, "snapshotMayBeBlank": false, "textOverflows": false },
    { "id": "status2", "type": "Label", "role": "label", "label": "SNR — IR — THD —", "value": "", "bounds": { "x": 300, "y": 121, "w": 520, "h": 22 }, "fg": "#9a9a9e", "bg": "#1c1c1e", "fgIntrospectable": true, "bgIntrospectable": true, "fontPt": 13, "bold": false, "visible": true, "showing": true, "enabled": true, "checkable": false, "checked": false, "measurable": true, "snapshotMayBeBlank": false, "textOverflows": false },
    { "id": "inputHelp", "type": "Label", "role": "label", "label": "Leave the EARS gain switch alone (changing it drops the jig from Windows).", "value": "", "bounds": { "x": 48, "y": 238, "w": 300, "h": 30 }, "fg": "#9a9a9e", "bg": "#1c1c1e", "fgIntrospectable": true, "bgIntrospectable": true, "fontPt": 13, "bold": false, "visible": true, "showing": true, "enabled": true, "checkable": false, "checked": false, "measurable": true, "snapshotMayBeBlank": false, "textOverflows": true },
    { "id": "tinyClose", "type": "TextButton", "role": "button", "label": "x", "value": "", "bounds": { "x": 1150, "y": 14, "w": 18, "h": 18 }, "fg": "#ffffff", "bg": "#3a3a3c", "fgIntrospectable": true, "bgIntrospectable": true, "fontPt": 13, "bold": false, "visible": true, "showing": true, "enabled": true, "checkable": false, "checked": false, "measurable": true, "snapshotMayBeBlank": false, "textOverflows": false },
    { "id": "lowContrastNote", "type": "Label", "role": "label", "label": "v0.3.1", "value": "", "bounds": { "x": 1110, "y": 800, "w": 60, "h": 16 }, "fg": "#2a2a2c", "bg": "#1c1c1e", "fgIntrospectable": true, "bgIntrospectable": true, "fontPt": 11, "bold": false, "visible": true, "showing": true, "enabled": true, "checkable": false, "checked": false, "measurable": true, "snapshotMayBeBlank": false, "textOverflows": false },
    { "id": "customMeter", "type": "custom/unknown", "role": "", "label": "", "value": "", "bounds": { "x": 420, "y": 780, "w": 460, "h": 20 }, "fg": "not introspectable", "bg": "not introspectable", "fgIntrospectable": false, "bgIntrospectable": false, "fontPt": 0, "bold": false, "visible": true, "showing": true, "enabled": true, "checkable": false, "checked": false, "measurable": false, "snapshotMayBeBlank": false, "textOverflows": false }
  ]
}
```

- [ ] **Step 3b: Implement `scripts/native-descriptor.mjs`**

```js
export const ELEMENT_FIELDS = ['id','type','role','label','value','bounds','fg','bg','fgIntrospectable','bgIntrospectable','fontPt','bold','visible','showing','enabled','checkable','checked','measurable','snapshotMayBeBlank','textOverflows'];

export function validateDescriptor(obj) {
  const errs = [];
  if (!obj || typeof obj !== 'object') return ['descriptor is not an object'];
  if (!obj.meta || typeof obj.meta !== 'object') errs.push('missing meta');
  if (!Array.isArray(obj.elements)) { errs.push('missing elements[]'); return errs; }
  obj.elements.forEach((el, i) => {
    if (!el.type) errs.push(`element ${i}: missing type`);
    const b = el.bounds;
    if (!b || ['x','y','w','h'].some((k) => typeof b[k] !== 'number')) errs.push(`element ${i}: bad bounds`);
    if (typeof el.measurable !== 'boolean') errs.push(`element ${i}: missing measurable flag`);
  });
  return errs;
}
```

- [ ] **Step 3c: Create `schemas/native-render.schema.json`** — a JSON Schema (draft 2020-12) documenting `meta` + the `ELEMENT_FIELDS` element shape (contract/reference; validation is `validateDescriptor`).
- [ ] **Step 4: Run it, expect PASS.** Whole suite green.
- [ ] **Step 5: Commit** — `feat(native): descriptor schema + validateDescriptor + golden EARS-like fixture [juce-probe]`

---

### Task 3: native-review — contrast + coverage

**Files:**
- Create: `scripts/native-review.mjs`
- Test: `scripts/native-review.test.mjs`

**Interfaces:**
- Consumes: `contrastRatio`, `meetsAA` from `./wcag-contrast.mjs`.
- Produces: `contrastFindings(elements) → finding[]`; `coverage(elements) → {measurable,total,ratio}`. Finding = `{category, severity, message, element, evidence:'extracted', ratio?}`.

- [ ] **Step 1: Write the failing test** — `scripts/native-review.test.mjs`

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { contrastFindings, coverage } from './native-review.mjs';
const fx = JSON.parse(readFileSync(new URL('../test/fixtures/native/ears-like.json', import.meta.url)));

test('contrast is scored only on measurable nodes and flags the low-contrast label', () => {
  const f = contrastFindings(fx.elements);
  assert.ok(f.some((x) => x.element === 'lowContrastNote' && x.category === 'contrast'));
  assert.ok(!f.some((x) => x.element === 'customMeter'), 'never scores a non-introspectable node');
  assert.ok(f.every((x) => x.evidence === 'extracted'));
});
test('coverage reports the introspectable fraction', () => {
  const c = coverage(fx.elements);
  assert.equal(c.total, 7); assert.equal(c.measurable, 6);
  assert.ok(Math.abs(c.ratio - 6 / 7) < 1e-9);
});
```

- [ ] **Step 2: Run it, expect FAIL.**
- [ ] **Step 3: Implement `scripts/native-review.mjs`** (contrast + coverage portion)

```js
import { contrastRatio } from './wcag-contrast.mjs';

const isLarge = (el) => el.fontPt >= 18 || (el.bold && el.fontPt >= 14);

export function coverage(elements) {
  const total = elements.length;
  const measurable = elements.filter((e) => e.measurable).length;
  return { total, measurable, ratio: total ? measurable / total : 0 };
}

export function contrastFindings(elements) {
  const out = [];
  for (const el of elements) {
    if (!el.measurable || !el.fgIntrospectable || !el.bgIntrospectable) continue;
    if (!el.label && !el.value) continue;
    const ratio = contrastRatio(el.fg, el.bg);
    const floor = isLarge(el) ? 3 : 4.5;
    if (ratio < floor) out.push({ category: 'contrast', severity: ratio < floor - 1 ? 'high' : 'medium', element: el.id, ratio: +ratio.toFixed(2), evidence: 'extracted', message: `text contrast ${ratio.toFixed(2)}:1 is below ${floor}:1 (registered colours — approximation)` });
  }
  return out;
}
```

- [ ] **Step 4: Run it, expect PASS.**
- [ ] **Step 5: Commit** — `feat(native): contrast + coverage findings (scoped to introspectable nodes) [juce-probe]`

---

### Task 4: native-review — geometry (duplicate/overlap, target size, clip)

**Files:** Modify `scripts/native-review.mjs`; extend `scripts/native-review.test.mjs`.

**Interfaces:**
- Consumes: `boxesOverlap`, `overlapDepth` from `./layout-robustness.mjs`.
- Produces: `geometryFindings(elements) → finding[]` covering overlap/duplicate, sub-target-size, and clip (`textOverflows`).

- [ ] **Step 1: Write the failing test** (append)

```js
import { geometryFindings } from './native-review.mjs';
test('geometry flags the duplicate status row, the sub-target button, and the clipped caption', () => {
  const f = geometryFindings(fx.elements);
  assert.ok(f.some((x) => x.category === 'duplicate' && /status/.test(x.element + (x.message||''))), 'duplicate same-text rows');
  assert.ok(f.some((x) => x.category === 'target-size' && x.element === 'tinyClose'));
  assert.ok(f.some((x) => x.category === 'clip' && x.element === 'inputHelp'));
  assert.ok(f.every((x) => x.evidence === 'extracted'));
});
```

- [ ] **Step 2: Run it, expect FAIL.**
- [ ] **Step 3: Implement** (append to `native-review.mjs`)

```js
import { boxesOverlap, overlapDepth } from './layout-robustness.mjs';

const rect = (b) => ({ left: b.x, top: b.y, right: b.x + b.w, bottom: b.y + b.h });
const interactive = (el) => /button|toggle|slider|combo/i.test(el.type) || /button|link|slider|checkbox/i.test(el.role);

export function geometryFindings(elements) {
  const out = [];
  const vis = elements.filter((e) => e.visible && e.showing);
  // duplicate / overlap (same label+type overlapping = a painted-twice row)
  for (let i = 0; i < vis.length; i++) for (let j = i + 1; j < vis.length; j++) {
    const a = vis[i], b = vis[j];
    if (!boxesOverlap(rect(a.bounds), rect(b.bounds))) continue;
    if (overlapDepth(rect(a.bounds), rect(b.bounds)) <= 2) continue;
    if (a.type === b.type && a.label && a.label === b.label) out.push({ category: 'duplicate', severity: 'high', element: b.id, evidence: 'extracted', message: `"${a.label}" appears twice overlapping (${a.id} & ${b.id}) — likely painted/added twice` });
    else out.push({ category: 'overlap', severity: 'medium', element: b.id, evidence: 'extracted', message: `overlaps ${a.id} by ${overlapDepth(rect(a.bounds), rect(b.bounds))}px` });
  }
  // sub-target size (pointer floor 24px, NOT Apple 44pt)
  for (const el of vis) if (interactive(el) && (el.bounds.w < 24 || el.bounds.h < 24)) out.push({ category: 'target-size', severity: 'medium', element: el.id, evidence: 'extracted', message: `${el.bounds.w}×${el.bounds.h}px target is below the 24px pointer floor (WCAG 2.5.8)` });
  // clip (probe-computed textOverflows)
  for (const el of vis) if (el.textOverflows) out.push({ category: 'clip', severity: 'medium', element: el.id, evidence: 'extracted', message: `text overflows its bounds and is clipped/truncated` });
  return out;
}
```

- [ ] **Step 4: Run it, expect PASS.**
- [ ] **Step 5: Commit** — `feat(native): geometry findings — duplicate/overlap, sub-target, clip [juce-probe]`

---

### Task 5: native-review — hierarchy + the assembled report

**Files:** Modify `scripts/native-review.mjs`; extend the test.

**Interfaces:**
- Consumes: `visualWeight` from `./visual-weight.mjs`.
- Produces: `reviewNativeDescriptor(descriptor) → {findings, coverage, verdict}`. `verdict ∈ {'advisory-pass','fail','incomplete'}` — **never `verified-pass`**.

- [ ] **Step 1: Write the failing test** (append)

```js
import { reviewNativeDescriptor } from './native-review.mjs';
test('the assembled native review tags extracted, reports coverage, and never verified-passes', () => {
  const r = reviewNativeDescriptor(fx);
  assert.ok(r.findings.length >= 3);
  assert.ok(r.findings.every((x) => x.evidence === 'extracted'));
  assert.equal(r.verdict === 'verified-pass', false);
  assert.ok(r.coverage.ratio > 0 && r.coverage.ratio < 1);
});
```

- [ ] **Step 2: Run it, expect FAIL.**
- [ ] **Step 3: Implement** (append)

```js
import { visualWeight } from './visual-weight.mjs';

export function hierarchyFindings(elements) {
  const ranked = elements.filter((e) => e.visible && (e.label || e.value)).map((e) => ({
    el: e, weight: visualWeight({ area: e.bounds.w * e.bounds.h, contrast: (e.fgIntrospectable && e.bgIntrospectable) ? contrastRatio(e.fg, e.bg) : 4, filled: false, bold: e.bold }),
  })).sort((a, b) => b.weight - a.weight);
  // (ranking is advisory context; the duplicate/overlap checks carry the EARS-style findings)
  return ranked.length ? [{ category: 'hierarchy', severity: 'low', element: ranked[0].el.id, evidence: 'extracted', message: `dominant element by visual weight: ${ranked[0].el.id}` }] : [];
}

export function reviewNativeDescriptor(descriptor) {
  const els = descriptor.elements || [];
  const findings = [...contrastFindings(els), ...geometryFindings(els), ...hierarchyFindings(els)];
  const cov = coverage(els);
  const blocking = findings.some((f) => (f.severity === 'high' || f.severity === 'critical'));
  const verdict = blocking ? 'fail' : 'advisory-pass';
  return { findings, coverage: cov, verdict };
}
```

- [ ] **Step 4: Run it, expect PASS.** Whole suite green.
- [ ] **Step 5: Commit** — `feat(native): assembled reviewNativeDescriptor (advisory-pass, never verified-pass) [juce-probe]`

---

### Task 6: The C++ probe header (written + structural test; compile user-gated)

**Files:**
- Create: `skills/apple-hig/references/juce-design-probe.h`
- Test: `test/juce-probe-structure.test.mjs`

**Interfaces:**
- Produces (C++): `inline juce::String describeComponentTree(juce::Component&)`; `inline void writeDesignProbe(juce::Component&, const juce::File&, const juce::File&)`. The emitted JSON matches `schemas/native-render.schema.json`.

- [ ] **Step 1: Write the failing structural test** — `test/juce-probe-structure.test.mjs`

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ELEMENT_FIELDS } from '../scripts/native-descriptor.mjs';
const H = readFileSync(new URL('../skills/apple-hig/references/juce-design-probe.h', import.meta.url), 'utf8');

test('the probe uses the validated JUCE APIs and is debug-guarded', () => {
  for (const tok of ['#if JUCE_DEBUG', 'getLocalArea', 'getHeightInPoints', 'findColour', 'createComponentSnapshot', 'getAccessibilityHandler', 'isShowing', 'getCurrentState', 'DynamicObject', 'PNGImageFormat']) assert.ok(H.includes(tok), `header missing ${tok}`);
  assert.match(H, /JUCE_MAJOR_VERSION|JUCE_MINOR_VERSION/); // version-gated a11y
  assert.match(H, /message thread/i); // documented constraint
});
test('the header emits every descriptor field the reviewer consumes', () => {
  for (const f of ELEMENT_FIELDS) assert.ok(H.includes(`"${f}"`), `header does not emit "${f}"`);
});
```

- [ ] **Step 2: Run it, expect FAIL** (header missing).
- [ ] **Step 3: Write `juce-design-probe.h`** — the full header per the spec's "Unit 1" (tree walk; `getLocalArea` geometry; `isVisible`/`isShowing`/`isEnabled`; `dynamic_cast` type table over Label/TextButton/ToggleButton/TextEditor/Slider/ComboBox; text via a11y value-interface + specialized; `getHeightInPoints()` font; `findColour` with the verified ColourIds + the registered-colour/transparent caveats → `"not introspectable"` for custom nodes; `getCurrentState()` toggle; version-macro-gated `getAccessibilityHandler()` enrichment with null-handling + coverage ratio; one top-level 3-param `createComponentSnapshot(area,true,1.0f)` → `PNGImageFormat::writeImageToStream`; GPU/Web/Video → `snapshotMayBeBlank`; `textOverflows` via `TextLayout` height-at-width vs bounds; reflow via `setSize`→`resized()`→re-walk; JSON via nested `DynamicObject`/`Array<var>`/`setProperty`). Top-of-file comment: message-thread-only, JUCE 6.1+, `#if JUCE_DEBUG`, and the custom-paint limit.
- [ ] **Step 4: Run it, expect PASS** (structural). Note in the commit body: **compile/run validation owed on the user's JUCE app (EARS Bridge) — not run here.**
- [ ] **Step 5: Commit** — `feat(native): JUCE design-probe header (Component+a11y tree -> descriptor JSON + snapshot); compile-gated to a JUCE toolchain [juce-probe]`

---

### Task 7: Reviewer native-descriptor mode + docs

**Files:**
- Modify: `agents/design-reviewer.md`
- Create: `skills/apple-hig/references/native-juce-review.md`
- Test: extend `test/rendered-verification.test.mjs` (or a new `test/native-path.test.mjs`).

**Interfaces:** Consumes `reviewNativeDescriptor`. No new code interface — wiring + docs.

- [ ] **Step 1: Write the failing test** — `test/native-path.test.mjs`

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const A = readFileSync(new URL('../agents/design-reviewer.md', import.meta.url), 'utf8');
const D = readFileSync(new URL('../skills/apple-hig/references/native-juce-review.md', import.meta.url), 'utf8');
test('reviewer documents the native JUCE descriptor path + the extracted tier + the coverage caveat', () => {
  assert.match(A, /native.{0,20}descriptor|juce-design-probe/i);
  assert.match(A, /evidence:\s*extracted/);
  assert.match(A, /coverage|custom-paint|introspectable/i);
  assert.match(A, /never .{0,12}verified-pass|not .{0,12}verified-pass/i);
});
test('the native-juce-review doc explains instrument + run + the honest limits', () => {
  assert.match(D, /describeComponentTree|writeDesignProbe/);
  assert.match(D, /message thread/i);
  assert.match(D, /custom.?paint/i);
});
```

- [ ] **Step 2: Run it, expect FAIL.**
- [ ] **Step 3a: Add a "Native (JUCE descriptor) path" block to `agents/design-reviewer.md`** (in Visual verification): when given a `native-render` descriptor JSON (+ PNG), run `reviewNativeDescriptor`; findings are `evidence: extracted`; scope contrast to `measurable` nodes; report the coverage ratio; a JUCE native review reaches at most `advisory-pass`, **never `verified-pass`**; use the PNG to confirm the duplicate-row / clipped-caption class by eye.
- [ ] **Step 3b: Write `skills/apple-hig/references/native-juce-review.md`** — drop the probe header into a `#if JUCE_DEBUG` build, call `writeDesignProbe(*getTopLevelComponent(), json, png)` from `PluginEditor` once the editor is shown, run `/hig-review descriptor.json`; honest limits (message-thread-only, JUCE 6.1+, custom-paint coverage, RTL cut, registered-colour approximation).
- [ ] **Step 4: Run it, expect PASS.** Whole suite green.
- [ ] **Step 5: Commit** — `feat(native): reviewer native-JUCE descriptor path + instrumentation docs [juce-probe]`

---

## After all tasks
- Fresh-Opus review of (a) the JS native-review math + (b) the C++ header (correctness against JUCE APIs) — per the inline-build-then-subagent-verify workflow.
- Then finishing-a-development-branch.
