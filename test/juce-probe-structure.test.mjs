import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ELEMENT_FIELDS } from '../scripts/native-descriptor.mjs';
const H = readFileSync(new URL('../skills/apple-hig/references/juce-design-probe.h', import.meta.url), 'utf8');

test('the probe uses the validated JUCE APIs and is debug-guarded + message-thread documented', () => {
  for (const tok of ['#if JUCE_DEBUG', 'getLocalArea', 'getHeightInPoints', 'findColour',
    'createComponentSnapshot', 'getAccessibilityHandler', 'isShowing', 'getCurrentState',
    'DynamicObject', 'PNGImageFormat']) {
    assert.ok(H.includes(tok), `header missing ${tok}`);
  }
  assert.match(H, /JUCE_MAJOR_VERSION|JUCE_MINOR_VERSION/); // a11y version-gated
  assert.match(H, /message thread/i);                       // documented constraint
  assert.match(H, /not introspectable/i);                   // custom-paint honesty
});

test('the header emits every descriptor field the reviewer consumes', () => {
  for (const f of ELEMENT_FIELDS) assert.ok(H.includes(`"${f}"`), `header does not emit "${f}"`);
});

test('the public entry points exist', () => {
  for (const fn of ['describeComponentTree', 'writeDesignProbe', 'describeAtSize']) {
    assert.ok(H.includes(fn), `header missing ${fn}`);
  }
});
