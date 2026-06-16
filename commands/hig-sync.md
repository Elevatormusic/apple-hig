---
description: Sync authoritative Apple design tokens (colors, Dynamic Type) from the local Xcode SDK into a cache the plugin prefers over the bundled values. macOS + Xcode only.
allowed-tools: Bash, Read
---

Pull live design values from the user's installed SDK.

Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/hig-sync.mjs"`. It is a no-op (and says so) on anything other
than macOS with Xcode — there the bundled reference stays in use.

On success it writes `~/.cache/apple-hig/live-tokens.json` (colors + Dynamic Type ramp, resolved from
the SDK via a Mac Catalyst probe) and prints what it pulled. Relay that summary.

- To check whether a sync is warranted first: `node "${CLAUDE_PLUGIN_ROOT}/scripts/hig-sync.mjs" --status`.
- To validate specific SF Symbol names against the installed SF Symbols: `--check <name> <name> …`.

After a successful sync, `/hig-tokens` and HIG reviews will prefer the cached values automatically.
