import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { contrastFindings, geometryFindings, coverage, reviewNativeDescriptor } from './native-review.mjs';
const fx = JSON.parse(readFileSync(new URL('../test/fixtures/native/ears-like.json', import.meta.url)));
const repo = fileURLToPath(new URL('../', import.meta.url));

test('the CLI reviews a descriptor file and prints findings + coverage + verdict', () => {
  const out = execFileSync('node', ['scripts/native-review.mjs', 'test/fixtures/native/ears-like.json'], { cwd: repo, encoding: 'utf8' });
  assert.match(out, /verdict:/);
  assert.match(out, /Coverage: 9\/10/);
  assert.match(out, /contrast|clip|duplicate/);
  assert.match(out, /never verified-pass/);
});

test('the CLI rejects a non-descriptor JSON with a clear error', () => {
  let threw = false;
  try { execFileSync('node', ['scripts/native-review.mjs', 'package.json'], { cwd: repo, encoding: 'utf8' }); }
  catch (e) { threw = true; assert.match(String(e.stderr), /not a valid native-render descriptor/); }
  assert.ok(threw, 'exits non-zero on an invalid descriptor');
});

test('contrast is scored only on measurable nodes and flags the near-invisible label', () => {
  const f = contrastFindings(fx.elements);
  assert.ok(f.some((x) => x.element === 'lowContrastNote' && x.category === 'contrast'));
  assert.ok(!f.some((x) => x.element === 'customMeter'), 'never scores a non-introspectable node');
  assert.ok(!f.some((x) => x.element === 'title'), 'high-contrast title is not flagged');
  assert.ok(f.every((x) => x.evidence === 'extracted'));
});

test('coverage reports the introspectable fraction', () => {
  const c = coverage(fx.elements);
  assert.equal(c.total, 10);
  assert.equal(c.measurable, 9);
  assert.ok(Math.abs(c.ratio - 9 / 10) < 1e-9);
});

test('geometry flags the duplicate status row, the sub-target button, and the clipped caption', () => {
  const f = geometryFindings(fx.elements);
  assert.ok(f.some((x) => x.category === 'duplicate' && /status/.test(x.element + (x.message || ''))), 'duplicate identical rows');
  assert.ok(f.some((x) => x.category === 'target-size' && x.element === 'tinyClose'));
  assert.ok(f.some((x) => x.category === 'clip' && x.element === 'inputHelp'));
  assert.ok(f.every((x) => x.evidence === 'extracted'));
});

test('parent/child nesting is NOT flagged as an overlap (flat tree, absolute bounds)', () => {
  const nested = { meta: {}, elements: [
    { id: 'panel', type: 'Component', role: '', label: '', value: '', bounds: { x: 0, y: 0, w: 400, h: 300 }, fgIntrospectable: false, bgIntrospectable: false, fontPt: 0, bold: false, visible: true, showing: true, enabled: true, checkable: false, checked: false, measurable: false, snapshotMayBeBlank: false, textOverflows: false },
    { id: 'btn', type: 'TextButton', role: 'button', label: 'OK', value: '', bounds: { x: 20, y: 20, w: 80, h: 30 }, fg: '#ffffff', bg: '#0066cc', fgIntrospectable: true, bgIntrospectable: true, fontPt: 13, bold: false, visible: true, showing: true, enabled: true, checkable: false, checked: false, measurable: true, snapshotMayBeBlank: false, textOverflows: false },
  ] };
  assert.ok(!geometryFindings(nested.elements).some((x) => x.category === 'overlap'), 'a child inside its parent is not an overlap');
});

test('the root node containing full-width children is NOT flagged as overlap (root-bounds + tolerance)', () => {
  const d = { meta: {}, elements: [
    { id: 'root', type: 'Component', role: '', label: '', value: '', bounds: { x: 0, y: 0, w: 900, h: 780 }, fgIntrospectable: false, bgIntrospectable: false, fontPt: 0, bold: false, visible: true, showing: true, enabled: true, checkable: false, checked: false, measurable: false, snapshotMayBeBlank: false, textOverflows: false },
    { id: 'bar', type: 'Component', role: '', label: '', value: '', bounds: { x: 0, y: 28, w: 901, h: 40 }, fgIntrospectable: false, bgIntrospectable: false, fontPt: 0, bold: false, visible: true, showing: true, enabled: true, checkable: false, checked: false, measurable: false, snapshotMayBeBlank: false, textOverflows: false },
  ] };
  assert.ok(!geometryFindings(d.elements).some((x) => x.category === 'overlap'), 'a full-width child of the root is not an overlap (1px over-edge absorbed by tolerance)');
});

test('the assembled native review tags extracted, reports coverage, and never verified-passes', () => {
  const r = reviewNativeDescriptor(fx);
  assert.ok(r.findings.length >= 3);
  assert.ok(r.findings.every((x) => x.evidence === 'extracted'));
  assert.notEqual(r.verdict, 'verified-pass');
  assert.ok(['advisory-pass', 'fail', 'incomplete'].includes(r.verdict));
  assert.ok(r.coverage.ratio > 0 && r.coverage.ratio < 1);
});

// =========================================================================================================
// STATE-SWEEP END-TO-END (Task S5) — the golden fixture carries three swept controls exercised THROUGH the
// real reviewNativeDescriptor path. This proves the whole native state-checker path end-to-end on realistic
// (EARS-like, fictional) descriptor data, alongside the no-false-positive side.
// =========================================================================================================

test('e2e: the seeded-inert swept control yields the medium unstyled-control-states finding', () => {
  const r = reviewNativeDescriptor(fx);
  const f = r.findings.filter((x) => x.category === 'unstyled-control-states' && x.element === 'bypassButton');
  assert.equal(f.length, 1, 'the pixel-identical 4-state bypass button reads as unstyled');
  assert.equal(f[0].severity, 'medium', 'not a primary action → medium, not high');
  assert.equal(f[0].evidence, 'extracted');
});

test('e2e: the healthy swept control yields NO state findings (no false positive)', () => {
  const r = reviewNativeDescriptor(fx);
  const stateCats = ['unstyled-control-states', 'two-state-inert', 'disabled-louder', 'recipe-state-diff', 'recipe-diff-unavailable'];
  const f = r.findings.filter((x) => x.element === 'applyButton' && stateCats.includes(x.category));
  assert.equal(f.length, 0, 'a properly-styled control (distinct states, disabled dimmer) fires no state finding');
});

test('e2e: the 2-state swept control yields ONLY the info two-state-inert note (never medium)', () => {
  const r = reviewNativeDescriptor(fx);
  const f = r.findings.filter((x) => x.element === 'muteToggle');
  const info = f.filter((x) => x.category === 'two-state-inert');
  assert.equal(info.length, 1, 'a 2-state identical sweep is a sanctioned info note');
  assert.equal(info[0].severity, 'info');
  assert.equal(f.filter((x) => x.category === 'unstyled-control-states').length, 0, 'never the medium finding on 2 states');
});

test('e2e: the review result blindSpots equals the fixture sweep.blindSpots (pass-through)', () => {
  const r = reviewNativeDescriptor(fx);
  assert.deepEqual(r.blindSpots, fx.sweep.blindSpots);
});

test('e2e: the sweep is verdict-neutral and capped below verified-pass (unchanged)', () => {
  // The verdict is driven by the pre-existing high-severity contrast finding (lowContrastNote 1.19:1) → `fail`.
  // The added swept controls contribute only medium/info state findings, so they must NOT change the verdict:
  // reviewing the SAME fixture with the sweep block stripped must yield the identical verdict. And the native
  // path is always capped below verified-pass (it is not a pixel render).
  const noSweep = { ...fx, elements: fx.elements.filter((e) => !e.states), sweep: undefined };
  const r = reviewNativeDescriptor(fx);
  const base = reviewNativeDescriptor(noSweep);
  assert.equal(r.verdict, base.verdict, 'the state sweep does not change the verdict');
  assert.notEqual(r.verdict, 'verified-pass', 'a native review is never verified-pass');
  const swept = new Set(['bypassButton', 'applyButton', 'muteToggle']);
  assert.ok(!r.findings.some((f) => swept.has(f.element) && (f.severity === 'high' || f.severity === 'critical')),
    'no swept control contributes a blocking (high/critical) finding');
});
