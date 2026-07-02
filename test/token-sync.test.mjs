import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const root = new URL('../', import.meta.url);
const at = (p) => readFileSync(new URL(p, root), 'utf8');

// Parse "name light dark" hue pairs from any of the three file formats.
// Matches "| blue | #0088FF | #0091FF |" and "blue `#0088FF`→`#0091FF`" and "| Blue | #0088FF | #0091FF |"
export function huePairs(text) {
  const out = new Map();
  const table = /\|\s*\**([A-Za-z][A-Za-z 0-9]*?)\**\s*\|\s*`?(#[0-9A-Fa-f]{6})`?[^|]*\|\s*`?(#[0-9A-Fa-f]{6})/g;
  const inline = /\b([a-z][a-z0-9]*)\s*`(#[0-9A-Fa-f]{6})`\s*(?:→|->)\s*`(#[0-9A-Fa-f]{6})`/g;
  for (const re of [table, inline]) {
    for (const m of text.matchAll(re)) {
      out.set(m[1].trim().toLowerCase().replace(/\s+/g, ''), [m[2].toUpperCase(), m[3].toUpperCase()]);
    }
  }
  return out;
}

const HUES = ['red', 'orange', 'yellow', 'green', 'mint', 'teal', 'cyan', 'blue', 'indigo', 'purple', 'pink', 'brown'];

test('27-gen palette: design-tokens.md, design-tokens-ios.md, and hig-tokens.md all agree', () => {
  const a = huePairs(at('skills/apple-hig/references/design-tokens.md'));
  const b = huePairs(at('skills/apple-hig/references/design-tokens-ios.md'));
  const c = huePairs(at('commands/hig-tokens.md'));
  for (const h of HUES) {
    assert.ok(a.has(h), `design-tokens.md missing hue ${h}`);
    assert.ok(b.has(h), `design-tokens-ios.md missing hue ${h}`);
    assert.ok(c.has(h), `hig-tokens.md missing hue ${h}`);
    assert.deepEqual(a.get(h), b.get(h), `hue ${h}: design-tokens.md vs design-tokens-ios.md`);
    assert.deepEqual(a.get(h), c.get(h), `hue ${h}: design-tokens.md vs hig-tokens.md`);
  }
  // keystone: 27-gen blue everywhere
  assert.deepEqual(a.get('blue'), ['#0088FF', '#0091FF']);
});

test('stale values are gone from the refreshed files', () => {
  const dt = at('skills/apple-hig/references/design-tokens.md');
  const ht = at('commands/hig-tokens.md');
  for (const [name, text] of [['design-tokens.md', dt], ['hig-tokens.md', ht]]) {
    assert.doesNotMatch(text, /#0984FF/i, `${name} still has the link-dark typo`);
    assert.doesNotMatch(text, /#007AFF/i, `${name} still has the pre-27 blue`);
    assert.doesNotMatch(text, /#FF3B30/i, `${name} still has the pre-27 red`);
  }
  // quinary tier + elevated ramp arrived in the quick source
  assert.match(dt, /quinary/i);
  assert.match(dt, /elevated/i);
  // pointer block to the platform references
  assert.match(dt, /design-tokens-macos/);
  assert.match(dt, /design-tokens-watchos/);
  assert.match(dt, /design-tokens-visionos/);
  // last_verified bumped
  assert.match(dt, /last_verified: 2026-07-01/);
});

test('macOS window-background fix landed and stays in sync with the reference', () => {
  const mac = at('skills/apple-hig/guidelines/platforms/macos.md');
  const refm = at('skills/apple-hig/references/design-tokens-macos.md');
  // #ECECEC may appear ONLY in the repurposing note ("#ECECEC is now the Materials base")
  assert.doesNotMatch(mac, /#ECECEC(?![^\n]*is now)/i, 'macos.md still prints the stale window hex');
  assert.doesNotMatch(mac, /#323232/i, 'macos.md still prints the stale dark window hex');
  assert.match(mac, /#FFFFFF/i);
  assert.match(mac, /#1E1E1E/i);
  for (const hex of ['#FFFFFF', '#1E1E1E']) {
    assert.match(refm, new RegExp(hex, 'i'), `reference missing window hex ${hex}`);
  }
  // pointer to the reference file
  assert.match(mac, /design-tokens-macos/);
  // rewording: auto-scaling denial stays, size-ramp denial is gone
  assert.match(mac, /Preferred Reading Size/);
  assert.doesNotMatch(mac, /has no iOS-style Dynamic Type ramp/,
    'macos.md still over-denies the macOS size ramp — the reworded text should deny only auto-scaling');
});

test('foundations corrections landed', () => {
  const color = at('skills/apple-hig/guidelines/foundations/color.md');
  const dark = at('skills/apple-hig/guidelines/foundations/dark-mode.md');
  const mats = at('skills/apple-hig/guidelines/foundations/materials.md');
  const lic = at('skills/apple-hig/guidelines/licensing-and-assets.md');
  assert.doesNotMatch(color, /#0984FF/i, 'color.md still has the link-dark typo');
  assert.match(color, /#0088FF/i, 'color.md missing the 27 blue');
  assert.doesNotMatch(dark, /systemBlue #0A84FF/, 'dark-mode.md still cites the pre-27 systemBlue dark');
  assert.match(dark, /#0091FF/i);
  assert.doesNotMatch(mats, /not (an? )?(enumerated as a )?standard HIG material/i,
    'materials.md still claims ultraThick is not standard (macOS 27 defines Ultra Thick)');
  assert.match(mats, /design-tokens-macos/, 'materials.md missing the pointer to the macOS values');
  assert.match(lic, /Apple-Design-Resources-License|apple-design-resources/i,
    'licensing-and-assets.md missing the Design Resources License citation');
});
