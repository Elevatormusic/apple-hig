import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const A = readFileSync(new URL('../agents/design-reviewer.md', import.meta.url), 'utf8');

test('reviewer calibrates to the platform (loads + applies its rubric) before flagging', () => {
  assert.match(A, /load the platform.{0,40}rubric/i);
  assert.match(A, /iOS defaults? (that are )?WRONG/i);
  assert.match(A, /macOS[^\n]*dense|dense[^\n]*macOS|density (is )?correct/i);
  assert.match(A, /never (flag|require)[^\n]*(clutter|too-small|missing-CTA|iOS chrome)/i);
});

test('platform-fit / layout-restructure findings default to medium (advisory), not auto-fail', () => {
  assert.match(A, /platform.fit[^\n]*medium|layout.restructure[^\n]*medium/i);
  assert.match(A, /don't escalate|doesn't `?fail`? unless[^\n]*block/i);
});
