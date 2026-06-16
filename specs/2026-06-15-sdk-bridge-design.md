# Local SDK bridge — design

- **Date:** 2026-06-15
- **Status:** approved (pending spec review)
- **Component:** `apple-hig` plugin

## Goal

On **macOS with Xcode**, let the plugin read **authoritative, current** Apple design values from the
user's own installed SDK and prefer them over the static bundled reference — fixing the value-drift
the HIG audit surfaced, since Apple ships no official design-data API. The static bundle stays the
**universal baseline** so Windows/Linux/no-Xcode users are unaffected.

## Non-goals

- Replacing the static bundle. It remains the default and the offline fallback everywhere.
- Bundling/redistributing any Apple asset. The probe runs the user's own SDK (license-safe).
- Pulling values the SDK does not expose at runtime (control-size minimums, the 8 pt spacing rhythm,
  corner radii). Those are Apple-doc values and **stay bundled** — the bridge never guesses them.
- iOS-Simulator-accurate rendering. We use Mac Catalyst (see Decisions); values are very close but not
  a pure on-device render. Documented caveat.

## Decisions (from brainstorming)

| Decision | Choice |
|---|---|
| Scope | **Full token sync**, limited to families the SDK can answer at runtime (colors, Dynamic Type ramp) + **SF Symbols** (inventory if the SF Symbols app is present, else existence-validation) |
| Probe mechanism | **Mac Catalyst native probe** via `xcrun swiftc` (fast, no simulator) |
| Invocation | **Consent-prompted at point of need** + manual `/hig-sync` + remembered preference `HIG_SDK_SYNC=ask\|always\|never` (default `ask`) |
| Cache location | `~/.cache/apple-hig/live-tokens.json` (user dir, never the repo) |
| Supersede mechanism | Instruction-level: token-using flows prefer the cache when fresh; no loader rewrite |

## Honest scope — what syncs vs. stays bundled

- **Synced (runtime-authoritative):** system + semantic **colors** (light/dark hex), the **Dynamic
  Type ramp** (size/leading/weight per text style).
- **SF Symbols:** if **SF Symbols.app** is installed, read its bundled metadata for the full inventory
  + per-OS availability; otherwise the probe **validates specific names** on demand
  (`UIImage(systemName:) != nil`) — there is no public API to enumerate all symbols at runtime.
- **Always bundled (not runtime-exposed):** control-size minimums (44/60/28 pt), spacing rhythm,
  corner radii, contrast minimums, device sizes. The cache does not touch these.

## Architecture

Five units with clear boundaries.

### 1. `scripts/sdk-probe/probe.swift` — the probe

A standalone Swift source compiled+run via `xcrun swiftc -sdk macosx -target
arm64-apple-ios<ver>-macabi probe.swift -o <tmp>/probe` (Mac Catalyst → UIKit on macOS). It prints a
single JSON object to stdout:

- `colors.system` / `colors.semantic`: each token resolved under a light and a dark
  `UITraitCollection`, formatted as `#RRGGBB` (or `#RRGGBBAA` when alpha < 1).
- `typeRamp`: for each `UIFont.TextStyle`, `UIFont.preferredFont(forTextStyle:)` at the default
  content size → `{ size, leading, weight }`.
- `sfSymbolsVersion`: the SF Symbols framework version available to this SDK.
- `validate` mode (`probe --check <name> <name> …`): prints `{name: bool}` for existence checks.

The probe imports `UIKit`; it never writes files (the runner owns I/O) and exits non-zero with a
stderr message on failure.

### 2. `scripts/hig-sync.mjs` — the runner (Node, mirrors `install-rules.mjs`)

1. **Preflight:** confirm `process.platform === 'darwin'`, then `xcode-select -p` and `xcrun --find
   swiftc` succeed. On any miss → print a one-line reason and exit 0 (no-op; bundle stays in use).
2. **Build + run:** compile `probe.swift` to a temp binary via `xcrun swiftc …`, run it, capture JSON.
3. **SF Symbols inventory (best-effort):** if `/Applications/SF Symbols.app` exists, read its bundled
   symbol metadata for the name list + availability; else record `sfSymbols: {mode: "validate-only"}`.
4. **Write cache:** `~/.cache/apple-hig/live-tokens.json` with the values + metadata
   `{ schema, generatedAt, xcodeBuild, macOS, probeTarget }`. Atomic write (temp + rename).
5. **Modes:** `hig-sync` (full sync), `hig-sync --check <names…>` (symbol validation via the probe),
   `hig-sync --status` (print cache freshness/metadata).
6. **Fail soft:** any compile/run error → warn to stderr, leave any existing cache intact, exit 0.

### 3. `commands/hig-sync.md` — the command

`/hig-sync` runs the runner and reports what was pulled (counts + Xcode/OS/SF-Symbols versions) or why
it was skipped. `allowed-tools: Bash, Read`.

### 4. Consumption / supersede (instruction-level, no loader changes)

- `references/design-tokens.md` gains a top banner: *"If `~/.cache/apple-hig/live-tokens.json` exists
  and `schema` matches, prefer its `colors`/`typeRamp` over the tables below; everything else here is
  authoritative."*
- `/hig-tokens` checks the cache first and emits from it when present, else from the bundle, and says
  which source it used.
- `design-reviewer` / `SKILL.md`: when validating SF Symbol names on macOS, prefer
  `hig-sync --check`; note when a name is unavailable in the installed SF Symbols version.

### 5. Consent + remembered preference

Token-using flows (`/hig-tokens`, `/hig-review`, the skill pulling values) follow: **if** macOS +
Xcode **and** the cache is missing or stale (different `xcodeBuild`) **and** `HIG_SDK_SYNC !==
'never'` → when `=always` run `/hig-sync` automatically, otherwise **ask the user** ("pull live values
from your SDK? compiles a small probe, ~1–2 s"); on decline or any non-Mac/no-Xcode case, use the
bundle. The chosen value of `HIG_SDK_SYNC` (env) is honored on every run so the user isn't re-prompted.

## Data flow

```
need tokens
  └─ read ~/.cache/apple-hig/live-tokens.json
       fresh (schema ok, xcodeBuild matches)        → use cache colors/typeRamp
       missing/stale + darwin + xcode + sync≠never  → always: run sync; ask: prompt → yes → /hig-sync → cache → use
                                                                                       → no  → bundle
       not-darwin / no-xcode / probe failed / declined → use bundle (state why)
```

## Error handling

- Not macOS / no Xcode / no `swiftc` → no-op, bundle, one-line note (not an error).
- Compile or run failure → warn, keep prior cache, fall back to bundle; never block the calling flow.
- Corrupt/old-`schema` cache → ignored (treated as missing), re-sync offered.
- SF Symbols.app absent → `validate-only` mode; inventory features degrade to per-name checks.

## Caveats (document in README)

- macOS + Xcode only; everyone else keeps the static bundle.
- Mac Catalyst-resolved iOS values are very close but not a pure on-device iOS render.
- Only colors / type ramp / SF-Symbol data are synced; doc-only values stay bundled.
- The probe compiles and runs code against the user's SDK (their own toolchain) — consent-gated and
  transparent.

## Testing

- **Runner (`hig-sync.test.mjs`, runs anywhere incl. Windows):** non-darwin → no-op + bundle path;
  missing-tool detection; cache write/read + atomicity; staleness (xcodeBuild mismatch → stale);
  `HIG_SDK_SYNC=never` short-circuits; corrupt cache treated as missing.
- **Probe (macOS-gated):** compile+run on a Mac (or CI macOS runner), assert JSON shape, spot-check a
  known anchor (e.g. `systemBlue` light ≈ `#007AFF`), and `--check` on a known-good + known-bad name.
- **Note:** the probe can't be validated on the maintainer's Windows box — gate it behind
  `process.platform === 'darwin'` and run it in macOS CI.

## Files changed

- `scripts/sdk-probe/probe.swift` (new), `scripts/hig-sync.mjs` (new), `scripts/hig-sync.test.mjs` (new)
- `commands/hig-sync.md` (new)
- `commands/hig-tokens.md`, `agents/design-reviewer.md`, `skills/apple-hig/SKILL.md`,
  `skills/apple-hig/references/design-tokens.md` (consume/prefer the cache)
- `package.json` (add `hig-sync` script/bin + the test), version bump `1.1.0 → 1.2.0` in
  `plugin.json` / `marketplace.json` / `package.json`
- `README.md` (document the bridge + `HIG_SDK_SYNC`)
