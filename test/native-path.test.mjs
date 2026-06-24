import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const A = readFileSync(new URL('../agents/design-reviewer.md', import.meta.url), 'utf8');
const D = readFileSync(new URL('../skills/apple-hig/references/native-juce-review.md', import.meta.url), 'utf8');

test('reviewer documents the native JUCE descriptor path + the extracted tier + the coverage caveat', () => {
  assert.match(A, /native.{0,24}descriptor|juce-design-probe/i);
  assert.match(A, /evidence:[\s`*]*extracted/i);
  assert.match(A, /coverage|custom-paint|introspectable/i);
  assert.match(A, /never .{0,16}verified-pass|not .{0,16}verified-pass/i);
  assert.match(A, /native-review/);
});

test('the native-juce-review doc explains instrument + run + the honest limits', () => {
  assert.match(D, /describeComponentTree|writeDesignProbe/);
  assert.match(D, /message thread/i);
  assert.match(D, /custom.?paint/i);
  assert.match(D, /never .{0,16}verified-pass|advisory-pass/i);
});
