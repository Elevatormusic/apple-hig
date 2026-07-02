import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const root = new URL('../', import.meta.url);
const ref = (p) => readFileSync(new URL('skills/apple-hig/references/' + p, root), 'utf8');

test('macOS control recipes: variants, state axes, focus geometry, knob shadows', () => {
  const c = ref('control-tokens-macos.md');
  // five button variants present
  for (const v of ['Bordered', 'Bordered Tinted', 'Bordered Destructive', 'Prominent']) {
    assert.match(c, new RegExp(v), `missing button variant ${v}`);
  }
  // state axes as declared (Apple numbering is sparse: 01/03/04)
  assert.match(c, /Idle/);
  assert.match(c, /Clicked/);
  assert.match(c, /Disabled/);
  assert.match(c, /Inactive/); // window-activation axis
  // input-field focus ring geometry
  assert.match(c, /3\.5 ?px/);
  // toggle knob shadow
  assert.match(c, /36/);
  // over-glass context exists and delta-tables against Content Area
  assert.match(c, /Over-Glass/i);
  assert.match(c, /= Content Area/);
  assert.doesNotMatch(c, /Nested Symbol|Symbol BG/i);
});

test('iOS control recipes: toggle/slider set with corrected row counts', () => {
  const c = ref('control-tokens-ios.md');
  assert.match(c, /19 rows/);
  assert.match(c, /7 rows/);
  assert.match(c, /12 rows/);
  assert.match(c, /Knobs - Toggle/);
  assert.match(c, /Tracks/);
});

test('recipe alias arrows resolve to real tables in the platform reference', () => {
  const cm = ref('control-tokens-macos.md');
  const dm = ref('design-tokens-macos.md');
  // every distinct "-> <Group> /" arrow target must be a section/table in design-tokens-macos.md
  const targets = new Set(
    [...cm.matchAll(/->\s*([A-Za-z][A-Za-z ]+?)\s*\//g)].map((m) => m[1].trim())
  );
  assert.ok(targets.size >= 2, 'expected alias arrows in the macOS recipe file');
  for (const t of targets) {
    assert.match(dm, new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
      `alias target "${t}" not found in design-tokens-macos.md`);
  }
});
