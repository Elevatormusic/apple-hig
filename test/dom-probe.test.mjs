import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const root = new URL('../', import.meta.url);
const P = readFileSync(new URL('skills/apple-hig/references/dom-probe.js', root), 'utf8');
const M = readFileSync(new URL('scripts/wcag-contrast.mjs', root), 'utf8');

test('dom-probe measures contrast, target geometry, and dark-mode from the rendered DOM', () => {
  assert.match(P, /getComputedStyle/);
  assert.match(P, /getBoundingClientRect/);
  assert.match(P, /prefers-color-scheme/);
  assert.match(P, /0\.2126[\s\S]*0\.7152[\s\S]*0\.0722/); // WCAG luminance coefficients
  assert.match(P, /textContrastFailures/);
  assert.match(P, /smallTargets/);
  assert.match(P, /visualWeightTop/);
  assert.match(P, /squint|visual weight/i);
  assert.match(P, /evidence:\s*'computed'/);
});

test('the reviewer uses the visual-weight signal for an evidence-backed hierarchy check', () => {
  const A = readFileSync(new URL('agents/design-reviewer.md', root), 'utf8');
  assert.match(A, /visualWeightTop|visual weight|squint/i);
  assert.match(A, /hierarchy inversion|dominant[^\n]*element|outweigh/i);
});

test('the probe uses the same sRGB/WCAG constants as the unit-tested module (kept in sync)', () => {
  for (const tok of ['0.03928', '1.055', '2.4', '0.2126']) {
    const re = new RegExp(tok.replace('.', '\\.'));
    assert.match(P, re, `probe missing ${tok}`);
    assert.match(M, re, `wcag-contrast.mjs missing ${tok}`);
  }
});

test('the visual-weight formula is identical in the probe and the unit-tested module (kept in sync)', () => {
  const VW = readFileSync(new URL('scripts/visual-weight.mjs', root), 'utf8');
  // the constants that DEFINE the squint test — must match verbatim across both files
  for (const tok of ['(contrast - 1) / 20', '0.15 * (bold ? 1.5 : 1)']) {
    assert.ok(P.includes(tok), `probe missing visual-weight token: ${tok}`);
    assert.ok(VW.includes(tok), `visual-weight.mjs missing visual-weight token: ${tok}`);
  }
});

test('the reviewer wires the probe into the rendered path as evidence:computed', () => {
  const A = readFileSync(new URL('agents/design-reviewer.md', root), 'utf8');
  assert.match(A, /dom-probe(\.js)?/i);
  assert.match(A, /evidence[:\s]*`?computed`?/i);
  assert.match(A, /browser_evaluate/);
});
