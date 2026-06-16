import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SCHEMA, cacheDir, cachePath, readCache, writeCache, isFresh, prefFromEnv, isMac, decideAction }
  from './hig-sync.mjs';

test('cachePath honors XDG_CACHE_HOME', () => {
  const env = { XDG_CACHE_HOME: '/x/cache' };
  assert.equal(cacheDir(env).replace(/\\/g, '/'), '/x/cache/apple-hig');
  assert.equal(cachePath(env).replace(/\\/g, '/'), '/x/cache/apple-hig/live-tokens.json');
});

test('writeCache/readCache round-trip atomically', () => {
  const dir = mkdtempSync(join(tmpdir(), 'hig-cache-'));
  const p = join(dir, 'live-tokens.json');
  const data = { schema: SCHEMA, xcodeBuild: '17A1', colors: { system: {} } };
  writeCache(data, p);
  assert.equal(existsSync(p + '.tmp'), false);
  assert.deepEqual(readCache(p), data);
  rmSync(dir, { recursive: true, force: true });
});

test('readCache returns null on missing/corrupt', () => {
  assert.equal(readCache(join(tmpdir(), 'nope-hig.json')), null);
});

test('isFresh requires matching schema and xcodeBuild', () => {
  assert.equal(isFresh({ schema: SCHEMA, xcodeBuild: '17A1' }, '17A1'), true);
  assert.equal(isFresh({ schema: SCHEMA, xcodeBuild: '17A1' }, '17B2'), false);
  assert.equal(isFresh({ schema: 0, xcodeBuild: '17A1' }, '17A1'), false);
  assert.equal(isFresh(null, '17A1'), false);
});

test('prefFromEnv defaults to ask and validates', () => {
  assert.equal(prefFromEnv({}), 'ask');
  assert.equal(prefFromEnv({ HIG_SDK_SYNC: 'ALWAYS' }), 'always');
  assert.equal(prefFromEnv({ HIG_SDK_SYNC: 'never' }), 'never');
  assert.equal(prefFromEnv({ HIG_SDK_SYNC: 'garbage' }), 'ask');
});

test('isMac reflects the platform argument', () => {
  assert.equal(isMac('darwin'), true);
  assert.equal(isMac('win32'), false);
});

test('decideAction covers the consent matrix', () => {
  const fresh = { schema: SCHEMA, xcodeBuild: '17A1' };
  const stale = { schema: SCHEMA, xcodeBuild: 'OLD' };
  assert.equal(decideAction({ platform: 'win32', xcodeOk: false, cache: null, xcodeBuild: '17A1', pref: 'ask' }), 'bundle');
  assert.equal(decideAction({ platform: 'darwin', xcodeOk: false, cache: null, xcodeBuild: '17A1', pref: 'ask' }), 'bundle');
  assert.equal(decideAction({ platform: 'darwin', xcodeOk: true, cache: fresh, xcodeBuild: '17A1', pref: 'ask' }), 'use-cache');
  assert.equal(decideAction({ platform: 'darwin', xcodeOk: true, cache: stale, xcodeBuild: '17A1', pref: 'never' }), 'bundle');
  assert.equal(decideAction({ platform: 'darwin', xcodeOk: true, cache: stale, xcodeBuild: '17A1', pref: 'always' }), 'sync-now');
  assert.equal(decideAction({ platform: 'darwin', xcodeOk: true, cache: null, xcodeBuild: '17A1', pref: 'ask' }), 'ask');
});
