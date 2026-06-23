import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');

test('reviewer verification covers Playwright AND computer-control render tiers, then static', () => {
  const a = read('agents/design-reviewer.md');
  assert.match(a, /browser_\*|Playwright/i);
  assert.match(a, /computer.control|computer.use|screenshot the (screen|desktop)/i);
  assert.match(a, /else[^\n]*static|otherwise[^\n]*static|neither[^\n]*static/i);
});

test('visual-verification reference documents how to render (capability tiers)', () => {
  const v = read('skills/apple-hig/references/visual-verification.md');
  assert.match(v, /Playwright/i);
  assert.match(v, /computer.control|computer.use/i);
  assert.match(v, /file:\/\/|served|local server|URL/i);
});

test('benchmark workflow has a capability-gated rendered path (file:// + sequential)', () => {
  const wf = read('scripts/design-benchmark.workflow.js');
  assert.match(wf, /rendered/i);
  assert.match(wf, /file:\/\//);
  assert.match(wf, /browser_navigate|browser_take_screenshot|browser_resize/);
});
