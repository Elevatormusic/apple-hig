import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { CATEGORIES, VERDICTS } from '../scripts/validate-review-report.mjs';
const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');

test('both seed fixtures exist and are non-empty HTML', () => {
  for (const f of ['test/fixtures/design/perfect-tokens-wrong-hierarchy.html',
    'test/fixtures/design/monitoring-no-cta.html']) {
    assert.ok(existsSync(new URL(f, root)), `${f} missing`);
    assert.match(read(f), /<html|<!doctype/i, `${f} not HTML`);
  }
});

test('the manifest is well-formed and uses valid vocabulary', () => {
  const m = JSON.parse(read('test/fixtures/design/expected.json'));
  assert.ok(Array.isArray(m.fixtures) && m.fixtures.length >= 2);
  for (const fx of m.fixtures) {
    assert.ok(typeof fx.file === 'string' && existsSync(new URL('test/fixtures/design/' + fx.file, root)));
    assert.ok(VERDICTS.includes(fx.expectedVerdict), `bad verdict ${fx.expectedVerdict}`);
    assert.ok(Array.isArray(fx.expectedCategories));
    for (const c of fx.expectedCategories) assert.ok(CATEGORIES.includes(c), `bad category ${c}`);
  }
});

test('the manifest encodes the two headline behaviors', () => {
  const m = JSON.parse(read('test/fixtures/design/expected.json'));
  const byFile = Object.fromEntries(m.fixtures.map((f) => [f.file, f]));
  assert.equal(byFile['perfect-tokens-wrong-hierarchy.html'].expectedVerdict, 'fail');
  assert.ok(byFile['perfect-tokens-wrong-hierarchy.html'].expectedCategories.includes('hierarchy'));
  assert.notEqual(byFile['monitoring-no-cta.html'].expectedVerdict, 'fail');
});
