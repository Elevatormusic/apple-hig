import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { AUTHORITIES } from '../scripts/validate-review-report.mjs';
const root = new URL('../', import.meta.url);
const g = (p) => readFileSync(new URL('skills/apple-hig/guidelines/' + p, root), 'utf8');

test('macOS rubric: density-correct, complete menu bar, no toolbar-only, no Dynamic Type', () => {
  const m = g('platforms/macos.md');
  assert.match(m, /design rubric/i);
  assert.match(m, /densit/i);
  assert.match(m, /menu bar/i);
  assert.match(m, /toolbar/i);
  assert.match(m, /no iOS-style Dynamic Type ramp|Preferred Reading Size/i);
});

test('iPadOS rubric: not a big iPhone, restructure, size classes, multitasking', () => {
  const m = g('platforms/ipados.md');
  assert.match(m, /design rubric/i);
  assert.match(m, /stretched|restructure/i);
  assert.match(m, /size.class/i);
  assert.match(m, /split view|sidebar/i);
});

test('tvOS rubric: focusable, system focus effect, 56/66pt floor', () => {
  const m = g('platforms/tvos.md');
  assert.match(m, /design rubric/i);
  assert.match(m, /focusable/i);
  assert.match(m, /focus effect/i);
  assert.match(m, /66pt|56pt/);
});

test('visionOS rubric: gaze 60pt, ornaments, motion comfort', () => {
  const m = g('platforms/visionos.md');
  assert.match(m, /design rubric/i);
  assert.match(m, /gaze/i);
  assert.match(m, /ornament/i);
  assert.match(m, /motion comfort|stationary frame/i);
});

test('web rubric: not iOS cosplay, web-native, W3C authority (not Apple)', () => {
  // the web rubric now lives in its own profile (two scope-bound profiles)
  const w = g('profiles/web.md');
  assert.match(w, /web design rubric/i);
  assert.match(w, /cosplay/i);
  assert.match(w, /focus-visible|2\.4\.7|WCAG/i);
  assert.match(w, /W3C|WHATWG|wcag_external/);
  // and universal.md routes to it rather than embedding it
  assert.match(g('universal.md'), /profiles\/web\.md/);
});

test('platform rubrics use the SP-A authority vocabulary, not Apple-everywhere', () => {
  // each rubric must contain at least one non-Apple authority label (honesty)
  assert.match(g('platforms/tvos.md'), /community_convention/);
  assert.match(g('platforms/macos.md'), /platform_api_observed/);
  assert.match(g('profiles/web.md'), /wcag_external/);
  assert.match(g('profiles/desktop-cross-platform.md'), /community_convention/);
  assert.match(g('universal.md'), /inference|wcag_external|community_convention/);
});

test('rubric authority tags use ONLY the canonical six-value vocabulary', () => {
  const files = ['platforms/macos.md', 'platforms/ipados.md', 'platforms/tvos.md',
    'platforms/visionos.md', 'universal.md'];
  for (const p of files) {
    const txt = g(p);
    assert.doesNotMatch(txt, /\bweb standard\b/i, `${p}: "web standard" is not a valid authority`);
    // any snake_case token immediately after "(" must be a real authority value
    const tags = (txt.match(/\(([a-z][a-z_]*[a-z])\b/g) || []).map((s) => s.slice(1)).filter((t) => t.includes('_'));
    for (const t of tags) assert.ok(AUTHORITIES.includes(t), `${p}: invalid authority tag "(${t}"`);
  }
});
