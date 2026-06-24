import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const A = readFileSync(new URL('../agents/design-reviewer.md', import.meta.url), 'utf8');

test('reviewer self-checks every blocking finding before emitting fail', () => {
  assert.match(A, /before[^\n]*emit[^\n]*`?fail`?|before you (emit )?`?fail`?/i);
  assert.match(A, /blocks? the (core|primary) task/i);
});

test('reviewer states that catching a problem is not the same as blocking on it', () => {
  assert.match(A, /catching[^\n]*not[^\n]*block|finding[^\n]*not[^\n]*block|most findings are advisory|advisory by default/i);
});
