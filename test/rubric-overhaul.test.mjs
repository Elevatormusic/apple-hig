import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const has = (s, sub) => s.replace(/\s+/g, ' ').includes(sub); // whitespace/newline-insensitive prose check

const web = read('skills/apple-hig/guidelines/profiles/web.md');
const sw = read('skills/apple-hig/guidelines/profiles/desktop-cross-platform.md');
const mac = read('skills/apple-hig/guidelines/platforms/macos.md');
const uni = read('skills/apple-hig/guidelines/universal.md');
const agent = read('agents/design-reviewer.md');

const AUTHORITIES = ['apple_published', 'platform_api_observed', 'wcag_external', 'community_convention', 'inference'];

test('web profile: two scope-bound profiles + the verification fixes', () => {
  assert.match(web, /Scope binding/);
  assert.match(web, /PROFILE A/);
  assert.match(web, /PROFILE B/);
  assert.match(web, /name (it|the chosen profile) in the verdict/i);
  // R2 additions
  assert.match(web, /Consistent Help[^\n]*3\.2\.6/);
  assert.match(web, /session.?timeout/i);
  assert.match(web, /single-page/i);
  // reflow stated as orthogonal 320/256, not an AND gate
  assert.match(web, /320 CSS px/);
  assert.match(web, /256 CSS px/);
  assert.match(web, /orthogonal/i);
  // web target floor is 24px, NOT Apple 44pt
  assert.match(web, /24×24 CSS px/);
  assert.ok(has(web, "do NOT apply Apple's 44pt as the web standard"), 'web 24px-not-44pt');
  // cardinal sin guarded
  assert.match(web, /cardinal sin/i);
});

test('web profile: authority discipline — contrast is W3C, apple_published reserved', () => {
  // contrast/target dims are wcag_external, never apple_published
  assert.match(web, /### Base 7[^\n]*`wcag_external`/);
  assert.match(web, /### Base 8[^\n]*`wcag_external`/);
  // the ONE apple_published typography rule is the SF prohibition
  assert.match(web, /### Base 3[^\n]*`apple_published`/);
  assert.match(web, /Apple Pay on the Web/);
  // the fabricated Apple HIG "designing-for-the-web" URL must NOT appear
  assert.doesNotMatch(web, /designing-for-the-web/);
  // every backtick authority tag is in the vocabulary
  for (const m of web.matchAll(/`([a-z_]+)`/g)) {
    if (m[1].includes('_') && /published|external|convention|observed|inference/.test(m[1])) {
      assert.ok(AUTHORITIES.includes(m[1]), `web.md unknown authority: ${m[1]}`);
    }
  }
});

test('software profile: nothing apple_published; host-OS conventions; cardinal sin', () => {
  // NO dimension headline is tagged apple_published
  const dimHeads = sw.split('\n').filter((l) => /^### \d+ —/.test(l));
  assert.ok(dimHeads.length >= 20, `expected the full dimension set, got ${dimHeads.length}`);
  for (const h of dimHeads) assert.ok(!/apple_published/.test(h), `software dim tagged apple_published: ${h}`);
  assert.ok(has(sw, 'NOTHING in this file is `apple_published`'), 'software nothing-apple_published');
  // host-OS conventions, not Apple
  for (const host of ['Fluent', 'GNOME', 'KDE']) assert.match(sw, new RegExp(host));
  // cardinal sin: never flag for LACKING iOS/macOS chrome
  assert.ok(has(sw, 'never flag a Windows/Linux/Electron app for *lacking* iOS/macOS chrome'), 'software cardinal-sin');
  // 24px floor, explicitly not Apple's 44pt
  assert.ok(has(sw, "Apple's 44pt touch minimum does NOT apply"), 'software 24px-not-44pt');
  // no fabricated character-per-line metric on the Microsoft typography URL
  assert.ok(has(sw, 'NOT any character-per-line metric'), 'software no-fabricated-CPL');
});

test('macOS overhaul: Dynamic-Type fix, control sizes, Larger-Text not overclaimed, markers kept', () => {
  // stale claim removed, Preferred Reading Size in. (2026-07-01: reworded again — macOS DOES have
  // a size ramp; what it lacks is Dynamic Type AUTO-SCALING. The old phrase over-denied the ramp.)
  assert.ok(has(mac, 'Dynamic Type auto-scaling'), 'macOS Dynamic-Type reframed (auto-scaling only)');
  assert.doesNotMatch(mac, /has no iOS-style Dynamic Type ramp/);
  assert.match(mac, /Preferred Reading Size/);
  assert.doesNotMatch(mac, /user adjusts via display zoom/); // old stale line gone
  // verified control-size pair, not the invented 28/24/20 ramp
  assert.match(mac, /28×28 pt/);
  assert.match(mac, /20×20 pt/);
  assert.doesNotMatch(mac, /28\/24\/20pt/);
  // Larger Text overclaim removed (wrap-tolerant: the phrase spans a line break post-27-rewording)
  assert.match(mac, /NOT[\s\r\n]+in Apple's Larger-Text ASC criterion/);
  // reviewer-keyed markers preserved
  assert.match(mac, /## Design rubric/);
  assert.match(mac, /iOS defaults WRONG here/);
});

test('reduced-motion honoring is community_convention, not a WCAG AA gate (2.3.3 is AAA)', () => {
  // B1 fix: WCAG 2.3.3 Animation from Interactions is AAA; honoring prefers-reduced-motion is a convention
  for (const f of [web, sw]) assert.doesNotMatch(f, /reduced-motion gate = `wcag_external`/);
  assert.match(sw, /### 21 —[^\n]*Motion[^\n]*`community_convention`/);
  assert.ok(has(web, 'AAA / advisory'), 'web notes 2.3.3 as AAA/advisory');
  assert.ok(has(web, "honoring `prefers-reduced-motion` = `community_convention`"), 'web reduced-motion = convention');
});

test('universal.md routes web/desktop to profiles and drops the inline web rubric', () => {
  assert.match(uni, /profiles\/web\.md/);
  assert.match(uni, /profiles\/desktop-cross-platform\.md/);
  assert.doesNotMatch(uni, /## Web design rubric/); // moved out
  assert.match(uni, /Web & desktop rubrics live in profiles/);
});

test('design-reviewer loads profiles and calibrates web (profile-bound) + desktop targets', () => {
  assert.match(agent, /profiles\/web\.md/);
  assert.match(agent, /profiles\/desktop-cross-platform\.md/);
  assert.match(agent, /bind the profile/);
  assert.match(agent, /Profile \*\*A\*\*/);
  assert.match(agent, /desktop \/ cross-platform software/);
  assert.ok(has(agent, 'never flag\nit for lacking iOS/macOS chrome'.replace(/\s+/g, ' ')), 'reviewer desktop cardinal-sin guard');
});
