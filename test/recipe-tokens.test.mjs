import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseRecipes, compositeAlpha } from '../scripts/recipe-tokens.mjs';

const ref = (p) => readFileSync(new URL('../skills/apple-hig/references/' + p, import.meta.url), 'utf8');
const R = parseRecipes({ controlTokensText: ref('control-tokens-macos.md'), designTokensText: ref('design-tokens-macos.md') });

// The 382/109/273 pins are pure TABLE-cell arithmetic (prose-derived synthetic cells carry source:'prose'
// and are excluded): 109 first-column row keys, 273 value cells — the 24 Appearance-column kind:'enum'
// cells are INSIDE the 273. Machine-verified 2026-07-02; contract corrected 2026-07-03.
test('pinned grammar counts (machine-verified 2026-07-02)', () => {
  const tableCells = R.cells.filter(c => c.source !== 'prose');
  assert.equal(R.tables.length, 29);
  assert.equal(tableCells.length, 382);
  assert.equal(tableCells.filter(c => c.kind === 'key').length, 109);
  assert.equal(tableCells.filter(c => c.kind !== 'key').length, 273); // includes the 24 kind:'enum' cells
  assert.equal(R.arrows.length, 158);
  assert.equal(new Set(R.arrows.map(a => a.target)).size, 29);
  assert.equal(R.arrows.filter(a => R.resolve(a.raw) === null).length, 0, 'every alias resolves');
  assert.equal(R.cells.filter(c => c.kind === 'unparseable').length, 0);
});

test('spot cells: literal, focus-ring strokes, equality marker, absent', () => {
  const idle = R.get('CONTENT AREA', 'Buttons', '01 — Bordered', 'Light', 'Idle');
  assert.equal(idle[0].layers[0].hex.toUpperCase(), '#000000');
  assert.equal(idle[0].layers[0].alpha, 0.08);
  const focus = R.cells.find(c => c.kind === 'border' && c.strokes?.some(s => s.widthPx === 3.5));
  assert.ok(focus, 'the 3.5px focus-ring stroke parses');
  // "= Content Area" appears in prose only (control-tokens line 339) — never in a table cell.
  assert.ok(R.cells.some(c => c.kind === 'equals-content-area' && c.source === 'prose'));
  assert.ok(R.cells.some(c => c.kind === 'absent'));
});

test('get(): appearance-null cells match any requested appearance', () => {
  assert.ok(R.get('CONTENT AREA', 'Fills', null, 'Light', '1 Primary').length >= 1); // CA Fills is Light=Dark by design
  assert.ok(R.get('OVER-GLASS', 'Buttons', '02 — Bordered Tinted', 'Light', 'Idle').some(c => c.kind === 'absent'));
});

test('OG toggle prose fills: pinned layer alphas cannot drift', () => {
  const ogToggleIdle = R.get('OVER-GLASS', 'Knobs — Toggle', null, 'Light', 'Idle').find(c => c.kind === 'fill');
  assert.deepEqual(ogToggleIdle.layers.map(l => l.alpha), [0.65, 0.45, 0.35]);
});

test('OG prose completeness: toggle shadow stackrefs + slider-knob absence', () => {
  const ogShadows = R.cells.filter(c => c.source === 'prose' && c.context === 'OVER-GLASS' && c.group === 'Knobs — Toggle' && c.kind === 'shadow');
  assert.equal(ogShadows.length, 6); // "all populated cells = the 6-layer stack ▼": Idle/Clicked/Disabled × Light/Dark
  assert.ok(ogShadows.every(c => c.stackRef === 6));
  assert.ok(R.cells.some(c => c.source === 'prose' && c.context === 'OVER-GLASS' && c.group === 'Knobs — Sliders' && c.kind === 'absent'));
});

test('compositeAlpha', () => {
  assert.ok(Math.abs(compositeAlpha([{ alpha: 0.5 }, { alpha: 0.5 }]) - 0.75) < 1e-9);
  assert.equal(compositeAlpha([{ alpha: 1 }]), 1);
});
