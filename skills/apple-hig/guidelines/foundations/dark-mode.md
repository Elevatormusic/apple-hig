---
title: Dark Mode
source_url: https://developer.apple.com/design/human-interface-guidelines/dark-mode
platforms: [ios, ipados, macos, tvos, visionos]
value_type: platform-specific
last_verified: 2026-06-14
---

# Dark Mode

> ⚠️ Re-verify on Apple.

## Purpose

Dark Mode is a system-wide appearance using a dark palette for comfortable viewing in low light.
Design **light and dark together** as equal first-class appearances — dark is not an
afterthought or a simple color inversion. The system, your semantic colors, and materials adapt
automatically when people switch.

## Base vs elevated (the key concept)

In Dark Mode the system provides **two background levels** to convey depth when one dark surface
sits above another:

- **Base** — a view that fills the screen edge to edge (the darkest level).
- **Elevated** — content presented in a separate layer above the base (sheets, popovers, alerts,
  grouped content). System background colors get **lighter** at the elevated level so the layer
  reads as raised against the near-black base.

Let the system manage this by using semantic background colors (`systemBackground`,
`secondarySystemBackground`, grouped variants) rather than hardcoding values. See [[color]].

## Guidelines

- **Use semantic colors and materials**, never hardcoded hex. `label`, `secondaryLabel`,
  `separator`, `systemBackground`, `tintColor`, and `Material` all resolve correctly per
  appearance. Hardcoded hex breaks Dark Mode. See [[color]], [[materials]].
- **Don't assume inversion.** Many colors flip light↔dark, but some don't. Dark backgrounds are
  dimmer; foreground colors are brighter. Verify each.
- **Desaturate vivid colors.** Highly saturated colors can vibrate against dark backgrounds —
  use the system's dark-variant colors (e.g. `systemBlue` `#0091FF` in dark) rather than the
  light hue. The system palette is pre-tuned for this.
- **Test contrast in both modes.** Re-check legibility, contrast, and accessibility in light and
  dark, including over translucent materials and at the worst-case background.
- **Provide assets per appearance.** Supply light/dark variants for images and custom artwork
  where needed; use vibrancy for text/symbols over materials.

## Platform notes

- **iOS / iPadOS / tvOS / visionOS:** full base/elevated model; honor the user's system setting
  and offer it as the default behavior.
- **macOS** (`NSColor` semantic colors like `labelColor`, `controlColor`, `windowBackgroundColor`)
  adapts automatically; Dark Mode also tracks the user's accent/highlight choices. No Dynamic Type.
- **watchOS:** Dark Mode is **not** a setting — the watchOS UI is **always dark**. Design for a
  black background; OLED black saves power and lets content float.

## SwiftUI / UIKit / API

- SwiftUI: `@Environment(\.colorScheme)`, `.preferredColorScheme(_:)`,
  `Color(uiColor:)`/asset-catalog colors, `Material`.
- UIKit: `UIUserInterfaceStyle` (`.light` / `.dark` / `.unspecified`),
  `traitCollection.userInterfaceStyle`, `UIColor` dynamic providers, `overrideUserInterfaceStyle`.
- AppKit: `NSAppearance` (`.darkAqua`), `NSColor` dynamic semantic colors.

## Accessibility

- Maintain contrast in dark: **4.5:1** body (≤17 pt), **3:1** large/bold; placeholder ≥4.5:1.
- Honor **Increase Contrast** (stronger separators) and **Reduce Transparency** (opaque chrome).
- Don't convey meaning by color alone in either appearance. See [[accessibility]].

## Do / Don't

- ✅ Design light and dark in parallel with semantic colors and materials.
- ✅ Use elevated backgrounds for sheets/popovers to express depth.
- ❌ Hardcode hex or assume a mechanical color inversion.
- ❌ Use light-mode saturated colors on dark backgrounds.

See also: [[color]], [[materials]], [[liquid-glass]], [[accessibility]], [[typography]], [[macos]]
