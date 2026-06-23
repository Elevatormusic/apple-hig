import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL('skills/apple-hig/guidelines/foundations/' + p, root), 'utf8');

test('4.5:1 is never applied to meaningful glyphs (non-text = 3:1) in accessibility.md + color.md', () => {
  for (const f of ['accessibility.md', 'color.md']) {
    // a 4.5:1 statement must not be the one describing meaningful glyphs (those are 3:1, WCAG 1.4.11)
    assert.doesNotMatch(read(f), /4\.5:1[^\n]*meaningful[^\n]*glyph/i,
      `${f}: 4.5:1 is wrongly applied to meaningful glyphs (should be 3:1 per WCAG 1.4.11)`);
  }
});

test('accessibility.md states 3:1 for non-text and exempts decorative/disabled', () => {
  const a = read('accessibility.md');
  assert.match(a, /3:1[^\n]*(glyph|non-text|component)/i, 'accessibility.md missing a 3:1 non-text rule');
  assert.match(a, /(decorative|disabled)[^\n]*exempt|exempt[^\n]*(decorative|disabled)/i,
    'accessibility.md missing the decorative/disabled contrast exemption');
});
