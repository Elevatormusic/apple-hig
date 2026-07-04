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

test('compiles where JUCE_WEB_BROWSER=0 and avoids the deprecated single-line width API (1.7.1 fixes)', () => {
  assert.match(H, /#if JUCE_WEB_BROWSER/);          // WebBrowserComponent only exists when =1
  assert.doesNotMatch(H, /getStringWidthFloat/);    // deprecated in JUCE 8 — use TextLayout
  assert.match(H, /getLocalBounds/);                // root emitted as (0,0,w,h) so it contains its children
});

test('the header emits every descriptor field the reviewer consumes', () => {
  for (const f of ELEMENT_FIELDS) assert.ok(H.includes(`"${f}"`), `header does not emit "${f}"`);
});

test('the header emits the state-sweep fields it can actually produce (states + sweep)', () => {
  // ONLY the sweep fields the PROBE emits: per-element "states" and the top-level "sweep" block.
  // `recipe`/`appearance`/`primary` are NOT asserted here — the probe cannot know a control's macOS recipe
  // address, its intended light/dark appearance, or its prominence; those are harness/author-annotated
  // fields (documented explicitly in native-juce-review.md). This is an explicit split, never a silent one.
  for (const f of ['states', 'sweep']) assert.ok(H.includes(`"${f}"`), `header does not emit "${f}"`);
  // The per-state and sweep-block sub-fields the validator requires must be emitted too.
  for (const f of ['normal', 'rgb', 'alpha', 'grid', 'sweptControls', 'blindSpots', 'sideEffects']) {
    assert.ok(H.includes(`"${f}"`), `header does not emit "${f}"`);
  }
});

test('the public entry points exist', () => {
  for (const fn of ['describeComponentTree', 'writeDesignProbe', 'describeAtSize', 'sweepStates']) {
    assert.ok(H.includes(fn), `header missing ${fn}`);
  }
});

test('describeAtSize does NOT sweep (layout probe) but describeComponentTree defaults sweep on', () => {
  // describeAtSize passes sweep=false explicitly; the sweep parameter defaults true.
  assert.match(H, /describeComponentTree \(root, "hig-probe\.png", \/\*sweep\*\/ false\)/);
  assert.match(H, /bool sweep = true/);
});
