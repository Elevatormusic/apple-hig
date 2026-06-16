// End-to-end probe tests. These compile + run scripts/sdk-probe/probe.swift via xcrun,
// so they only run on macOS with Xcode; everywhere else they skip (no toolchain).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runProbe, runSync, readCache, SCHEMA } from './hig-sync.mjs';

const macOnly = process.platform === 'darwin' ? false : 'macOS + Xcode only';

test('probe compiles and returns resolved colors + a correct type ramp', { skip: macOnly }, () => {
  const p = runProbe();
  assert.match(p.colors.system.blue.light, /^#[0-9A-Fa-f]{6,8}$/, 'systemBlue resolves to a hex');
  assert.ok(p.colors.semantic.label, 'has semantic colors');
  assert.equal(p.typeRamp.body.size, 17, 'body is 17pt');
  assert.equal(p.typeRamp.largeTitle.size, 34, 'largeTitle is 34pt');
  // Issue-2 fix: weight is real, not the old always-"Regular" face fallback.
  assert.equal(p.typeRamp.body.weight, 'Regular', 'body is Regular');
  assert.notEqual(p.typeRamp.headline.weight, 'Regular', 'headline is heavier than Regular (Semibold)');
});

test('--check validates SF Symbol names against the installed set', { skip: macOnly }, () => {
  const r = runProbe(['--check', 'checkmark', 'definitelynotasymbol123']);
  assert.equal(r.validate.checkmark, true, 'a real symbol exists');
  assert.equal(r.validate.definitelynotasymbol123, false, 'a bogus symbol does not');
});

test('sync writes a fresh, schema-matched cache', { skip: macOnly }, () => {
  runSync();
  const c = readCache();
  assert.ok(c, 'cache file written');
  assert.equal(c.schema, SCHEMA, 'cache schema matches current');
  assert.ok(c.colors.system.blue && c.typeRamp.body, 'cache carries colors + type ramp');
});
