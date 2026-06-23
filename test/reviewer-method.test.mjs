import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const A = readFileSync(new URL('../agents/design-reviewer.md', import.meta.url), 'utf8');

test('keeps the prompt-injection trust boundary', () => {
  assert.match(A, /untrusted (evidence|input|data)/i);
  assert.match(A, /never follow (any )?instructions/i);
});
test('has the proportionality scope classifier', () => {
  for (const s of ['element', 'component', 'screen', 'flow']) assert.match(A, new RegExp(s));
  assert.match(A, /proportional|scope/i);
});
test('has the seven-stage method, not a flat checklist', () => {
  for (const s of ['Context', 'Screen model', 'Information architecture', 'hierarchy',
    'Interaction', 'Accessibility', 'Platform fit']) assert.match(A, new RegExp(s, 'i'));
  assert.doesNotMatch(A, /Checklist \(must catch at minimum\)/);
});
test('carries the canonical contrast-role table with 3:1 non-text', () => {
  assert.match(A, /1\.4\.11/);
  assert.match(A, /3:1[^\n]*(glyph|non-text|component)/i);
  assert.match(A, /(disabled|decorative|logotype)[^\n]*exempt/i);
});
test('labels "one primary action" as inference, not Apple, except watchOS/Action button', () => {
  assert.match(A, /one primary action/i);
  assert.match(A, /inference|community/i);
  assert.match(A, /watchOS|Action button/);
});
test('encodes severity + confidence + the blocking rule + verification level', () => {
  for (const v of ['verified-pass', 'advisory-pass', 'fail', 'incomplete']) assert.match(A, new RegExp(v));
  assert.match(A, /confidence/i);
  assert.match(A, /axe-core/i);
  assert.match(A, /static[^\n]*never[^\n]*verified|never[^\n]*verified-pass/i);
});
test('emits the evolved machine-readable verdict line', () => {
  assert.match(A, /HIG-VERDICT:.*level=.*scope=.*critical=/);
});
test('retains the existing mechanical checks (nothing lost)', () => {
  assert.match(A, /44/); assert.match(A, /semantic/i); assert.match(A, /Reduce Motion/i);
  assert.match(A, /Dynamic Type/i);
});
