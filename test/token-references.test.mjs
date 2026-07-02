import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const root = new URL('../', import.meta.url);
const ref = (p) => readFileSync(new URL('skills/apple-hig/references/' + p, root), 'utf8');

// ---- macOS ----
test('macOS token reference: keystone values from the macOS 27 export', () => {
  const m = ref('design-tokens-macos.md');
  // frontmatter + banner
  assert.match(m, /value_type: exact-spec/);
  assert.match(m, /last_verified: 2026-07-01/);
  assert.match(m, /developer\.apple\.com\/design\/resources/);
  // ramp: Body 13 regular, Emphasized w600; Headline w700 default / w900 emphasized
  assert.match(m, /Body[^\n]*13/);
  assert.match(m, /Headline[^\n]*13[^\n]*(700|Bold)[^\n]*(900|Heavy)/i);
  // window backgrounds (the fixed values)
  assert.match(m, /#FFFFFF/i);
  assert.match(m, /#1E1E1E/i);
  // label ladder incl. quinary/seximal
  assert.match(m, /quinary/i);
  assert.match(m, /seximal/i);
  assert.match(m, /0\.85/);
  assert.match(m, /0\.03/);
  // system palette: 27-gen blue
  assert.match(m, /#0088FF/i);
  assert.match(m, /#0091FF/i);
  // materials incl. UltraThick value
  assert.match(m, /Ultra ?Thick/i);
  assert.match(m, /0\.88/);
  // sidebar active/inactive
  assert.match(m, /#0C0C0C/i);
  assert.match(m, /#F4F4F4/i);
  // window/panel shadow+border geometry (addendum merged)
  assert.match(m, /shadow/i);
  assert.match(m, /[Bb]order/);
  // no Figma plumbing content (naming the exclusion in prose is fine)
  assert.doesNotMatch(m, /Nested Symbol|Symbol BG/i);
});

// ---- iOS ----
test('iOS token reference: keystone values from the iOS 27 export', () => {
  const m = ref('design-tokens-ios.md');
  assert.match(m, /value_type: exact-spec/);
  // 27 palette
  assert.match(m, /#0088FF/i);
  assert.match(m, /#FF383C/i);
  // quinary label tier
  assert.match(m, /[Qq]uinary/);
  assert.match(m, /0\.09/);
  // elevated background ramp
  assert.match(m, /[Ee]levated/);
  assert.match(m, /#3A3A3C/i);
  // Labels - Liquid Glass
  assert.match(m, /#1A1A1A/i);
  assert.match(m, /#EDEDED/i);
  // real Bold-variant weights: Body bold is 600, not 700
  assert.match(m, /Body[^\n]*(600|Semibold)/i);
  // Widget Glass gradient (addendum merged) + a materials/LG shadow value
  assert.match(m, /gradient/i);
  assert.match(m, /blur/i);
  assert.doesNotMatch(m, /Nested Symbol|Symbol BG/i);
});

// ---- watchOS ----
test('watchOS token reference: ramp incl. complete per-size table + vibrant families', () => {
  const m = ref('design-tokens-watchos.md');
  assert.match(m, /value_type: exact-spec/);
  // default ramp: Body 16, Footnote 2 exists
  assert.match(m, /Body[^\n]*16/);
  assert.match(m, /Footnote 2/);
  // complete per-size series: Title 1 xxLarge 39 and Footnote 2 xSmall 10 must be present
  assert.match(m, /39 \(1\.064\)/);
  assert.match(m, /10 \(1\.250\)/);
  // watch palette
  assert.match(m, /#0091FF/i);
  // vibrant families + exact gradient stops
  assert.match(m, /Vibrant Blur Top/);
  assert.match(m, /a=1 @0/);
  assert.match(m, /a=0 @1/);
  assert.doesNotMatch(m, /Nested Symbol|Symbol BG/i);
});
