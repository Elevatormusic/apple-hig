#!/usr/bin/env node
// apple-hig: SessionStart "out of date" notifier.
// Compares the installed version against the latest on GitHub and prints a one-line
// nudge if you're behind. Fail-silent (offline/timeout/error => nothing), and cached
// ~once/day so it isn't a network hit every session. No telemetry — a single GET for
// the published version number, nothing is sent. Disable with HIG_UPDATE_CHECK=off.
import https from 'node:https';
import { readFileSync, writeFileSync, mkdirSync, realpathSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const REMOTE = 'https://raw.githubusercontent.com/Elevatormusic/apple-hig/main/.claude-plugin/plugin.json';
const CACHE = join(tmpdir(), 'apple-hig-update.json');
const TTL = 24 * 60 * 60 * 1000; // re-check at most once a day

export function isOlder(a, b) {
  const pa = String(a).split('.').map((n) => parseInt(n, 10) || 0);
  const pb = String(b).split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) { const x = pa[i] || 0, y = pb[i] || 0; if (x < y) return true; if (x > y) return false; }
  return false;
}
export function enabled() {
  const v = process.env.HIG_UPDATE_CHECK;
  return v === undefined || !['0', 'false', 'no', 'off'].includes(String(v).toLowerCase());
}
function localVersion() {
  try {
    const here = dirname(fileURLToPath(import.meta.url)); // <root>/hooks
    return JSON.parse(readFileSync(join(here, '..', '.claude-plugin', 'plugin.json'), 'utf8')).version;
  } catch { return null; }
}
function readCache() { try { return JSON.parse(readFileSync(CACHE, 'utf8')); } catch { return null; } }
function writeCache(latest) {
  try { mkdirSync(dirname(CACHE), { recursive: true }); writeFileSync(CACHE, JSON.stringify({ ts: Date.now(), latest })); } catch { /* ignore */ }
}
function fetchVersion() {
  return new Promise((res) => {
    let done = false; const fin = (v) => { if (!done) { done = true; res(v); } };
    const req = https.get(REMOTE, { headers: { 'User-Agent': 'apple-hig-update-check' } }, (r) => {
      if (r.statusCode !== 200) { r.resume(); return fin(null); }
      let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => { try { fin(JSON.parse(d).version); } catch { fin(null); } });
    });
    req.on('error', () => fin(null));
    req.setTimeout(2000, () => { req.destroy(); fin(null); });
  });
}
async function run() {
  if (!enabled()) return;
  const local = localVersion();
  if (!local) return;
  const cached = readCache();
  let latest = cached && cached.ts && (Date.now() - cached.ts) < TTL ? cached.latest : null;
  if (!latest) { latest = await fetchVersion(); if (latest) writeCache(latest); }
  if (latest && isOlder(local, latest)) {
    process.stdout.write(`apple-hig ${latest} is available (installed ${local}). Update: claude plugin update apple-hig@apple-hig\n`);
  }
}
function isMain() { try { return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url)); } catch { return false; } }
if (isMain()) run().finally(() => process.exit(0));
