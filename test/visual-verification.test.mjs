import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');

test('visual-verification reference exists with the mode groups + modes', () => {
  const p = 'skills/apple-hig/references/visual-verification.md';
  assert.ok(existsSync(new URL(p, root)), 'reference missing');
  const v = read(p);
  for (const grp of ['Basic', 'Accessibility', 'Hierarchy', 'UX state']) assert.match(v, new RegExp(grp, 'i'));
  for (const mode of ['light', 'dark', 'grayscale', 'blur', 'reduce motion', 'focus', 'empty', 'error', 'loading'])
    assert.match(v, new RegExp(mode, 'i'), `reference missing the "${mode}" mode`);
});

test('the reference defines the level rules + verified-pass needs visual', () => {
  const v = read('skills/apple-hig/references/visual-verification.md');
  for (const lvl of ['static', 'visual', 'full']) assert.match(v, new RegExp(lvl, 'i'));
  assert.match(v, /static[^\n]*never[^\n]*verified|never[^\n]*verified-pass/i);
  assert.match(v, /verified-pass[^\n]*(visual|level)/i);
});

test('the reviewer loads the visual-verification reference (placeholder gone)', () => {
  const a = read('agents/design-reviewer.md');
  assert.match(a, /visual-verification(\.md)?/i);
  assert.doesNotMatch(a, /SP-C expands/);
});
