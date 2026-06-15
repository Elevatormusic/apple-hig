#!/usr/bin/env node
// apple-hig commit gate — see specs/2026-06-14-mandatory-hig-gate-design.md
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, appendFileSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_EXT = ['.tsx','.jsx','.ts','.js','.vue','.svelte','.html','.htm','.css','.scss',
  '.sass','.less','.swift','.kt','.java','.xml','.storyboard','.xib'];

function uiExtensions() {
  const env = process.env.HIG_GATE_EXT;
  if (!env) return DEFAULT_EXT;
  return env.split(',').map(s => s.trim()).filter(Boolean).map(s => s.startsWith('.') ? s : '.' + s);
}
function isTruthy(v) {
  return v !== undefined && !['', '0', 'false', 'no', 'off'].includes(String(v).toLowerCase());
}
export function gateEnabled() {
  const v = process.env.HIG_GATE;
  if (v === undefined) return true;
  return !['0', 'false', 'no', 'off'].includes(String(v).toLowerCase());
}
export function isGitCommit(cmd) {
  if (typeof cmd !== 'string') return false;
  return /\bgit\b(?:\s+-C\s+\S+)?(?:\s+-[-\w]+(?:=\S+)?)*\s+commit\b/.test(cmd);
}
function git(args, cwd) {
  return execFileSync('git', args, { cwd, encoding: 'buffer', stdio: ['ignore', 'pipe', 'ignore'] });
}
function repoTop(cwd) {
  try { return git(['rev-parse', '--show-toplevel'], cwd).toString('utf8').trim(); } catch { return null; }
}
export function stagedUiFiles(cwd) {
  let out;
  try { out = git(['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z'], cwd); } catch { return []; }
  const exts = uiExtensions();
  return out.toString('utf8').split('\0').filter(Boolean)
    .filter(f => exts.some(e => f.toLowerCase().endsWith(e)));
}
export function stagedHash(cwd, files) {
  if (!files || files.length === 0) return null;
  const out = git(['ls-files', '-s', '-z', '--', ...files], cwd);
  return createHash('sha256').update(out).digest('hex');
}
function markerDir() { return join(tmpdir(), 'apple-hig-gate'); }
function markerPath(top) { return join(markerDir(), createHash('sha256').update(top).digest('hex') + '.json'); }
function readMarker(top) { try { return JSON.parse(readFileSync(markerPath(top), 'utf8')); } catch { return null; } }
function writeMarker(top, hash, files) {
  mkdirSync(markerDir(), { recursive: true });
  const data = { hash, verdict: 'pass', high: 0, files, ts: new Date().toISOString() };
  writeFileSync(markerPath(top), JSON.stringify(data, null, 2));
  return data;
}
function logBypass(cmd, top) {
  try {
    mkdirSync(markerDir(), { recursive: true });
    appendFileSync(join(markerDir(), 'bypass.log'),
      `${new Date().toISOString()}\t${top || '?'}\t${String(cmd || '').replace(/\s+/g, ' ').slice(0, 200)}\n`);
  } catch { /* logging must never block */ }
}
async function readStdin() {
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  return Buffer.concat(chunks).toString('utf8');
}
const allow = () => process.exit(0);
function block(lines) { process.stderr.write(lines + '\n'); process.exit(2); }

async function runHook() {
  let payload = {};
  try { payload = JSON.parse((await readStdin()) || '{}'); } catch { allow(); }
  const cmd = payload?.tool_input?.command ?? '';
  if (!isGitCommit(cmd)) allow();
  if (!gateEnabled()) allow();
  if (isTruthy(process.env.HIG_GATE_BYPASS)) { logBypass(cmd, repoTop(process.cwd())); allow(); }
  const top = repoTop(process.cwd());
  if (!top) { process.stderr.write('apple-hig gate: not a git repo / git unavailable — skipping.\n'); allow(); }
  const files = stagedUiFiles(process.cwd());
  if (files.length === 0) allow();
  let hash;
  try { hash = stagedHash(process.cwd(), files); }
  catch { process.stderr.write('apple-hig gate: could not hash staged files — skipping.\n'); allow(); }
  const marker = readMarker(top);
  if (marker && marker.verdict === 'pass' && marker.hash === hash) allow();
  block(
    '\u{1F534} apple-hig gate: this commit stages UI changes with no passing HIG review:\n' +
    files.map(f => '   - ' + f).join('\n') + '\n' +
    'Run `/hig-review --staged` — on a pass (no high-severity issues) it records approval, then retry the commit.\n' +
    'Emergency bypass: HIG_GATE_BYPASS=1 (logged). Disable entirely: HIG_GATE=off.'
  );
}
function runHash(cwd) {
  const files = stagedUiFiles(cwd);
  process.stdout.write(JSON.stringify({ files, hash: stagedHash(cwd, files) }) + '\n');
}
function runPass(cwd) {
  const top = repoTop(cwd);
  if (!top) { process.stderr.write('apple-hig gate: not a git repo.\n'); process.exit(1); }
  const files = stagedUiFiles(cwd);
  if (files.length === 0) { process.stdout.write('apple-hig gate: no staged UI files; nothing to approve.\n'); process.exit(0); }
  const data = writeMarker(top, stagedHash(cwd, files), files);
  process.stdout.write(`apple-hig gate: recorded PASS for ${files.length} UI file(s) (${data.hash.slice(0, 12)}…).\n`);
}
function runStatus(cwd) {
  const top = repoTop(cwd);
  const files = stagedUiFiles(cwd);
  const hash = stagedHash(cwd, files);
  const marker = top ? readMarker(top) : null;
  const valid = !!(marker && marker.verdict === 'pass' && marker.hash === hash);
  process.stdout.write(JSON.stringify({ repo: top, uiFiles: files, hash, hasValidPass: valid }, null, 2) + '\n');
}
function isMainModule() {
  try { return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url)); }
  catch { return false; }
}
if (isMainModule()) {
  const mode = process.argv[2] || 'hook';
  if (mode === 'hook') runHook();
  else if (mode === '--hash') runHash(process.cwd());
  else if (mode === '--pass') runPass(process.cwd());
  else if (mode === '--status') runStatus(process.cwd());
  else { process.stderr.write(`apple-hig gate: unknown mode "${mode}"\n`); process.exit(1); }
}
