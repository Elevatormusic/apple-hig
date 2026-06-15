import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isGitCommit, gateEnabled } from './hig-gate.mjs';

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), 'hig-gate.mjs');

function mkRepo() {
  const dir = mkdtempSync(join(tmpdir(), 'hig-gate-test-'));
  const g = (a) => execFileSync('git', a, { cwd: dir, stdio: 'ignore' });
  g(['init', '-q']); g(['config', 'user.email', 't@t.t']); g(['config', 'user.name', 't']);
  return dir;
}
function stage(dir, name, content) {
  writeFileSync(join(dir, name), content);
  execFileSync('git', ['add', name], { cwd: dir, stdio: 'ignore' });
}
function pass(dir) { execFileSync('node', [SCRIPT, '--pass'], { cwd: dir, stdio: 'ignore' }); }
function runHook(dir, cmd, env = {}) {
  const input = JSON.stringify({ tool_name: 'Bash', tool_input: { command: cmd } });
  try {
    execFileSync('node', [SCRIPT, 'hook'], { cwd: dir, input, env: { ...process.env, ...env }, encoding: 'utf8' });
    return { code: 0, stderr: '' };
  } catch (e) { return { code: e.status, stderr: String(e.stderr || '') }; }
}
const clean = (d) => rmSync(d, { recursive: true, force: true });

test('isGitCommit recognizes commit forms only', () => {
  assert.ok(isGitCommit('git commit -m x'));
  assert.ok(isGitCommit('git -C /r commit'));
  assert.ok(isGitCommit('cd app && git commit'));
  assert.ok(!isGitCommit('git status'));
  assert.ok(!isGitCommit('git log --oneline'));
});

test('gateEnabled defaults on, off via HIG_GATE', () => {
  delete process.env.HIG_GATE; assert.equal(gateEnabled(), true);
  process.env.HIG_GATE = 'off'; assert.equal(gateEnabled(), false);
  delete process.env.HIG_GATE;
});

test('allows commit with no staged UI files', () => {
  const d = mkRepo(); stage(d, 'notes.md', '# hi');
  assert.equal(runHook(d, 'git commit -m x').code, 0); clean(d);
});

test('blocks UI commit with no marker', () => {
  const d = mkRepo(); stage(d, 'app.css', 'a{color:#fff}');
  const r = runHook(d, 'git commit -m x');
  assert.equal(r.code, 2); assert.match(r.stderr, /app\.css/); clean(d);
});

test('allows after --pass for identical staged content', () => {
  const d = mkRepo(); stage(d, 'app.css', 'a{color:#fff}'); pass(d);
  assert.equal(runHook(d, 'git commit -m x').code, 0); clean(d);
});

test('re-blocks after staged content changes', () => {
  const d = mkRepo(); stage(d, 'app.css', 'a{color:#fff}'); pass(d);
  stage(d, 'app.css', 'a{color:#000}');
  assert.equal(runHook(d, 'git commit -m x').code, 2); clean(d);
});

test('HIG_GATE=off allows blocked commit', () => {
  const d = mkRepo(); stage(d, 'app.css', 'a{}');
  assert.equal(runHook(d, 'git commit -m x', { HIG_GATE: 'off' }).code, 0); clean(d);
});

test('HIG_GATE_BYPASS=1 allows and writes bypass log', () => {
  const d = mkRepo(); stage(d, 'app.css', 'a{}');
  assert.equal(runHook(d, 'git commit -m x', { HIG_GATE_BYPASS: '1' }).code, 0);
  assert.ok(existsSync(join(tmpdir(), 'apple-hig-gate', 'bypass.log'))); clean(d);
});

test('non-commit git command is allowed', () => {
  const d = mkRepo(); stage(d, 'app.css', 'a{}');
  assert.equal(runHook(d, 'git status').code, 0); clean(d);
});

test('non-git directory fails open (allows)', () => {
  const d = mkdtempSync(join(tmpdir(), 'hig-nogit-'));
  assert.equal(runHook(d, 'git commit -m x').code, 0); clean(d);
});
