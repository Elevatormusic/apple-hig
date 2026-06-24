# apple-hig v2 — Phase 1: Repository Integrity (CI + consistency)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or
> superpowers:executing-plans. Part of `2026-06-17-v2-audit-response-program.md`. Do Phase 0 first.

**Goal:** No merge can bypass core validation. Add a required, repository-wide CI workflow plus the
node-based validators it runs, so the Phase-0 corrections (and everything after) can't silently regress.

**Architecture:** Small dependency-free node validators (corpus links/provenance, version consistency,
manifest shape) + the Phase-0 consistency tests, all run by one `ci.yml` on every PR and push, on
Linux/macOS/Windows. `claude plugin validate --strict` runs best-effort; a node manifest validator is
the required gate so CI never depends on the CLI being installable.

**Tech stack:** Node ESM, `node:test`, GitHub Actions (`checkout@v6`, `setup-node@v6`, Node 22).

---

### Task 1.1: Version-consistency guard (P2-03)

**Files:** Test `test/version-consistency.test.mjs` (create).

- [ ] **Step 1:** Write the guard test:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const root = new URL('../', import.meta.url);
const J = (p) => JSON.parse(readFileSync(new URL(p, root), 'utf8'));

test('every manifest + README agree on the version', () => {
  const v = J('package.json').version;
  assert.equal(J('.claude-plugin/plugin.json').version, v, 'plugin.json');
  const mk = J('.claude-plugin/marketplace.json');
  assert.equal(mk.metadata.version, v, 'marketplace.metadata.version');
  assert.equal(mk.plugins[0].version, v, 'marketplace.plugins[0].version');
  assert.match(readFileSync(new URL('README.md', root), 'utf8'),
    new RegExp(`Apple HIG \\(apple-hig\\) ${v.replace(/\./g, '\\.')}`), 'README version string');
});
```
- [ ] **Step 2:** Run `node --test test/version-consistency.test.mjs` → expect PASS (all are currently equal).
- [ ] **Step 3:** Prove it bites: temporarily edit `package.json` version to `9.9.9`, re-run → expect FAIL; revert → PASS.
- [ ] **Step 4: Commit** — `git commit -am "test: guard version consistency across manifests + README (P2-03)"`

---

### Task 1.2: Corpus link + provenance validator (P2-05, P2-06 seed)

**Files:** Create `scripts/validate-corpus.mjs`; Test `test/validate-corpus.test.mjs`.

- [ ] **Step 1:** Write a failing test that requires a clean corpus:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { brokenLinks, missingProvenance } from '../scripts/validate-corpus.mjs';
test('no broken relative/wiki links in the corpus', async () => {
  assert.deepEqual(await brokenLinks(), []);
});
test('every guideline file declares a source_url', async () => {
  assert.deepEqual(await missingProvenance(), []);
});
```
- [ ] **Step 2:** Run → FAIL (module missing).
- [ ] **Step 3:** Implement `scripts/validate-corpus.mjs` exporting:
  - `brokenLinks()` — walk `skills/apple-hig/**/*.md`; for each relative `[text](path)` link, assert the
    target file exists; for each `[[slug]]` wiki link, assert a file whose name matches `slug` exists in
    the corpus (else collect `{file, link}`).
  - `missingProvenance()` — assert every file under `guidelines/` contains a `source_url:` (front-matter
    or inline) and a `last_verified`/`verify on Apple` marker; collect offenders.
  Add a `--ci` main block that prints offenders and `process.exit(1)` if any.
- [ ] **Step 4:** Run the test. Fix any genuine broken links/missing provenance the validator surfaces
  (these are real corpus bugs to repair, one commit each). Re-run → PASS.
- [ ] **Step 5: Commit** — `git commit -am "feat(ci): corpus link + provenance validator (P2-05/06)"`

---

### Task 1.3: Manifest shape + command-inventory validator (P0-08 enforcement)

**Files:** Create `scripts/validate-manifests.mjs`; Test `test/validate-manifests.test.mjs`.
(Reuses `test/command-docs.test.mjs` from Phase 0 for the doc side.)

- [ ] **Step 1:** Failing test asserting `validate-manifests.mjs` reports a clean repo:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { problems } from '../scripts/validate-manifests.mjs';
test('manifests are well-formed and the command set is consistent', async () => {
  assert.deepEqual(await problems(), []);
});
```
- [ ] **Step 2:** Run → FAIL (module missing).
- [ ] **Step 3:** Implement `problems()`: parse the three JSON manifests (valid JSON, required keys
  `name/version/description`); read `commands/*.md`; assert each command is referenced in README and
  `docs/index.html`; assert `marketplace.json` plugin `name` matches `plugin.json` name. Add a `--ci` main.
- [ ] **Step 4:** Run → fix anything real → PASS. **Step 5: Commit** — `git commit -am "feat(ci): manifest + command-inventory validator (P0-08)"`

---

### Task 1.4: The repository-wide CI workflow (P0-10)

**Files:** Create `.github/workflows/ci.yml`.

- [ ] **Step 1:** Author the workflow:
```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]
    paths-ignore: ['docs/loc.svg']
permissions:
  contents: read
jobs:
  unit:
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with: { node-version: '22' }
      - run: node --test
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with: { node-version: '22' }
      - name: Node validators (required)
        run: |
          node scripts/validate-manifests.mjs --ci
          node scripts/validate-corpus.mjs --ci
          node scripts/loc-graph.mjs --check
      - name: claude plugin validate (best-effort)
        continue-on-error: true
        run: |
          npm i -g @anthropic-ai/claude-code || exit 0
          claude plugin validate ./ --strict || true
```
- [ ] **Step 2:** Validate YAML locally: `python -c "import yaml;yaml.safe_load(open('.github/workflows/ci.yml'))"`.
- [ ] **Step 3:** Run the required commands locally exactly as CI will, expecting clean exits:
  `node --test && node scripts/validate-manifests.mjs --ci && node scripts/validate-corpus.mjs --ci && node scripts/loc-graph.mjs --check`
- [ ] **Step 4: Commit + push** — `git commit -am "ci: repository-wide CI (tests + validators) on every PR/push (P0-10)"` then push and confirm the run is green on all three OSes.

---

### Task 1.5: Require the checks (branch protection) — maintainer action

**Files:** none (GitHub setting). This step cannot be done from the repo; it is a documented handoff.

- [ ] In repo Settings → Branches → add a rule for `main`: require the `unit` (×3 OS) and `validate`
  checks to pass before merge; require branches up to date. Record this in `CONTRIBUTING.md` (create a
  short one if absent) so the requirement is discoverable. **Exit:** a red CI blocks merge to `main`.

---

## Phase 1 self-review checklist

- [ ] `node --test` green locally on the dev machine; CI green on Linux/macOS/Windows.
- [ ] `validate-manifests.mjs --ci`, `validate-corpus.mjs --ci`, `loc-graph.mjs --check` all exit 0.
- [ ] Introducing a deliberate broken link / version mismatch makes CI red (spot-check once).
- [ ] No new runtime dependency in the plugin (validators are dependency-free; `claude` install is best-effort only).

## Execution handoff

**1. Subagent-Driven (recommended)** · **2. Inline.** After Phase 1 is green and required, author and
execute Phase 2 (Reviewer v2) and Phase 3 (gate hardening) from the master plan's task-level specs.
(Dispatched subagents use the Opus tier, per maintainer preference.)
