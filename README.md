# apple-hig

A Claude Code plugin that makes Claude design and review user interfaces according to Apple's Human
Interface Guidelines (HIG), automatically choosing the correct platform scope — iOS, iPadOS, macOS,
watchOS, tvOS, or visionOS — for whatever is being built.

## About

`apple-hig` gives Claude a complete, on-disk copy of Apple's design guidance, organized the way Apple
organizes the HIG (Foundations, Patterns, Components, Inputs, Technologies), plus per-platform device
specs and a consolidated design-token file. Because the reference ships with the plugin, Claude never
has to fetch Apple at runtime; a router skill loads only the few files relevant to the current task.

It is meant for anyone building Apple-platform UI — in SwiftUI, UIKit, AppKit, or a cross-platform
stack — who wants the output to follow the HIG by default instead of as an afterthought. When you ask
for a screen, a component, or a review, the skill activates on its own, pulls the right rules and exact
values, and applies them. For non-Apple targets (web, Android) it keeps Apple's principles and tokens
but defers to the host platform's conventions rather than imposing iOS chrome.

The reference reflects the current design language, **Liquid Glass** (the "26" generation), refined at
WWDC 2026 into the **iOS/iPadOS/macOS 27 ("Golden Gate")** generation. Its exact values — the type
ramp, the system color palette and its dark-mode variants, device sizes, hit-target and contrast
minimums — were verified against Apple's live HIG. Every file stores a canonical `source_url` and a
"verify on Apple" note, because these specs move with each release.

## Licensing and assets (read this first)

This plugin contains **no Apple binary assets**. It references Apple's fonts, SF Symbols, and design
templates by name and links to Apple's official downloads — it never bundles or redistributes them.

- **SF fonts** (SF Pro, SF Compact, SF Mono, New York, and the non-Latin SF families) are licensed
  *solely* for creating mock-ups of UI for software running on Apple's iOS, iPadOS, macOS, or tvOS.
  They may not be redistributed, embedded, or used to mock up non-Apple-OS interfaces. SF Compact is
  watchOS-only.
- **SF Symbols** are system-provided images. They may **not** be used in app icons, logos, or any other
  trademarked use — and may not be redistributed.
- **Apple Design Resources / templates** are licensed for Apple-platform UI mock-ups only.

When building for **web or Android**, do not ship SF fonts; use the system font stack
(`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, …`) or a freely licensed family such as Inter.

Full details and the official download URLs are in
[`skills/apple-hig/guidelines/licensing-and-assets.md`](skills/apple-hig/guidelines/licensing-and-assets.md).
The reference text (numbers, semantic names, links) is factual and freely usable; Apple's binary assets
remain Apple's property and are not included here.

## Design guidelines at a glance

The rules and values the plugin applies. The full, sourced detail is under
[`skills/apple-hig/guidelines/`](skills/apple-hig/guidelines/).

**Principles.** Establish a clear **Hierarchy** (controls elevate the content beneath them), **Harmony**
(match the concentric design of the hardware — nested corner radii share a center), and **Consistency**
(adopt platform conventions; adapt continuously across sizes). The classic Clarity, Deference, Depth
still underlie the system. Defer to content; prefer system components; design light and dark together.

**Liquid Glass.** The navigation layer (bars, sidebars, controls, sheets) floats above the content in a
dynamic glass material with two variants, *regular* and *clear*; the content layer stays opaque. Honor
Reduce Transparency and Increase Contrast. The "27"/Golden Gate refinement adds a user transparency
slider, stronger contrast, and standardized window borders.

**Color.** Use **semantic** colors (`label`, `systemBackground`, accent/tint), never hardcoded hex, so
they adapt to appearance, contrast, and wide gamut. The system palette has 12 tints including the added
**Mint** (`#00C7BE`/`#63E6E2`) and **Cyan** (`#32ADE6`/`#64D2FF`); systemTeal is `#30B0C7`/`#40CBE0`.
Every color has a light and a dark value.

**Typography.** System fonts are SF Pro / SF Compact (watchOS) / New York; support **Dynamic Type**
(use text styles, not fixed sizes). iOS "Large" ramp: Large Title 34/41, Title 1 28/34, Headline & Body
17/22, Subhead 15/20, Caption 2 11/13 (size/leading pt). macOS does not support Dynamic Type.

**Layout and targets.** Work in points; respect safe areas (notch/Dynamic Island, Home indicator,
overscan); use an 8 pt spacing rhythm and size classes. Minimum hit target **44×44 pt** (visionOS
**60×60**); Apple's control-size table lists 44 as the default with 28×28 as the floor (macOS 28/20,
tvOS 66/56).

**Accessibility.** Contrast **4.5:1** body, **3:1** large (≥18 pt / bold); never convey meaning by color
alone; VoiceOver labels on every control, including icon-only ones; provide a **Reduce Motion**
alternative for any animation; support the full Dynamic Type range.

**Per-platform navigation.** iOS — tab bar (2–5, a floating Liquid Glass capsule on 26) plus a
navigation stack. iPadOS / macOS — sidebar + split view + toolbar; macOS has the menu bar. watchOS —
Digital Crown and complications. tvOS — the focus engine and Top Shelf. visionOS — windows, volumes,
spaces, and ornaments, with eyes-and-hands input.

## What you get

- **Auto-activating skill** (`apple-hig`) — a router that triggers on any UI/design/review task for an
  Apple platform (or any product that should follow the HIG) and loads only the relevant guideline
  files. You do not need to name it.
- **`design-reviewer` subagent** — audits UI code (SwiftUI/UIKit/AppKit, React/React Native, Flutter,
  HTML/CSS) and reports violations with the rule, the Apple `source_url`, the location, and a concrete
  fix. Catches sub-44 pt targets, hardcoded/non-semantic colors, missing dark-mode variants, off-grid
  spacing, low contrast, non-standard radii, motion that ignores Reduce Motion, and more.
- **Commands**
  - `/hig-review [path]` — run the design-reviewer on the current file/selection or a path.
  - `/hig-scaffold <platform> <component/screen> [stack]` — generate a HIG-compliant component/screen.
  - `/hig-tokens <css|tailwind|json|swiftui|react-native>` — emit the design tokens (colors, type ramp,
    spacing, radii, control sizes) in the requested format.
- **Optional non-blocking hook** — a gentle reminder after edits to consider `/hig-review`. Delete
  `hooks/hooks.json` if you don't want it.

## Coverage

The reference mirrors Apple's HIG taxonomy: 20 foundations, 6 platforms, 63 components, 27 patterns, 13
inputs, and 29 technologies, plus a consolidated design-token file — every topic Apple documents.

## Install

`apple-hig@apple-hig` is `plugin-name@marketplace-name`. Install it either way:

**In a Claude Code session** (type these as slash commands):

```text
/plugin marketplace add elevatormusic/apple-hig
/plugin install apple-hig@apple-hig
```

**From a terminal** (the `claude` CLI — no interactive session needed):

```text
claude plugin marketplace add elevatormusic/apple-hig
claude plugin install apple-hig@apple-hig
```

The first command adds this repo as a marketplace; the second installs the plugin (user scope by
default; add `--scope project` to install it for a single repo). Restart or start a new Claude Code
session for the plugin to load.

Verify and manage it:

```text
claude plugin list                       # confirm apple-hig is installed and enabled
claude plugin details apple-hig          # show the skill, commands, agent, and token cost
claude plugin update apple-hig           # pull a newer version after the repo is updated
claude plugin uninstall apple-hig        # remove it
claude plugin marketplace remove apple-hig
```

## Usage

Just work on an Apple-platform UI and the skill activates on its own — for example, "build an iPhone
settings screen in SwiftUI" or "review this view for HIG compliance." Or drive it explicitly:

```text
/hig-scaffold ios settings screen swiftui
/hig-review Sources/SettingsView.swift
/hig-tokens css
/hig-tokens swiftui
```

## How it works

`skills/apple-hig/SKILL.md` is a router, not the content. On each task it loads
`guidelines/universal.md`, detects the platform, then loads only the specific component/foundation/
pattern files needed (there is a keyword-to-file routing table in the skill). Exact numbers come from
`references/design-tokens.md`. Nothing is fetched from Apple at runtime.

## Repository layout

```text
apple-hig/
├── .claude-plugin/
│   ├── plugin.json            # plugin manifest
│   └── marketplace.json       # single-plugin marketplace (source: "./")
├── skills/apple-hig/
│   ├── SKILL.md               # auto-activating router
│   ├── guidelines/            # foundations, platforms, components, patterns, inputs, technologies
│   └── references/design-tokens.md
├── agents/design-reviewer.md
├── commands/                  # hig-review, hig-scaffold, hig-tokens
├── hooks/hooks.json           # optional reminder
├── README.md
└── LICENSE
```

## Develop and validate locally

Validate the manifests and load the plugin from disk without installing:

```text
claude plugin validate ./apple-hig --strict
claude --plugin-dir /absolute/path/to/apple-hig
```

Then confirm the `apple-hig` skill activates on a UI request, the commands appear, and the
`design-reviewer` agent is available. Update later by pushing changes and bumping `version` in both
manifests; users run `/plugin marketplace update apple-hig`.

## License

The plugin's own files (skill, guidelines text, agent, commands, README) are released under the MIT
License — see [LICENSE](LICENSE). This covers only the original reference text and tooling in this
repository. Apple's fonts, SF Symbols, design templates, trademarks, and the Human Interface Guidelines
themselves are the property of Apple Inc. and are not licensed or redistributed here; this plugin only
references and links to them.
