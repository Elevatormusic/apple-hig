---
title: Typography
source_url: https://developer.apple.com/design/human-interface-guidelines/typography
platforms: [ios, ipados, macos, watchos, tvos, visionos]
value_type: exact-spec
last_verified: 2026-07-01
---

# Typography

> 🔢 **exact-spec / version-dependent.** Sizes/leading below are the **iOS** Dynamic Type
> ramp at the default "Large" size. watchOS (SF Compact), macOS, tvOS, and visionOS have their
> own ramps — see each platform file. The **visionOS** ramp (incl. the XL Title 1/2 display
> styles, and Large Title 29 / Title 3 19 / Callout 15 pt, which differ from iOS) is transcribed in
> `references/design-tokens-visionos.md`. Re-verify on Apple.

## System fonts (link, never bundle — see [[licensing-and-assets]])

- **SF Pro** — iOS, iPadOS, macOS, tvOS. Auto-switches **SF Pro Text (≤19 pt)** ↔
  **SF Pro Display (≥20 pt)**; iOS 14+ uses continuous optical sizing.
- **SF Compact** — watchOS.
- **SF Mono** — code / monospaced.
- **New York** — serif; optical sizes Small / Medium / Large / Extra Large.
- SF supports **9 weights** (Ultralight → Black) and widths (Condensed / Expanded).
- Non-Latin: SF Arabic, SF Armenian, SF Georgian, SF Hebrew.

**On the web/Android** you may not ship SF; use the system font stack
(`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, …`) or **Inter** (OFL). See [[licensing-and-assets]].

## iOS Dynamic Type ramp (default "Large")

| Style | Font | Weight | Size (pt) | Line height (pt) |
|---|---|---|---|---|
| Large Title | SF Pro Display | Regular/Bold | 34 | 41 |
| Title 1 | SF Pro Display | Regular | 28 | 34 |
| Title 2 | SF Pro Display | Regular | 22 | 28 |
| Title 3 | SF Pro Display | Regular | 20 | 25 |
| Headline | SF Pro Text | Semibold | 17 | 22 |
| Body | SF Pro Text | Regular | 17 | 22 |
| Callout | SF Pro Text | Regular | 16 | 21 |
| Subhead (API: .subheadline) | SF Pro Text | Regular | 15 | 20 |
| Footnote | SF Pro Text | Regular | 13 | 18 |
| Caption 1 | SF Pro Text | Regular | 12 | 16 |
| Caption 2 | SF Pro Text | Regular | 11 | 13 |

- **Body 17 pt tracking ≈ −0.43 pt** (tracking is published per-size in Apple Design Resources
  and adjusts dynamically at runtime; the 27 export lists tracking 0 for the ramp).
- **Bold weights:** the emphasized ("Bold") variant is **Semibold (600)** for Headline/Body/Callout/
  Subhead/Footnote/Caption 2; **Bold (700)** only for Large Title / Title 1 / Title 2 / Title 3;
  and **Medium (500)** for Caption 1. Full per-style + Loose/Tight leading tables in
  `references/design-tokens-ios.md`.
- Minimum legible size guidance **≈ 11 pt**.

## Dynamic Type (must support)

- **12 content size categories:** 7 standard (xSmall → xxxLarge) + 5 **Larger Accessibility Sizes**
  (AX1–AX5). Body scales to ~**310%** at AX5 on a non-linear curve (approximate/secondary figure).
- **macOS does not support Dynamic Type;** Dynamic Type applies to iOS, iPadOS, tvOS, visionOS, watchOS.
- **Use built-in text styles**, never hardcoded point sizes for content text. The system then
  scales everything, including line height and tracking.
- Test layouts at xSmall **and** AX5. Allow text to wrap/truncate gracefully; provide the
  **Large Content Viewer** for fixed-size chrome (tab/tool/nav bar items).

## Capitalization & style

- Interface labels use **title-style** or **sentence-style** capitalization (see [[writing]]).
- Avoid all-caps for long strings; it harms legibility and Dynamic Type scaling.

## Do / Don't

- ✅ Pair weight + size + color for hierarchy; rely on the ramp's built-in contrast.
- ✅ Left-align body text in LTR; mirror for RTL (see [[right-to-left]]).
- ❌ Don't hardcode sizes, disable Dynamic Type, or use more than ~2 type families per screen.

See also: [[color]], [[accessibility]], the consolidated `references/design-tokens.md`, `/hig-tokens`.
