import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateReport } from './validate-review-report.mjs';

const finding = (over = {}) => ({
  id: 'f1', ruleId: 'hierarchy.competing-primary', category: 'hierarchy',
  authority: 'inference', severity: 'medium', confidence: 'medium', evidence: 'inferred',
  location: { file: 'V.swift', line: 10 }, problem: 'two equal primary buttons',
  userImpact: 'user cannot tell which action is intended', fix: 'demote one to bordered',
  source: null, howToVerify: 'render and check dominant element', ...over,
});
const report = (over = {}) => ({
  schema: 1, scope: 'screen', level: 'visual', platforms: ['ios'], stack: 'swiftui',
  deploymentTarget: null, stagesRun: [], stagesSkipped: [], findings: [], verdict: 'advisory-pass', ...over,
});

test('a well-formed report is valid', () => {
  assert.deepEqual(validateReport(report({ findings: [finding()] })), { valid: true, errors: [] });
});

test('verified-pass at level=static is rejected', () => {
  const r = validateReport(report({ verdict: 'verified-pass', level: 'static' }));
  assert.equal(r.valid, false);
  assert.ok(r.errors.some((e) => /verified-pass/.test(e) && /static/.test(e)));
});

test('a high finding at medium confidence forces verdict=fail', () => {
  const r = validateReport(report({
    verdict: 'advisory-pass',
    findings: [finding({ severity: 'high', confidence: 'medium' })],
  }));
  assert.equal(r.valid, false);
  assert.ok(r.errors.some((e) => /verdict=fail/.test(e)));
});

test('verdict=fail with no blocking finding is rejected', () => {
  const r = validateReport(report({ verdict: 'fail', findings: [finding({ severity: 'low', confidence: 'low' })] }));
  assert.equal(r.valid, false);
});

test('a finding missing userImpact is rejected', () => {
  const r = validateReport(report({ findings: [finding({ userImpact: '' })] }));
  assert.equal(r.valid, false);
  assert.ok(r.errors.some((e) => /userImpact/.test(e)));
});

test('an unknown authority value is rejected', () => {
  const r = validateReport(report({ findings: [finding({ authority: 'apple_says_so' })] }));
  assert.equal(r.valid, false);
  assert.ok(r.errors.some((e) => /authority/.test(e)));
});

test('a low-confidence high-severity finding does NOT force fail (advisory allowed)', () => {
  assert.equal(validateReport(report({ verdict: 'advisory-pass',
    findings: [finding({ severity: 'high', confidence: 'low' })] })).valid, true);
});
