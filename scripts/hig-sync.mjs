#!/usr/bin/env node
// apple-hig local SDK bridge — see specs/2026-06-15-sdk-bridge-design.md
import { readFileSync, writeFileSync, mkdirSync, renameSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';

export const SCHEMA = 2;

export function cacheDir(env = process.env) {
  return join(env.XDG_CACHE_HOME || join(homedir(), '.cache'), 'apple-hig');
}
export function cachePath(env = process.env) {
  return join(cacheDir(env), 'live-tokens.json');
}
export function readCache(p = cachePath()) {
  try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; }
}
export function writeCache(data, p = cachePath()) {
  mkdirSync(dirname(p), { recursive: true });
  const tmp = p + '.tmp';
  writeFileSync(tmp, JSON.stringify(data, null, 2));
  renameSync(tmp, p);
  return p;
}
export function isFresh(cache, xcodeBuild) {
  return !!cache && cache.schema === SCHEMA && cache.xcodeBuild === xcodeBuild;
}
export function prefFromEnv(env = process.env) {
  const v = String(env.HIG_SDK_SYNC || 'ask').toLowerCase();
  return ['ask', 'always', 'never'].includes(v) ? v : 'ask';
}
export function isMac(platform = process.platform) {
  return platform === 'darwin';
}
export function decideAction({ platform, xcodeOk, cache, xcodeBuild, pref }) {
  if (!isMac(platform)) return 'bundle';
  if (!xcodeOk) return 'bundle';
  if (isFresh(cache, xcodeBuild)) return 'use-cache';
  if (pref === 'never') return 'bundle';
  if (pref === 'always') return 'sync-now';
  return 'ask';
}

import { execFileSync, } from 'node:child_process';
import { mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const here = () => dirname(fileURLToPath(import.meta.url));
const sh = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8' }).trim();

export function detectXcode() {
  try {
    sh('xcode-select', ['-p']);
    sh('xcrun', ['--find', 'swiftc']);
    let build = 'unknown';
    try { build = sh('xcodebuild', ['-version']).split('\n').pop().replace(/Build version/i, '').trim(); } catch {}
    let macOS = 'unknown';
    try { macOS = sh('sw_vers', ['-productVersion']); } catch {}
    return { ok: true, build, macOS };
  } catch {
    return { ok: false, reason: 'Xcode / command-line tools not found (xcode-select -p or xcrun swiftc failed)' };
  }
}

function compileProbe() {
  const arch = process.arch === 'x64' ? 'x86_64' : 'arm64';
  const target = `${arch}-apple-ios15.0-macabi`;
  const sdk = sh('xcrun', ['--sdk', 'macosx', '--show-sdk-path']);
  const out = mkdtempSync(join(tmpdir(), 'hig-probe-'));
  const bin = join(out, 'probe');
  const src = join(here(), 'sdk-probe', 'probe.swift');
  execFileSync('xcrun', ['swiftc', '-sdk', sdk, '-target', target, src, '-o', bin], { stdio: ['ignore', 'pipe', 'pipe'] });
  return bin;
}
export function runProbe(extraArgs = []) {
  const bin = compileProbe();
  return JSON.parse(execFileSync(bin, extraArgs, { encoding: 'utf8' }));
}
export function readSfSymbols() {
  const app = '/Applications/SF Symbols.app';
  if (!existsSync(app)) return { mode: 'validate-only' };
  try {
    const version = sh('defaults', ['read', join(app, 'Contents/Info'), 'CFBundleShortVersionString']);
    return { mode: 'inventory', version };
  } catch {
    return { mode: 'validate-only' };
  }
}

export function runSync() {
  if (!isMac()) { console.log('apple-hig: SDK sync is macOS-only — using the bundled reference.'); return 0; }
  const xc = detectXcode();
  if (!xc.ok) { console.log('apple-hig: ' + xc.reason + ' — using the bundled reference.'); return 0; }
  let probe;
  try { probe = runProbe(); }
  catch (e) { console.error('apple-hig: probe build/run failed — keeping any existing cache, using the bundle.\n' + String(e.message || e)); return 0; }
  const data = {
    schema: SCHEMA, generatedAt: new Date().toISOString(),
    xcodeBuild: xc.build, macOS: xc.macOS, probeTarget: 'mac-catalyst',
    sfSymbols: readSfSymbols(), colors: probe.colors, typeRamp: probe.typeRamp,
  };
  const p = writeCache(data);
  const n = Object.keys(probe.colors.system).length + Object.keys(probe.colors.semantic).length;
  console.log(`apple-hig: synced ${n} colors + ${Object.keys(probe.typeRamp).length} text styles (Xcode ${xc.build}, SF Symbols ${data.sfSymbols.version || 'n/a'}) → ${p}`);
  return 0;
}
export function runCheck(names) {
  if (!isMac()) { console.log(JSON.stringify({ error: 'macOS-only' })); return 0; }
  const xc = detectXcode();
  if (!xc.ok) { console.log(JSON.stringify({ error: xc.reason })); return 0; }
  console.log(JSON.stringify(runProbe(['--check', ...names])));
  return 0;
}
export function runStatus() {
  const platform = process.platform;
  const xc = isMac(platform) ? detectXcode() : { ok: false, reason: 'not macOS' };
  const cache = readCache();
  const cacheState = !cache ? 'missing' : (isFresh(cache, xc.build) ? 'fresh' : 'stale');
  const action = decideAction({ platform, xcodeOk: xc.ok, cache, xcodeBuild: xc.build, pref: prefFromEnv() });
  console.log(JSON.stringify({ platform, supported: isMac(platform), xcode: xc, cache: cacheState, action, cachePath: cachePath() }, null, 2));
  return 0;
}

function isMainModule() {
  try { return fileURLToPath(import.meta.url) === process.argv[1]; } catch { return false; }
}
if (isMainModule()) {
  const [mode, ...rest] = process.argv.slice(2);
  if (mode === '--check') process.exit(runCheck(rest));
  else if (mode === '--status') process.exit(runStatus());
  else process.exit(runSync());
}
