---
title: iOS (iPhone)
source_url: https://developer.apple.com/design/human-interface-guidelines/designing-for-ios
platforms: [ios]
value_type: exact-spec
last_verified: 2026-06-14
---

# iOS (iPhone)

> 🔢 Device sizes are **exact-spec / version-dependent**. Re-verify on Apple.

## Design tenets

Touch-first, **one primary task per screen**, focused and direct. Content reaches the edges;
controls float in Liquid Glass chrome above it. See [[liquid-glass]], [[ios]] navigation below.

## Input model

- **Touch**: tap, swipe, pinch, long-press, drag; **edge-swipe back** from the leading edge.
- Minimum hit target **44×44 pt** (Accessibility page lists 44 as the default control size,
  28×28 pt as the technical minimum). Apple's padding guidance: ~**12 pt** around bezeled
  elements, ~**24 pt** around non-bezeled elements (8 pt grid is a common spacing convention,
  not a published Apple rule). See [[accessibility]].
- Hardware keyboard / pointer optional but supported; Dynamic Island & haptics where relevant.

## Navigation model

- **Tab bar** for top-level sections (**2–5** items). On iOS 26 it's a floating, inset,
  pill-shaped capsule; **search** often a separate circular island. See [[tab-views]].
- **Navigation bar** for drill-down hierarchies: **large title 34 pt** collapsing to a
  **compact title 17 pt Semibold**; back button on the leading edge. See [[navigation-bars]].
- **Sheets** / full-screen covers for modal tasks. See [[sheets]], [[modality]].

## Key exact values

- Screen margin **16 pt** (20 pt on wider devices); status bar varies by device.
- Nav bar large title **34 pt**; compact title **17 pt Semibold**; tab bar labels ~**10 pt**
  (~13 pt on iPad) — approximate, de-facto system rendering; Apple does not publish an exact size.
- List row min height ~**44 pt**. Touch target **44×44 pt**.
- Scale factors **@2x / @3x** (most modern iPhones are @3x).
- **Full numeric token set:** [[design-tokens-ios]] (ramp incl. bold-variant weights + leading
  variants, label/fill ladders, backgrounds incl. elevated, materials, Liquid Glass — exact-spec,
  version-dependent); control-state recipes in [[control-tokens-ios]].

## iPhone frame sizes (points, portrait)

| Size (pt) | Scale | Devices |
|---|---|---|
| 440 × 956 | @3x | 17 Pro Max / 16 Pro Max |
| 430 × 932 | @3x | 16 Plus, 15 Pro Max, 15 Plus, 14 Pro Max |
| 420 × 912 | @3x | iPhone Air |
| 402 × 874 | @3x | 17, 17 Pro, 16 Pro |
| 393 × 852 | @3x | 16, 15, 15 Pro, 14 Pro |
| 428 × 926 | @3x | 14 Plus, 13 Pro Max, 12 Pro Max |
| 414 × 896 | @3x | 11 Pro Max, XS Max |
| 414 × 896 | @2x | 11, XR |
| 390 × 844 | @3x | 14, 13, 12, 16e |
| 375 × 812 | @3x | 13 mini, 12 mini, 11 Pro, X, XS |
| 414 × 736 | @3x | 8 Plus, 7 Plus, 6s Plus |
| 375 × 667 | @2x | SE (2nd/3rd gen), 8, 7, 6s |
| 320 × 568 | @2x | SE (1st gen) |

Lay out from **size classes** (compact/regular), not the model — portrait iPhone is compact
width. See [[layout]].

## Safe areas

Avoid the **notch / Dynamic Island**, **Home indicator**, status bar, and bars. Extend
backgrounds full-bleed; keep content/controls in the safe area + layout margins.

## Platform-specific surfaces

Home Screen quick actions, Widgets, Live Activities (Dynamic Island), Control Center controls,
App Shortcuts/Siri, Notifications, Lock Screen. See [[widgets]], [[live-activities]], [[notifications]].

See also: [[ipados]], [[tab-views]], [[navigation-bars]], [[liquid-glass]], [[layout]].
