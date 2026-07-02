# Apple Human Interface Guidelines — agent rules

When you design, build, style, or review any user interface for an Apple platform (iOS, iPadOS,
macOS, watchOS, tvOS, visionOS) — or any app/website that should follow Apple's Human Interface
Guidelines — follow the rules below. If the `apple-hig` `guidelines/` folder is present in this
project, consult it for exact, sourced values and load only the files relevant to the task.

## Always

- **Detect the platform** and apply its conventions. For **web/Android**, keep these principles and
  tokens but defer to the host platform's chrome and navigation — do not impose iOS chrome by default.
- **Prefer system components.** Use **semantic colors** (never hardcoded hex) and **text styles**
  (Dynamic Type), not fixed point sizes.
- **Design light and dark together** — every color/image needs both.
- **Hit targets ≥ 44×44 pt** (60×60 pt on visionOS).
- **Contrast** ≥ 4.5:1 for body text, ≥ 3:1 for large text (≥ 18 pt / bold). Never convey meaning by
  **color alone**.
- **VoiceOver label** on every control, including icon-only ones. Provide a **Reduce Motion**
  alternative for any animation.
- **Animate cheaply:** only `transform`/`opacity` (compositor-only); don't loop-animate layout/paint
  properties (`box-shadow`, `width`, `clip`) or read layout (`getBoundingClientRect`, `getPointAtLength`)
  in the loop; avoid animating expensive `filter`/`backdrop-filter` blur; pause continuous animation
  when it's off-screen or the tab/app is backgrounded. Disable ligatures on UI text that doesn't need
  them (`font-variant-ligatures: none`) and prefer SVG icons over icon webfonts (or self-host a
  `GSUB`/`GPOS`-stripped subset — a full icon font's ligature table is slow for the OS to parse).
- **On-grid spacing** (4/8 pt rhythm); respect **safe areas**; use **leading/trailing** (RTL-safe),
  not left/right.
- **Licensing:** do not bundle or redistribute Apple's SF fonts, SF Symbols, or templates — link to
  Apple's downloads. Never use SF Symbols in app icons or logos. On web/Android, ship the system font
  stack or a freely licensed family (e.g. Inter), not SF.

## Key tokens (iOS reference set; use semantic names in code)

- System colors (light → dark) include **mint** `#00C8B3`/`#00DAC3`, **cyan** `#00C0E8`/`#3CD3FE`,
  **teal** `#00C3D0`/`#00D2E0`, blue `#0088FF`/`#0091FF`. Every color has a light and dark value.
- Type ramp (size/leading pt): Large Title 34/41, Title 1 28/34, Headline & Body 17/22,
  Subhead 15/20, Footnote 13/18, Caption 2 11/13.
- Spacing: 4, 8, 12, 16, 20, 24, 32. Corner radii: 8 / 12 / 16, and a capsule for prominent controls.
- Design language: **Liquid Glass** (the "26" generation), refined at WWDC 2026 into the
  iOS/iPadOS/macOS **27 "Golden Gate"** generation. Glass is for the navigation/chrome layer only —
  the content layer stays opaque.

## If the `apple-hig` guidelines/ folder is in this project

Consult it for exact, sourced values. Load only what's relevant — `universal.md` first, then the right
rubric: `platforms/<platform>.md` for an Apple-native target, `profiles/web.md` for a web target (bind
**web-app** vs **marketing-website**), or `profiles/desktop-cross-platform.md` for Windows/Linux/Electron/Qt
software (host-OS conventions, never iOS chrome). Then the few `components/`, `foundations/`, and
`patterns/` files for the task, and `references/design-tokens.md` for exact numbers. Do not read the whole folder. Each file
stores a canonical Apple `source_url`; cite it when you state a spec, and treat exact numbers as
version-dependent.

## Review checklist (when auditing UI code)

Flag and fix: touch targets < 44 pt (60 pt visionOS); hardcoded/non-semantic colors; missing
dark-mode variants; off-grid spacing; contrast < 4.5:1 body / < 3:1 large; non-standard corner radii;
motion with no Reduce Motion path; **animations that loop a non-compositable property (`box-shadow`,
`width`, `clip`) instead of `transform`/`opacity`, force a layout read every frame, or never pause
off-screen/when backgrounded**; icon-only controls without a VoiceOver label; hardcoded type sizes /
no Dynamic Type.
Prefer system components and semantic values in every fix.
**Bind the target first:** judge web, macOS, and desktop software by their OWN standards (WCAG + host-OS
conventions) — never flag them for lacking iOS chrome (bottom tab bars, sheets, SF Symbols). The 44 pt
target floor and Dynamic Type are Apple-platform rules; the web/desktop pointer floor is 24 px (WCAG 2.5.8).
