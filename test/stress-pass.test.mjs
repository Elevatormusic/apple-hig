import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const has = (s, sub) => s.replace(/\s+/g, ' ').includes(sub);
const P = read('skills/apple-hig/references/dom-stress-probe.js');
const LR = read('scripts/layout-robustness.mjs');
const A = read('agents/design-reviewer.md');

test('dom-stress-probe measures the four stress modes from the rendered DOM', () => {
  for (const m of ['large-text', 'text-spacing', 'rtl', 'reflow']) assert.ok(P.includes(`'${m}'`), `missing mode ${m}`);
  assert.match(P, /getBoundingClientRect/);
  assert.match(P, /scrollWidth/);
  assert.match(P, /scrollHeight/);
  assert.match(P, /setAttribute\('dir', 'rtl'\)/);
  assert.match(P, /pageHorizontalScroll/);
  assert.match(P, /notMirrored/);
  // restores the page after mutating modes
  assert.match(P, /restore/);
});

test('the stress probe uses the same constants as the unit-tested layout-robustness module', () => {
  for (const tok of ['3.12', '1.5', '0.12', '0.16']) {
    assert.ok(P.includes(tok), `probe missing ${tok}`);
    assert.ok(LR.includes(tok), `layout-robustness.mjs missing ${tok}`);
  }
});

test('the reviewer wires the stress pass, platform-calibrated', () => {
  assert.match(A, /dom-stress-probe/);
  assert.ok(has(A, '320 CSS px'), 'reflow width');
  assert.match(A, /'large-text'|large-text/);
  assert.match(A, /evidence: computed/);
  // macOS calibration must NOT demand an iOS Dynamic Type ramp
  assert.ok(has(A, 'NOT an iOS Dynamic Type ramp'), 'macOS stress calibration');
});

test('Stage 5 has non-default-state pass bars + the static unhandled-state gap rule', () => {
  assert.ok(has(A, 'Non-default-state pass bars'), 'state pass bars');
  assert.ok(has(A, 'unhandled'), 'unhandled-state gap');
  assert.match(A, /role=alert|aria-live/);
});
