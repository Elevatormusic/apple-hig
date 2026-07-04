import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseRecipes, compositeAlpha } from '../scripts/recipe-tokens.mjs';

const ref = (p) => readFileSync(new URL('../skills/apple-hig/references/' + p, import.meta.url), 'utf8');
const R = parseRecipes({ controlTokensText: ref('control-tokens-macos.md'), designTokensText: ref('design-tokens-macos.md') });

test('pinned grammar counts (machine-verified 2026-07-02)', () => {
  assert.equal(R.tables.length, 29);
  assert.equal(R.cells.filter(c => c.kind !== 'key').length, 273);
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
  assert.ok(R.cells.some(c => c.kind === 'equals-content-area'));
  assert.ok(R.cells.some(c => c.kind === 'absent'));
});

test('compositeAlpha', () => {
  assert.ok(Math.abs(compositeAlpha([{ alpha: 0.5 }, { alpha: 0.5 }]) - 0.75) < 1e-9);
  assert.equal(compositeAlpha([{ alpha: 1 }]), 1);
});
