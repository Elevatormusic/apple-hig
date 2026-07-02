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
