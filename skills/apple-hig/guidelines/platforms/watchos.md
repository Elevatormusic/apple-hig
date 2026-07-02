---
title: watchOS (Apple Watch)
source_url: https://developer.apple.com/design/human-interface-guidelines/designing-for-watchos
platforms: [watchos]
value_type: exact-spec
last_verified: 2026-06-14
---

# watchOS (Apple Watch)

> 🔢 Device sizes are **exact-spec / version-dependent** (pixels). Re-verify on Apple.

## Design tenets

**Glanceable, lightweight, immediate.** Interactions last **seconds**. Surface the most relevant
info first; lean on **complications**, notifications, and the **Smart Stack**. Minimal padding,
big tap targets, high contrast.

## Input model

- **Touch** (44 pt-equivalent targets, but design generously for the small screen),
  **Digital Crown** (scroll/adjust precise values), **haptics** (Taptic Engine), voice, and
  **double-tap** gesture. Buttons should be large and few per screen.

## Navigation model

- **Vertical scrolling** with the Digital Crown is primary. Pages, hierarchical navigation, and
  the **toolbar** at the top. Keep flows shallow.
- **Complications** on the watch face launch into the app's key info. **Smart Stack** widgets.

## Typography & color

- System font is **SF Compact** with its own watch type ramp (don't reuse iOS sizes); **complications use SF Compact Rounded** (when drawing text as an image in a graphic complication). See [[typography]] and the numeric ramp in [[design-tokens-watchos]].
- High-contrast, mostly **dark** UI (OLED, true black saves power); use system colors. See [[color]].

## App icon

- **Circular**; master reported at **1088 px** in the 26 generation. See [[icons]].

## Display sizes (pixels)

| Case | Pixels |
|---|---|
| 40 mm | 324 × 394 |
| 41 mm | 352 × 430 |
| 42 mm (Series 10/11) | 374 × 446 |
| 44 mm | 368 × 448 |
| 45 mm | 396 × 484 |
| 46 mm (Series 10/11) | 416 × 496 |
| 49 mm (Ultra 1/2) | 410 × 502 |
| 49 mm (Ultra 3) | 422 × 514 |

## Conventions

- **One primary action** per screen; avoid dense forms. Use system controls (Date/Time pickers,
  steppers tuned for the Crown).
- Design **notifications** (short + long look) and **complications** as first-class entry points.
- Keep motion brief; respect battery and Reduce Motion. See [[motion]].

See also: [[ios]], [[typography]], [[design-tokens-watchos]], [[complications and widgets → widgets]], [[notifications]], [[icons]].
