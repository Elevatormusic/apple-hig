---
title: Design Tokens (consolidated)
source_url: https://developer.apple.com/design/human-interface-guidelines
platforms: [ios, ipados, macos, watchos, tvos, visionos]
value_type: exact-spec
last_verified: 2026-07-01
---

> 🔄 **Prefer live values when present.** If `~/.cache/apple-hig/live-tokens.json` exists and its
> `schema` is `2`, use its `colors` and `typeRamp` (each ramp entry has `size`/`leading`/`weight`)
> instead of the tables below (they were resolved
> from the user's own SDK and are more current). Everything else on this page stays authoritative.
> Generate or refresh that cache with `/hig-sync` (macOS + Xcode only).

# Design Tokens (consolidated, machine-readable)

> 🔢 **exact-spec / version-dependent.** Single source for the `/hig-tokens` command. Values are
> the **iOS** reference set unless noted; re-verify on Apple. In code, prefer **semantic** names
> over raw values. Detailed guidance lives in [[color]], [[typography]], [[layout]].
>
> 📄 **Full per-platform tables** (complete ramps, label/fill ladders, materials, Liquid Glass,
> backgrounds incl. elevated): `references/design-tokens-ios.md` (iOS/iPadOS 27),
> `design-tokens-macos.md`, `design-tokens-watchos.md`, `design-tokens-visionos.md`.

## Colors — system (light → dark, hex)

| token | light | dark |
|---|---|---|
| blue | #0088FF | #0091FF |
| cyan | #00C0E8 | #3CD3FE |
| green | #34C759 | #30D158 |
| indigo | #6155F5 | #6D7CFF |
| mint | #00C8B3 | #00DAC3 |
| orange | #FF8D28 | #FF9230 |
| pink | #FF2D55 | #FF375F |
| purple | #CB30E0 | #DB34F2 |
| red | #FF383C | #FF4245 |
| teal | #00C3D0 | #00D2E0 |
| yellow | #FFCC00 | #FFD600 |
| brown | #AC7F5E | #B78A66 |
| gray | #8E8E93 | #8E8E93 |
| gray2 | #AEAEB2 | #636366 |
| gray3 | #C7C7CC | #48484A |
| gray4 | #D1D1D6 | #3A3A3C |
| gray5 | #E5E5EA | #2C2C2E |
| gray6 | #F2F2F7 | #1C1C1E |

## Colors — semantic (light → dark)

| token | light | dark |
|---|---|---|
| label | #000000 | #FFFFFF |
| secondaryLabel | rgba(60,60,67,0.6) | rgba(235,235,245,0.6) |
| tertiaryLabel | rgba(60,60,67,0.3) | rgba(235,235,245,0.3) |
| quaternaryLabel | rgba(60,60,67,0.18) | rgba(235,235,245,0.16) |
| quinaryLabel | rgba(60,60,67,0.09) | rgba(235,235,245,0.09) |
| placeholderText | rgba(60,60,67,0.3) | rgba(235,235,245,0.3) |
| separator | rgba(60,60,67,0.29) | rgba(84,84,88,0.6) |
| opaqueSeparator | #C6C6C8 | #38383A |
| link | #0088FF | #0091FF |
| systemBackground | #FFFFFF | #000000 |
| secondarySystemBackground | #F2F2F7 | #1C1C1E |
| tertiarySystemBackground | #FFFFFF | #2C2C2E |
| systemGroupedBackground | #F2F2F7 | #000000 |
| secondarySystemGroupedBackground | #FFFFFF | #1C1C1E |
| tertiarySystemGroupedBackground | #F2F2F7 | #2C2C2E |

> **Elevated (dark) ramp.** The dark values above are the **base** ramp. Dark mode also has an
> **elevated** ramp for content above a base surface (sheets, popovers): background
> Primary/Secondary/Tertiary = `#1C1C1E` / `#2C2C2E` / `#3A3A3C` (grouped elevated matches). Full
> base+elevated tables are in `references/design-tokens-ios.md`.

Default tint/accent = `blue`.

> **Reference only — don't hard-code.** Apple states the documented system-color values are intended
> *for reference during design* and **may fluctuate from release to release**. Apply system colors
> through the API (`Color` / `UIColor` / `NSColor`) so they adapt to appearance, contrast, and
> vibrancy automatically; treat the hex above as a design aid, not a runtime constant. See [[color]].

## Type ramp — iOS Dynamic Type (default "Large")

| style | weight | size_pt | leading_pt |
|---|---|---|---|
| largeTitle | Regular/Bold | 34 | 41 |
| title1 | Regular | 28 | 34 |
| title2 | Regular | 22 | 28 |
| title3 | Regular | 20 | 25 |
| headline | Semibold | 17 | 22 |
| body | Regular | 17 | 22 |
| callout | Regular | 16 | 21 |
| subheadline | Regular | 15 | 20 |
| footnote | Regular | 13 | 18 |
| caption1 | Regular | 12 | 16 |
| caption2 | Regular | 11 | 13 |

Body tracking ≈ −0.43 pt. SF Pro Text ≤19 pt, SF Pro Display ≥20 pt. Web/Android substitute:
system stack or **Inter** (do not ship SF — see [[licensing-and-assets]]).

## Spacing scale (pt)

`4, 8, 12, 16, 20, 24, 32, 44`
- standard gap **8**, section gap **16–20**, screen margin **16** (20 on wide iPhones).

## Corner radii (pt)

`small 8 · medium 12 (button/card) · large 16 · capsule (large/prominent controls)` — keep
concentric with the container and display. See [[layout]].

> **Note:** Apple's HIG does not publish a fixed numeric corner-radius token scale. The 8/12/16
> values above are a **recommended community convention**, not an Apple-published exact spec. What
> Apple emphasizes is **concentricity** (a nested element's radius = parent radius minus the gap)
> and using a **capsule** for prominent controls in the 26 / Liquid Glass design.

## Sizing constants (pt)

| token | value | note |
|---|---|---|
| minTouchTarget | 44 | iOS/iPadOS/watchOS design target (default control size); absolute min 28×28 |
| minTouchTarget.visionOS | 60 | eye-tracking design target (default); absolute min 28×28 |
| listRowMin | 44 | |
| navLargeTitle | 34 | |
| navInlineTitle | 17 | Semibold |
| tabBarLabel | 10–11 | |
| sidebarWidth | ~320 | iPad |
| macMenuBar | 24 | 37 with camera housing |

## Contrast minimums

`bodyText 4.5:1 · largeText 3:1 (≥18pt reg / ≥14pt bold) · placeholder 4.5:1` — never color alone.

See also: [[color]], [[typography]], [[layout]], [[accessibility]].
