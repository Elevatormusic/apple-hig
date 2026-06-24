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
  assert.match(out, /Coverage: 6\/7/);
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
  assert.equal(c.total, 7);
  assert.equal(c.measurable, 6);
  assert.ok(Math.abs(c.ratio - 6 / 7) < 1e-9);
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
