import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');

test('the benchmark workflow fixtures stay in sync with expected.json', () => {
  const expected = JSON.parse(read('test/fixtures/design/expected.json'));
  const wf = read('scripts/design-benchmark.workflow.js');
  assert.ok(expected.fixtures.length >= 4, 'expected at least 4 benchmark fixtures');
  for (const fx of expected.fixtures) {
    assert.ok(wf.includes(fx.file), `workflow missing fixture ${fx.file}`);
    assert.ok(wf.includes(`'${fx.expectedVerdict}'`), `workflow missing verdict ${fx.expectedVerdict}`);
  }
});

test('the workflow inlines the same scoring contract as scripts/benchmark-score.mjs', () => {
  const wf = read('scripts/design-benchmark.workflow.js');
  // the inlined scorer must compute the same fields the node module + its test assert
  for (const field of ['verdictMatch', 'truePositives', 'falseNegatives', 'falsePositives'])
    assert.match(wf, new RegExp(field), `workflow scorer missing ${field}`);
});
