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

test('the /hig-review command routes a native descriptor to the native-review CLI (it has Bash; the agent does not)', () => {
  const C = readFileSync(new URL('../commands/hig-review.md', import.meta.url), 'utf8');
  assert.match(C, /native-render[\s`]*descriptor/i);
  assert.match(C, /scripts\/native-review\.mjs/);
  assert.match(C, /coverage|introspectable/i);
  assert.match(C, /never .{0,16}verified-pass|advisory-pass/i);
});

test('the native-juce-review doc explains instrument + run + the honest limits', () => {
  assert.match(D, /describeComponentTree|writeDesignProbe/);
  assert.match(D, /message thread/i);
  assert.match(D, /custom.?paint/i);
  assert.match(D, /never .{0,16}verified-pass|advisory-pass/i);
});
