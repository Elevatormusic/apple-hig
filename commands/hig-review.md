---
description: Audit the current file/selection (or a path you pass) against Apple's Human Interface Guidelines and report violations with rule, Apple source, and a concrete fix.
argument-hint: "[file path or glob — defaults to the active file/selection]"
allowed-tools: Read, Grep, Glob, Task, Bash
---

Review UI code for Apple Human Interface Guidelines compliance.

**Target:** $ARGUMENTS
If no target is given, review the file/selection currently in focus.

**Targeted audit (`--only`):** if `$ARGUMENTS` contains `--only <subsystems>` (comma-separated row
ids from `${CLAUDE_PLUGIN_ROOT}/skills/apple-hig/references/review-router.md`, e.g.
`--only buttons,motion`), pass the flag through to the design-reviewer verbatim — it audits exactly
those router rows and loads only their rules. This is the cheap path: use it when I name specific
areas.

**Microcopy assist:** when the review includes the `microcopy` row and you have Bash, extract the
visible label strings from the target and run the deterministic checks yourself, then hand the JSON
findings to the reviewer as input alongside the target:

```
node -e "import('node:url').then(u => import(u.pathToFileURL(process.argv[1]).href)).then(m => console.log(JSON.stringify(m.runMicrocopyChecks(JSON.parse(process.argv[2])), null, 1)))" "${CLAUDE_PLUGIN_ROOT}/scripts/microcopy-checks.mjs" "[\"label one\",\"label two\"]"
```

**Fan-out (large reviews):** when the target spans many screens/components (a directory, a whole
app), dispatch **one design-reviewer per router row-group** in parallel via the Task tool — each
subagent gets the same target plus `--only <rows>` so its entire context is one subsystem — then
merge: dedupe findings by file:line, keep each finding's subsystem tag, recompute the coverage line
from the union, and emit ONE combined verdict (the strictest of the parts; every part's blind spots
carry into the combined report).

**Native JUCE descriptor?** If the target is a `native-render` descriptor JSON produced by the JUCE design
probe (a top-level `meta` + `elements`; see `references/native-juce-review.md`), do **not** dispatch the
subagent — it has no Bash and no browser for native. Instead run, with your Bash tool:

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/native-review.mjs" <path-to-descriptor.json>
```

and present its output: the measured findings (`evidence: extracted`), the **coverage ratio** (custom-painted
nodes aren't contrast-scored), and the snapshot PNG to confirm the duplicate/clip/overlap class by eye. A
native review is **advisory-pass at most — never `verified-pass`** (deterministic, not a pixel render). For
all other (source) targets:

Dispatch the **`design-reviewer`** subagent via the Task tool (`subagent_type: "design-reviewer"`) and
pass it the target path(s). That agent knows how to load the bundled guidelines and pull each rule's
Apple `source_url`. Ask it to detect the platform(s) and stack, then audit for at least: touch targets
< 44 pt (60 pt visionOS); hardcoded/non-semantic colors; missing dark-mode variants; off-grid spacing;
insufficient contrast (< 4.5:1 body / < 3:1 large); non-standard corner radii; motion that ignores
Reduce Motion; missing VoiceOver labels on icon-only controls; and hardcoded type sizes / no Dynamic
Type. It should report each issue as `[severity] rule — file:line` with **Problem**, **Fix** (corrected
snippet), and the Apple **Source** URL, grouped high → medium → low, plus a short "Looks good" list.

Relay the subagent's report. Do not modify files unless I ask you to apply the fixes.

If a Playwright/preview/browser MCP is available and the UI can actually be run, also render it and
verify visually (screenshot; check rendered contrast, spacing, dark mode, and target sizes) and include
those findings. Install it with `/plugin install playwright@claude-plugins-official` for visual checks.

If the `design-reviewer` subagent isn't available (e.g. the plugin isn't installed), fall back to
invoking the **apple-hig** skill and performing the same audit yourself using its guidelines.

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
