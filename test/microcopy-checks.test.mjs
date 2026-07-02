import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  runMicrocopyChecks, casingConsistency, redundantCopy, longAllCaps,
  unexplainedAcronym, placeholderGlyphs, destructiveVerb,
} from '../scripts/microcopy-checks.mjs';

// —— the motivating examples (a real pro-audio app's labels) ——
test('casing consistency: same concept in two case patterns fires (the COMBINE MODE case)', () => {
  const f = casingConsistency(['COMBINE MODE', 'Combine mode', 'Input Device']);
  assert.equal(f.length, 1);
  assert.equal(f[0].check, 'casing-consistency');
  assert.equal(f[0].severity, 'medium'); // the one deterministic near-fail
  assert.equal(f[0].authority, 'apple_published');
  assert.deepEqual(f[0].offenders.sort(), ['COMBINE MODE', 'Combine mode']);
});

test('casing consistency: acronyms and distinct concepts do not fire', () => {
  assert.equal(casingConsistency(['OK', 'Ok']).length, 0); // allowlisted acronym-ish token
  assert.equal(casingConsistency(['Left', 'Right', 'USB', 'usb device']).length, 0); // different concepts
});

test('redundant copy: virtual x3 in one control string fires (off by default, on when enabled)', () => {
  const s = 'Output (Virtual Cable) VIRTUAL AUDIO virtual device';
  assert.equal(runMicrocopyChecks([s]).filter(f => f.check === 'redundant-copy').length, 0); // default OFF
  const f = redundantCopy([s]);
  assert.equal(f.length, 1);
  assert.equal(f[0].severity, 'low');
  assert.match(f[0].message, /virtual/i);
});

test('redundant copy: sibling parallelism and 2x within-string do NOT fire (needs >=3)', () => {
  assert.equal(redundantCopy(['Left ear — Left channel']).length, 0); // 2x = judgment call, not deterministic
  assert.equal(redundantCopy(['Min', 'Max', 'Left', 'Left']).length, 0); // across-sibling repeats exempt
});

test('long all-caps: passage-style fires INFO, short glanceable labels do not (NN/g)', () => {
  const f = longAllCaps(['PREFERRED DEPTH IN THE MIX', 'COMBINE MODE', 'HEQ']);
  assert.equal(f.length, 1);
  assert.equal(f[0].severity, 'info');
  assert.equal(f[0].authority, 'community_convention');
  assert.deepEqual(f[0].offenders, ['PREFERRED DEPTH IN THE MIX']);
});

test('unexplained acronym: HEQ fires advisory; allowlist + units + explained do not', () => {
  const f = unexplainedAcronym(['HEQ', 'USB input', 'Level (dB)', 'SNR (signal-to-noise ratio)']);
  assert.equal(f.length, 1);
  assert.deepEqual(f[0].offenders, ['HEQ']);
  assert.equal(f[0].authority, 'wcag_external'); // SC 3.1.4 — AAA, always advisory
  assert.equal(f[0].severity, 'low');
  // pro-tool profile drops it to info
  const pro = unexplainedAcronym(['HEQ'], { profile: 'pro-tool' });
  assert.equal(pro[0].severity, 'info');
});

test('placeholder glyphs: ... -> … fires by default; dash standardization only when enabled', () => {
  const f = placeholderGlyphs(['Loading...', 'Ready']);
  assert.equal(f.length, 1);
  assert.equal(f[0].check, 'ellipsis-correctness');
  assert.equal(f[0].authority, 'apple_published');
  const std = placeholderGlyphs(['—', '-', 'N/A'], { standardization: true });
  assert.ok(std.some(x => x.check === 'glyph-standardization'));
  assert.equal(placeholderGlyphs(['—', '-', 'N/A']).filter(x => x.check === 'glyph-standardization').length, 0);
});

test('destructive verb: Remove fires as prompt-to-verify advisory; medium only when persistedData', () => {
  const f = destructiveVerb(['Remove', 'Add device']);
  assert.equal(f.length, 1);
  assert.equal(f[0].severity, 'advisory');
  assert.match(f[0].message, /confirm|undo/i); // worded as verify-this, not asserted violation
  const gated = destructiveVerb(['Remove'], { persistedData: true });
  assert.equal(gated[0].severity, 'medium'); // the gated WCAG 3.3.4 case
});

test('runMicrocopyChecks: defaults = casing + all-caps + acronym + ellipsis + destructive; no WCAG 3.1.2 anywhere', () => {
  const f = runMicrocopyChecks(['COMBINE MODE', 'Combine mode', 'Loading...', 'HEQ', 'Remove']);
  const checks = new Set(f.map(x => x.check));
  assert.ok(checks.has('casing-consistency'));
  assert.ok(checks.has('ellipsis-correctness'));
  assert.ok(!checks.has('redundant-copy'));
  for (const x of f) assert.doesNotMatch(x.message, /3\.1\.2/);
});

test('unexplained acronym: styled words inside all-caps multi-word labels are NOT acronyms', () => {
  const f = unexplainedAcronym(['COMBINE MODE', 'PREFERRED DEPTH']);
  assert.equal(f.length, 0); // MODE/DEPTH are styling, owned by the all-caps check
  assert.equal(unexplainedAcronym(['HEQ']).length, 1); // single-token acronyms still fire
});
