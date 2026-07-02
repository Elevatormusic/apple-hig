import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const root = new URL('../', import.meta.url);
const routerPath = new URL('skills/apple-hig/references/review-router.md', root);

const SUBSYSTEMS = ['typography', 'color', 'layout', 'buttons', 'navigation', 'motion', 'states',
  'microcopy', 'accessibility', 'icons', 'forms', 'feedback', 'platform-fit', 'data-viz'];

test('router table: all subsystems present with valid scope + method', () => {
  const r = readFileSync(routerPath, 'utf8');
  for (const s of SUBSYSTEMS) assert.match(r, new RegExp(`\\|\\s*\\*?\\*?${s}\\*?\\*?\\s*\\|`), `row missing: ${s}`);
  const rows = r.split('\n').filter(l => SUBSYSTEMS.some(s => l.match(new RegExp(`^\\|\\s*\\*?\\*?${s}\\*?\\*?\\s*\\|`))));
  assert.equal(rows.length, SUBSYSTEMS.length);
  for (const row of rows) {
    assert.match(row, /\|\s*(element|component|screen|flow)\+?\s*\|/, `bad scope: ${row}`);
    assert.match(row, /\|\s*(static|probe|both)\s*\|\s*$/, `bad method: ${row}`);
  }
});

test('router table: every referenced rules file exists (no dangling)', () => {
  const r = readFileSync(routerPath, 'utf8');
  const refs = [...r.matchAll(/`((?:guidelines|references|scripts)\/[^`]+?\.(?:md|mjs))`/g)].map(m => m[1]);
  assert.ok(refs.length >= 12, `expected rules-file references in the table, got ${refs.length}`);
  for (const p of refs) {
    const resolved = p.replace('<platform>', 'macos');
    const full = resolved.startsWith('scripts/')
      ? new URL(resolved, root)
      : new URL('skills/apple-hig/' + resolved, root);
    assert.ok(existsSync(full), `dangling rules file: ${p}`);
  }
});

test('router: method notes cover the three new subsystems + blind-spot duty in the intro', () => {
  const r = readFileSync(routerPath, 'utf8');
  for (const s of ['microcopy', 'states', 'motion']) assert.match(r, new RegExp(`\\*\\*${s}\\*\\*`));
  assert.match(r, /blind[- ]spot/i);
  assert.match(r, /--only/);
});
