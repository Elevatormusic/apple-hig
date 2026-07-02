import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateReport } from '../scripts/validate-review-report.mjs';

test('invariant C: blind spots forbid verified-pass', () => {
  const base = { schema: 1, scope: 'screen', level: 'full', findings: [] };
  const bad = validateReport({ ...base, verdict: 'verified-pass', blindSpots: ['custom-painted cal graph'] });
  assert.equal(bad.valid, false);
  assert.ok(bad.errors.some(e => /blind/i.test(e)));
  const ok = validateReport({ ...base, verdict: 'advisory-pass', blindSpots: ['custom-painted cal graph'] });
  assert.equal(ok.valid, true);
  const clean = validateReport({ ...base, verdict: 'verified-pass' }); // absent blindSpots = fine
  assert.equal(clean.valid, true);
});

test('invariant C: blindSpots/coverage shape errors are caught', () => {
  const base = { schema: 1, scope: 'screen', level: 'full', findings: [], verdict: 'advisory-pass' };
  assert.equal(validateReport({ ...base, blindSpots: 'the graph' }).valid, false);
  assert.equal(validateReport({ ...base, blindSpots: ['x', 42] }).valid, false); // elements must be strings
  assert.equal(validateReport({ ...base, coverage: 1.4 }).valid, false);
  assert.equal(validateReport({ ...base, coverage: 0.8, blindSpots: [] }).valid, true);
});

test('schema json carries the optional coverage + blindSpots properties', () => {
  const s = JSON.parse(readFileSync(new URL('../data/schema/design-review-report.schema.json', import.meta.url), 'utf8'));
  assert.ok(s.properties.blindSpots, 'schema missing blindSpots');
  assert.ok(s.properties.coverage, 'schema missing coverage');
  assert.ok(!s.required.includes('blindSpots'), 'blindSpots must stay optional (schema 1 compatible)');
});
