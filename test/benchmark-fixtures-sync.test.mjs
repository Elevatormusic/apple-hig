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

test('manifest and inlined workflow FIXTURES match per-fixture, per-field (no silent ground-truth drift)', () => {
  const expected = JSON.parse(read('test/fixtures/design/expected.json')).fixtures;
  const wf = read('scripts/design-benchmark.workflow.js');
  const m = wf.match(/const FIXTURES = (\[[\s\S]*?\n\])/);
  assert.ok(m, 'could not locate the inlined FIXTURES array');
  const inlined = (0, eval)(m[1]); // our own committed source; a JS array literal
  assert.equal(inlined.length, expected.length, 'fixture count differs between manifest and workflow');
  const byFile = Object.fromEntries(inlined.map((f) => [f.file, f]));
  for (const e of expected) {
    const i = byFile[e.file];
    assert.ok(i, `workflow missing fixture ${e.file}`);
    assert.equal(i.expectedVerdict, e.expectedVerdict, `${e.file}: expectedVerdict drift`);
    assert.deepEqual(i.expectedCategories, e.expectedCategories, `${e.file}: expectedCategories drift`);
    assert.deepEqual(i.mustNotFlag, e.mustNotFlag, `${e.file}: mustNotFlag drift`);
  }
});

test('the workflow inlines the same scoring contract as scripts/benchmark-score.mjs', () => {
  const wf = read('scripts/design-benchmark.workflow.js');
  // the inlined scorer must compute the same fields the node module + its test assert
  for (const field of ['verdictMatch', 'truePositives', 'falseNegatives', 'falsePositives'])
    assert.match(wf, new RegExp(field), `workflow scorer missing ${field}`);
});
