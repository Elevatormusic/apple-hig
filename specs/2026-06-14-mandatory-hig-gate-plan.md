# Mandatory HIG Gate — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Block UI-touching `git commit`s run by Claude until a passing HIG review is recorded against the exact staged content.

**Architecture:** One cross-platform Node script (`hooks/hig-gate.mjs`) is both the `PreToolUse` gate and the marker tool (`--hash`/`--pass`/`--status`). `/hig-review --staged` reviews staged UI files and, on a pass, calls `--pass` to write a temp-dir marker keyed to a SHA-256 of the staged blobs. The hook allows a commit only when a matching pass marker exists.

**Tech Stack:** Node ≥18 (built-in `node:test`, `node:crypto`, `node:child_process`), git, Claude Code plugin hooks.

> **Plan location note:** saved under `specs/` (not the skill default `docs/...`) because this repo's `docs/` is the published GitHub Pages site.

---

### Task 1: `hig-gate.mjs` — gate engine + tests

**Files:**
- Create: `hooks/hig-gate.mjs`
- Create: `hooks/hig-gate.test.mjs`

- [ ] **Step 1: Write the failing tests**

Create `hooks/hig-gate.test.mjs`:

```js
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test hooks/hig-gate.test.mjs`
Expected: FAIL — `Cannot find module ... hig-gate.mjs` (script not created yet).

- [ ] **Step 3: Implement `hooks/hig-gate.mjs`**

Create `hooks/hig-gate.mjs`:

```js
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test hooks/hig-gate.test.mjs`
Expected: PASS — all 10 tests green.

- [ ] **Step 5: Commit**

```bash
git add hooks/hig-gate.mjs hooks/hig-gate.test.mjs
git commit -m "feat(gate): add hig-gate engine (hook/--hash/--pass/--status) + tests"
```

---

### Task 2: Add `test` script and dev engine note

**Files:**
- Modify: `package.json:15-17` (scripts block)

- [ ] **Step 1: Add the test script**

In `package.json`, change the `"scripts"` block from:

```json
  "scripts": {
    "install-rules": "node scripts/install-rules.mjs"
  },
```
to:
```json
  "scripts": {
    "install-rules": "node scripts/install-rules.mjs",
    "test": "node --test hooks/"
  },
```

- [ ] **Step 2: Run it**

Run: `npm test`
Expected: PASS — runs `hooks/hig-gate.test.mjs`, all green.

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "chore: add npm test script for the gate"
```

---

### Task 3: Wire the `PreToolUse` hook

**Files:**
- Modify: `hooks/hooks.json`

- [ ] **Step 1: Add the PreToolUse → Bash entry**

Replace the entire contents of `hooks/hooks.json` with:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "echo apple-hig ready - the skill guides Apple HIG design and the /hig-review command audits a file"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/hooks/hig-gate.mjs\" hook"
          }
        ]
      }
    ]
  }
}
```

- [ ] **Step 2: Verify the wiring shape against a real payload**

Run (simulates what Claude Code pipes to the hook, from a repo with a staged `.css`):
```bash
printf '{"tool_name":"Bash","tool_input":{"command":"git commit -m x"}}' | node hooks/hig-gate.mjs hook; echo "exit=$?"
```
Expected: prints the 🔴 block message and `exit=2` when a UI file is staged without a marker (or `exit=0` if none staged). End-to-end firing inside Claude requires `claude plugin update apple-hig@apple-hig` + restart — note this; do not block the plan on it.

- [ ] **Step 3: Commit**

```bash
git add hooks/hooks.json
git commit -m "feat(gate): register PreToolUse hook on Bash"
```

---

### Task 4: `/hig-review --staged` mode

**Files:**
- Modify: `commands/hig-review.md`

- [ ] **Step 1: Allow Bash and document the staged mode**

In `commands/hig-review.md` front matter, change:
```
allowed-tools: Read, Grep, Glob, Task
```
to:
```
allowed-tools: Read, Grep, Glob, Task, Bash
```

- [ ] **Step 2: Append the `--staged` section**

Add this section to the end of `commands/hig-review.md`:

```markdown
## Staged mode (`--staged`) — used by the commit gate

When `$ARGUMENTS` contains `--staged`, this is the gate's review path:

1. Resolve the staged UI files and their content hash:
   `node "${CLAUDE_PLUGIN_ROOT}/hooks/hig-gate.mjs" --hash`
   (prints `{"files":[…],"hash":"…"}`). If `files` is empty, report "no staged UI changes" and stop.
2. Dispatch the **`design-reviewer`** subagent on exactly those files. It reviews and reports only —
   it does not write the marker.
3. Read the agent's final `HIG-VERDICT:` line. **Pass = `high=0`** (zero 🔴 high-severity findings).
   Medium/low findings are shown to me but do not block.
4. **On pass**, record approval so the commit can proceed:
   `node "${CLAUDE_PLUGIN_ROOT}/hooks/hig-gate.mjs" --pass`
   then tell me the commit is cleared. **On fail**, show the findings and write nothing — the commit
   stays blocked until the issues are fixed, re-staged, and re-reviewed.
```

- [ ] **Step 3: Verify (manual read-through)**

Run: `node hooks/hig-gate.mjs --hash` in a repo with a staged `.css`.
Expected: JSON with the file and a 64-char hash — confirming the command's step-1 contract works.

- [ ] **Step 4: Commit**

```bash
git add commands/hig-review.md
git commit -m "feat(gate): add /hig-review --staged mode that records the pass marker"
```

---

### Task 5: `design-reviewer` machine verdict line

**Files:**
- Modify: `agents/design-reviewer.md:97-99` (end of Output format)

- [ ] **Step 1: Add the verdict line to the output contract**

In `agents/design-reviewer.md`, immediately after the "Looks good:" paragraph (the file's final paragraph), append:

```markdown

Finally, emit one machine-readable line as the **last line** of your report, so tools can parse the
result deterministically:

`HIG-VERDICT: pass|fail (high=<n> medium=<n> low=<n>)`

Use **pass** only when `high=0` (no 🔴 high-severity violations); otherwise **fail**.
```

- [ ] **Step 2: Commit**

```bash
git add agents/design-reviewer.md
git commit -m "feat(gate): design-reviewer emits parseable HIG-VERDICT line"
```

---

### Task 6: Document the gate in the README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add a "Mandatory review gate" section**

Add this section to `README.md` (after the commands/usage section):

```markdown
## Mandatory review gate

Installing apple-hig turns on a commit gate: when Claude Code runs a `git commit` that stages **UI
files** (`.tsx .jsx .ts .js .vue .svelte .html .css .swift .kt …`), the commit is **blocked** until a
HIG review passes. Run `/hig-review --staged`; if it finds no 🔴 high-severity issues it records
approval (a content-hash marker), and the retried commit goes through. Editing the staged files
invalidates the marker, so you can't review once and then change the code.

**Scope & limits**
- Only intercepts commits Claude runs in-session (not terminal/IDE commits).
- "Pass" is judged by the `design-reviewer` agent, not a formal proof.

**Switches**
- `HIG_GATE=off` — disable the gate entirely.
- `HIG_GATE_BYPASS=1` — allow a single blocked commit (appended to a bypass log).
- `HIG_GATE_EXT=".tsx,.css,…"` — override the UI file extensions that trigger the gate.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: document the mandatory HIG review gate and its switches"
```

---

### Task 7: Version bump

**Files:**
- Modify: `.claude-plugin/plugin.json` (`"version"`)
- Modify: `.claude-plugin/marketplace.json` (plugin `version`)
- Modify: `package.json:3` (`"version"`)

- [ ] **Step 1: Bump all three to `1.1.0`**

Set `"version": "1.1.0"` in `.claude-plugin/plugin.json`, the apple-hig entry in
`.claude-plugin/marketplace.json`, and `package.json`. (Minor bump: new backward-compatible feature.)

- [ ] **Step 2: Validate the plugin**

Run (from the repo's PARENT directory): `claude plugin validate ./apple-hig`
Expected: validates without errors.

- [ ] **Step 3: Commit**

```bash
git add .claude-plugin/plugin.json .claude-plugin/marketplace.json package.json
git commit -m "chore: release 1.1.0 — mandatory HIG review gate"
```

---

## Self-Review

**Spec coverage:** hook engine + modes (Task 1) ✓; PreToolUse wiring (Task 3) ✓; `--staged` + marker write (Task 4) ✓; HIG-VERDICT (Task 5) ✓; on-by-default / `HIG_GATE` off / `HIG_GATE_BYPASS` / fail-open (Task 1 code + Task 6 docs) ✓; content-hash marker in tmp dir (Task 1) ✓; pass = high=0 (Tasks 4–5) ✓; commit-only, no push gate (scope honored) ✓; version bump (Task 7) ✓.

**Placeholder scan:** none — every code/edit step shows complete content.

**Type/name consistency:** `isGitCommit`, `gateEnabled`, `stagedUiFiles`, `stagedHash` exported and used identically in tests; modes `hook/--hash/--pass/--status` match across hooks.json, the command, and the dispatcher; marker shape `{hash,verdict,high,files,ts}` written by `--pass` and checked by `hook`.

**Known gaps (documented, by design):** `git commit --amend` with nothing staged isn't gated; aliases/scripts wrapping commit aren't detected; terminal/IDE commits aren't intercepted.
