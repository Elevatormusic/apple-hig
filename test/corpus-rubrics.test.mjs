import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const root = new URL('../', import.meta.url);
const g = (p) => readFileSync(new URL('skills/apple-hig/guidelines/' + p, root), 'utf8');

test('macOS rubric: density-correct, complete menu bar, no toolbar-only, no Dynamic Type', () => {
  const m = g('platforms/macos.md');
  assert.match(m, /design rubric/i);
  assert.match(m, /densit/i);
  assert.match(m, /menu bar/i);
  assert.match(m, /toolbar/i);
  assert.match(m, /no dynamic type|doesn't support it/i);
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
  const u = g('universal.md');
  assert.match(u, /web design rubric/i);
  assert.match(u, /cosplay/i);
  assert.match(u, /focus-visible|2\.4\.7|WCAG/);
  assert.match(u, /never badge them with Apple|W3C|WHATWG/);
});

test('platform rubrics use the SP-A authority vocabulary, not Apple-everywhere', () => {
  // each rubric must contain at least one non-Apple authority label (honesty)
  assert.match(g('platforms/tvos.md'), /community_convention/);
  assert.match(g('universal.md'), /wcag_external|community_convention/);
  assert.match(g('platforms/macos.md'), /platform_api_observed/);
});
