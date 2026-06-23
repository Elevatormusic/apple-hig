import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const S = readFileSync(new URL('../commands/hig-scaffold.md', import.meta.url), 'utf8');

test('scaffold plans product/IA/state/responsive BEFORE generating code', () => {
  const planIdx = S.search(/screen definition|product assumption|hierarchy plan/i);
  const codeIdx = S.search(/generate (the )?code|then[^\n]{0,12}generate/i);
  assert.ok(planIdx !== -1, 'no plan-before-code phase');
  assert.ok(codeIdx !== -1, 'no code-generation step');
  assert.ok(planIdx < codeIdx, 'code generation must come AFTER the plan');
});

test('scaffold requires the four plans', () => {
  assert.match(S, /screen definition|product assumption/i);
  assert.match(S, /hierarchy plan/i);
  assert.match(S, /state plan|state matrix|required states/i);
  assert.match(S, /responsive plan|responsive/i);
});

test('scaffold is deployment-target aware', () => {
  assert.match(S, /deployment target|minimum os|#available|min(imum)? OS/i);
});

test('scaffold no longer overclaims or over-prescribes (audit fixes)', () => {
  assert.doesNotMatch(S, /compliant by construction/i);                 // P2-12
  assert.match(S, /platform.{0,4}(design )?rubric|platform-appropriate/i); // defer to SP-B rubric
  assert.match(S, /recommend MapKit|provider[^\n]{0,24}assumption|don't (force|mandate)/i); // P1-22
  assert.match(S, /rationale[^\n]{0,40}(plan|summary|report)|out of production code|only comment/i); // P2-11
});
