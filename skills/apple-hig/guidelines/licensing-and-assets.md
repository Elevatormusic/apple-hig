---
title: Licensing & Assets
source_url: https://developer.apple.com/design/resources/
platforms: [ios, ipados, macos, watchos, tvos, visionos]
value_type: universal
last_verified: 2026-06-14
---

# Licensing & Assets (read this before using any Apple asset)

> 🔒 **The single most important compliance constraint for this plugin: never bundle or
> redistribute Apple's fonts, SF Symbols, or design templates. Link to Apple's official
> download URLs only.** This plugin ships **zero** Apple binary assets by design.

## What you may NOT do

- ❌ Bundle, vendor, commit, or redistribute **SF Pro / SF Compact / SF Mono / New York /
  SF Arabic / SF Armenian / SF Georgian / SF Hebrew** font files.
- ❌ Bundle or redistribute the **SF Symbols** app, its symbol set, or extracted glyphs.
- ❌ Bundle or redistribute Apple's **UI kits / design templates** (Figma/Sketch/PSD/AI).
- ❌ Use **SF Symbols — or confusingly similar glyphs — in app icons, logos, or any
  trademark use.** Apple may require modification or discontinuance.
- ❌ Use SF fonts to mock up UI for **non-Apple** operating systems.
- ❌ Commit or redistribute Apple's **design-token exports** (Figma variable/token JSON from the
  UI kits). Documenting the **numeric values** with citations is fine (see below); the files are
  Apple's. Authoritative restriction text: the [Apple Design Resources License](https://developer.apple.com/support/downloads/terms/apple-design-resources/Apple-Design-Resources-License-20230621-English.pdf).

## What you MAY do

- ✅ Reference assets **by name** and **link** to Apple's official download URLs.
- ✅ Use SF fonts and SF Symbols **only** as a registered Apple Developer, **solely** to
  create mock-ups of UI for software running on **Apple's** iOS, iPadOS, macOS, or tvOS.
- ✅ Output **design tokens** (hex values, point sizes, spacing, radii) — numbers and
  semantic names are facts, not redistributable assets.

## License text (reproduced for compliance)

**SF fonts (San Francisco Font license).** The font is "to be used SOLELY for creating
mock-ups of user interfaces to be used in software products running on Apple's iOS, iPadOS,
macOS or tvOS operating systems." You may not "rent, lease, lend, trade, transfer, sell,
sublicense or otherwise redistribute the Apple Font," may not embed it in software/products,
and may not use it for non-Apple-OS UI mockups. **SF Compact is watchOS-only.**

**SF Symbols (Xcode/SDK license).** SF Symbols is a library of over 7,000 symbols, available in
nine weights and three scales (as of SF Symbols 7). "All SF Symbols shall be considered to be
system-provided images." **You may not use SF Symbols — or confusingly similar glyphs — in app
icons, logos, or any other trademark use.**

**Apple Design Resources / templates.** Licensed only for creating mock-ups of UIs for
software running on Apple OSes. Recipients of mock-ups must be made aware of the restrictions.
You may not extract Template Content or use it to create/distribute other artwork or website
content.

## Official download URLs (link, never bundle)

| Asset | URL |
|---|---|
| Design Resources hub | https://developer.apple.com/design/resources/ |
| SF Pro / SF Compact / SF Mono / New York (DMGs) | https://developer.apple.com/fonts/ |
| Non-Latin SF fonts (Arabic, Armenian, Georgian, Hebrew) | https://developer.apple.com/fonts/ |
| SF Symbols app (7; macOS Sonoma+) | https://developer.apple.com/sf-symbols/ |
| Icon Composer | https://developer.apple.com/icon-composer/ |
| UI Kits (iOS/iPadOS/macOS/watchOS/visionOS, Figma/Sketch) | https://developer.apple.com/design/resources/ |
| Technology templates (Apple Pay, Live Activities, Wallet, etc.) | https://developer.apple.com/design/resources/ |
| Product bezels (marketing) | https://developer.apple.com/design/resources/ |

## Fonts: free, redistributable substitutes for non-Apple targets

When the target is **web/Android** (where SF fonts may not be used), or when you need a
shippable font, use these visually compatible, openly licensed families:

- **Inter** (SIL OFL) — closest free analogue to SF Pro for UI text.
- **System font stack** on the web: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
  Helvetica, Arial, sans-serif` — uses the real SF on Apple browsers without shipping it.
- **IBM Plex Mono / JetBrains Mono** — for SF Mono-style code.

See also: [[icons]], [[sf-symbols]], [[typography]].
