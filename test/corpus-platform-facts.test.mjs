import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL('skills/apple-hig/guidelines/' + p, root), 'utf8');

test('tvOS overscan is 80pt sides / 60pt top-bottom, not ~90px', () => {
  const t = read('platforms/tvos.md');
  assert.doesNotMatch(t, /90 ?px/, 'tvos.md still says ~90px overscan (Apple value is 80pt sides)');
  assert.match(t, /80 ?pt/, 'tvos.md missing the 80pt side overscan');
});

test('visionOS target spacing is 16pt margin / 60pt center-to-center, not ~4pt', () => {
  const v = read('platforms/visionos.md');
  assert.doesNotMatch(v, /≥ ?~?\s?4 ?pt/, 'visionos.md still says ~4pt spacing');
  assert.match(v, /16 ?pt/, 'visionos.md missing the 16pt margin');
  assert.match(v, /center-to-center|center to center/i, 'visionos.md missing the 60pt center-to-center spacing');
});

test('tab-bars "2-5" carries the convention caveat (not bare exact-spec)', () => {
  const tb = read('components/tab-bars.md');
  assert.match(tb, /2.5 tabs/i);
  assert.match(tb, /convention|avoid (adding )?too many|\bMore\b tab|not (an )?(official |Apple )?exact/i,
    'tab-bars.md presents "2-5" without the convention/qualitative caveat');
});
