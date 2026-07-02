---
description: Emit Apple HIG design tokens (system colors light/dark, the iOS type ramp, spacing, corner radii, control sizes, contrast) in a chosen format.
argument-hint: "css | tailwind | json | swiftui | react-native"
allowed-tools: Read
---

Output Apple HIG design tokens in the requested format.

**Format requested:** $ARGUMENTS  (one of: `css`, `tailwind`, `json`, `swiftui`, `react-native`. If
omitted or unclear, ask which format.)

Use the **authoritative values below** as the single source of truth. Do **not** use design-token
values from memory — the system palette changed again for iOS/iPadOS **27** (e.g. `systemBlue` is
now `#0088FF`/`#0091FF`, `systemTeal` is `#00C3D0`/`#00D2E0`). Emit a short header comment noting these are the iOS reference
set, version-dependent (Liquid Glass / 26→27 generation), and that code should prefer the platform's
**semantic** colors over raw hex. Then emit ONLY the tokens block in the requested format.

## Authoritative tokens (iOS reference set)

System colors — `name: light → dark`:
blue `#0088FF`→`#0091FF` · cyan `#00C0E8`→`#3CD3FE` · green `#34C759`→`#30D158` ·
indigo `#6155F5`→`#6D7CFF` · mint `#00C8B3`→`#00DAC3` · orange `#FF8D28`→`#FF9230` ·
pink `#FF2D55`→`#FF375F` · purple `#CB30E0`→`#DB34F2` · red `#FF383C`→`#FF4245` ·
teal `#00C3D0`→`#00D2E0` · yellow `#FFCC00`→`#FFD600` · brown `#AC7F5E`→`#B78A66` ·
gray `#8E8E93`→`#8E8E93` · gray2 `#AEAEB2`→`#636366` · gray3 `#C7C7CC`→`#48484A` ·
gray4 `#D1D1D6`→`#3A3A3C` · gray5 `#E5E5EA`→`#2C2C2E` · gray6 `#F2F2F7`→`#1C1C1E`

Semantic colors — `name: light → dark`:
label `#000000`→`#FFFFFF` · secondaryLabel `rgba(60,60,67,0.6)`→`rgba(235,235,245,0.6)` ·
tertiaryLabel `rgba(60,60,67,0.3)`→`rgba(235,235,245,0.3)` · placeholderText `rgba(60,60,67,0.3)`→`rgba(235,235,245,0.3)` ·
separator `rgba(60,60,67,0.29)`→`rgba(84,84,88,0.6)` · link `#0088FF`→`#0091FF` ·
systemBackground `#FFFFFF`→`#000000` · secondarySystemBackground `#F2F2F7`→`#1C1C1E` ·
tertiarySystemBackground `#FFFFFF`→`#2C2C2E` · systemGroupedBackground `#F2F2F7`→`#000000`.
Default tint = blue.

Type ramp (iOS Dynamic Type, "Large" default) — `style: size/leading pt, weight`:
largeTitle 34/41 regular · title1 28/34 regular · title2 22/28 regular · title3 20/25 regular ·
headline 17/22 semibold · body 17/22 regular · callout 16/21 regular · subhead 15/20 regular ·
footnote 13/18 regular · caption1 12/16 regular · caption2 11/13 regular. Body tracking ≈ −0.43.

Spacing (pt): 4, 8, 12, 16, 20, 24, 32; screen margin 16 (20 in regular width).
Corner radii (pt): sm 8, md 12, lg 16; prominent controls use a capsule.
Sizing (pt): minTapTarget 44 (visionOS 60); control-size default/min — iOS/iPadOS/watchOS 44/28,
macOS 28/20, tvOS 66/56, visionOS 60/28.
Contrast: body 4.5:1, large (≥18 pt / bold) 3:1.

## Output format

If you can also read `${CLAUDE_PLUGIN_ROOT}/skills/apple-hig/references/design-tokens.md` (the same
values, in case they were updated), prefer it; otherwise use the values above. Then:

- **css** — `:root { … }` of `--color-*`, `--font-*-size/-leading`, `--space-*`, `--radius-*`,
  `--tap-target-min`, etc. (light), plus `@media (prefers-color-scheme: dark){ :root { …dark color
  overrides… } }`. kebab-case names. Valid CSS.
- **tailwind** — a `tailwind.config.js` `theme.extend` object with `colors` (each `{ DEFAULT, dark }`),
  `fontSize` (size + lineHeight tuples), `spacing`, `borderRadius`. Valid JS.
- **json** — one object: `{ "color": { "system": {…light,dark}, "semantic": {…} }, "type": {…},
  "spacing": {…}, "radius": {…}, "size": {…}, "contrast": {…} }`. Valid JSON.
- **swiftui** — `import SwiftUI`, then `enum HIG { … CGFloat spacing/radii, minTapTarget … }`,
  `extension Font { static let higBody = .system(size:17, weight:.regular) … }`, and
  `extension Color { static let higTint = .accentColor; static let higMint = Color(.sRGB, red:0,
  green:0.78, blue:0.745, opacity:1) … }`. Prefer system semantics where they exist. Must compile.
- **react-native** — a JS/TS module exporting `tokens` with `colors` (light/dark), `type`
  (fontSize + lineHeight), `spacing`, `radius`, `minTapTarget: 44`, plus a `useColorScheme` usage note.

Emit valid, copy-pasteable output for the requested format only.

## Live values (macOS)

Before emitting colors or the type ramp, check for `~/.cache/apple-hig/live-tokens.json`. If it exists
with `schema: 2`, emit its `colors`/`typeRamp` and note "(live, from your SDK — Xcode <build>)".
Otherwise emit the bundled `references/design-tokens.md` values. On macOS + Xcode with no cache, and
unless `HIG_SDK_SYNC=never`, offer to run `/hig-sync` first (run it automatically if `HIG_SDK_SYNC=always`).
