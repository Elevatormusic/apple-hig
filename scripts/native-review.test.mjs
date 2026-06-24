import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { contrastFindings, geometryFindings, coverage, reviewNativeDescriptor } from './native-review.mjs';
const fx = JSON.parse(readFileSync(new URL('../test/fixtures/native/ears-like.json', import.meta.url)));

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

test('the assembled native review tags extracted, reports coverage, and never verified-passes', () => {
  const r = reviewNativeDescriptor(fx);
  assert.ok(r.findings.length >= 3);
  assert.ok(r.findings.every((x) => x.evidence === 'extracted'));
  assert.notEqual(r.verdict, 'verified-pass');
  assert.ok(['advisory-pass', 'fail', 'incomplete'].includes(r.verdict));
  assert.ok(r.coverage.ratio > 0 && r.coverage.ratio < 1);
});
