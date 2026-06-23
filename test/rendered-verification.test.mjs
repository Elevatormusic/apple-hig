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

test('the computer-control render tier is backed by a real tool grant (not advertised-but-impossible)', () => {
  const a = read('agents/design-reviewer.md');
  // if the reviewer advertises a computer-control render path, the agent MUST grant a computer-use tool
  if (/computer.control/i.test(a))
    assert.match(a, /mcp__computer-use__screenshot/,
      'reviewer advertises computer-control but the tools: frontmatter grants no computer-use tool');
});

test('benchmark rendered path guards repoAbs and normalises Windows paths', () => {
  const wf = read('scripts/design-benchmark.workflow.js');
  assert.match(wf, /rendered:true requires repoAbs/i, 'missing the empty-repoAbs guard');
  assert.match(wf, /replace\(\/\\\\\/g/, 'missing the backslash->slash file:// normalisation');
});
