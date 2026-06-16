#!/usr/bin/env node
// apple-hig local SDK bridge — see specs/2026-06-15-sdk-bridge-design.md
import { readFileSync, writeFileSync, mkdirSync, renameSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';

export const SCHEMA = 1;

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
