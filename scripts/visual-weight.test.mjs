import { test } from 'node:test';
import assert from 'node:assert/strict';
import { visualWeight, rankByWeight } from './visual-weight.mjs';

test('visualWeight = area × ink × contrast-factor', () => {
  // a larger high-contrast block outweighs a smaller one
  assert.ok(visualWeight({ area: 10000, contrast: 10 }) > visualWeight({ area: 1000, contrast: 10 }));
  // a filled block outweighs text of the same bbox + contrast (text is mostly empty pixels)
  assert.ok(visualWeight({ area: 17000, contrast: 4, filled: true }) > visualWeight({ area: 17000, contrast: 4, filled: false }));
  // bold text outweighs regular text (more ink)
  assert.ok(visualWeight({ area: 1000, contrast: 6, bold: true }) > visualWeight({ area: 1000, contrast: 6, bold: false }));
  // 1:1 contrast = invisible = zero weight
  assert.equal(visualWeight({ area: 9999, contrast: 1 }), 0);
});

test('rankByWeight: dominant element first — catches a hierarchy inversion', () => {
  // perfect-tokens-style: big blue buttons + bold dark metadata dominate; faint small title is least
  const els = [
    { id: 'title', area: 1200, contrast: 3.5 },
    { id: 'metadata', area: 3360, contrast: 17, bold: true },
    { id: 'cta', area: 17000, contrast: 4, filled: true },
  ];
  const ranked = rankByWeight(els);
  assert.equal(ranked[0].id, 'cta', 'the big filled button should dominate the squint view');
  assert.equal(ranked[ranked.length - 1].id, 'title', 'the faint small title should be least prominent');
  // metadata must outweigh the title (the inversion the reviewer should flag)
  const wMeta = ranked.find((e) => e.id === 'metadata').weight;
  const wTitle = ranked.find((e) => e.id === 'title').weight;
  assert.ok(wMeta > wTitle);
});
