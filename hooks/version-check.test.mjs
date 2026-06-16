import { test } from 'node:test';
import assert from 'node:assert';
import { isOlder, enabled } from './version-check.mjs';

test('isOlder compares versions numerically (not lexically)', () => {
  assert.equal(isOlder('1.4.2', '1.5.0'), true);
  assert.equal(isOlder('1.4.2', '1.4.10'), true);   // 10 > 2 numerically
  assert.equal(isOlder('1.9.9', '2.0.0'), true);
  assert.equal(isOlder('1.5.0', '1.4.2'), false);
  assert.equal(isOlder('2.0.0', '1.9.9'), false);
  assert.equal(isOlder('1.4.2', '1.4.2'), false);   // equal => not older
});

test('enabled() defaults on, respects HIG_UPDATE_CHECK', () => {
  const prev = process.env.HIG_UPDATE_CHECK;
  delete process.env.HIG_UPDATE_CHECK; assert.equal(enabled(), true);
  process.env.HIG_UPDATE_CHECK = 'off'; assert.equal(enabled(), false);
  process.env.HIG_UPDATE_CHECK = '0'; assert.equal(enabled(), false);
  process.env.HIG_UPDATE_CHECK = '1'; assert.equal(enabled(), true);
  if (prev === undefined) delete process.env.HIG_UPDATE_CHECK; else process.env.HIG_UPDATE_CHECK = prev;
});
