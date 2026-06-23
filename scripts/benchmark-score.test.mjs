import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreFixture, aggregate } from './benchmark-score.mjs';

test('scoreFixture: a perfect hit (right verdict, expected category found, no must-not flagged)', () => {
  const r = scoreFixture(
    { verdict: 'fail', categories: ['hierarchy', 'visual'], flags: [] },
    { expectedVerdict: 'fail', expectedCategories: ['hierarchy'], mustNotFlag: ['off-grid-spacing'] });
  assert.equal(r.verdictMatch, true);
  assert.deepEqual(r.truePositives, ['hierarchy']);
  assert.deepEqual(r.falseNegatives, []);
  assert.deepEqual(r.falsePositives, []);
});

test('scoreFixture: a missed expected category is a false negative', () => {
  const r = scoreFixture(
    { verdict: 'advisory-pass', categories: ['visual'], flags: [] },
    { expectedVerdict: 'fail', expectedCategories: ['hierarchy'], mustNotFlag: [] });
  assert.equal(r.verdictMatch, false);
  assert.deepEqual(r.falseNegatives, ['hierarchy']);
});

test('scoreFixture: flagging a must-not-flag rule is a false positive (substring match)', () => {
  const r = scoreFixture(
    { verdict: 'advisory-pass', categories: [], flags: ['off-grid-spacing 13px', 'missing-primary-action'] },
    { expectedVerdict: 'advisory-pass', expectedCategories: [], mustNotFlag: ['missing-primary-action'] });
  assert.deepEqual(r.falsePositives, ['missing-primary-action']);
});

test('aggregate: precision/recall/verdict-accuracy across fixtures', () => {
  const results = [
    { verdictMatch: true, truePositives: ['hierarchy'], falseNegatives: [], falsePositives: [] },
    { verdictMatch: false, truePositives: [], falseNegatives: ['state'], falsePositives: ['x'] },
  ];
  const a = aggregate(results);
  assert.equal(a.recall, 0.5);        // 1 tp of (1 tp + 1 fn)
  assert.equal(a.precision, 0.5);     // 1 tp of (1 tp + 1 fp)
  assert.equal(a.verdictAccuracy, 0.5);
  assert.equal(a.falsePositives, 1);
  assert.equal(a.falseNegatives, 1);
});

test('aggregate: empty input scores a clean 1.0 (no division by zero)', () => {
  const a = aggregate([]);
  assert.equal(a.precision, 1);
  assert.equal(a.recall, 1);
  assert.equal(a.verdictAccuracy, 1);
});
