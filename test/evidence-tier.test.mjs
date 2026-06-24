import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EVIDENCE, canVerifiedPass } from '../scripts/validate-review-report.mjs';

test('extracted is a valid evidence tier that cannot reach verified-pass', () => {
  assert.ok(EVIDENCE.includes('extracted'), 'extracted is a valid evidence value');
  // the deterministic-but-not-rendered tiers never clear verified-pass
  assert.equal(canVerifiedPass('extracted'), false);
  assert.equal(canVerifiedPass('inferred'), false);
  assert.equal(canVerifiedPass('static-code'), false);
  // genuinely-measured tiers can
  assert.equal(canVerifiedPass('computed'), true);
  assert.equal(canVerifiedPass('screenshot'), true);
});
