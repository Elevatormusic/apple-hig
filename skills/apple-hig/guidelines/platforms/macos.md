---
title: macOS (Mac)
source_url: https://developer.apple.com/design/human-interface-guidelines/designing-for-macos
platforms: [macos]
value_type: exact-spec
last_verified: 2026-06-14
---

# macOS (Mac)

> 🔢 **exact-spec / version-dependent.** macOS Tahoe 26 adopts Liquid Glass. WWDC 2026 (June 8 2026)
> announced macOS 27 "Golden Gate" — a Liquid Glass refinement (not a new system) with a user-facing
> transparency/personalization slider, improved contrast/legibility, more consistent refraction,
> sharper app icons, and on macOS standardized window borders/shapes plus sidebar appearance changes
> (expanded, regain active-window color). Re-verify on Apple as the HIG migrates from the 26 to the
> 27/Golden Gate generation.

## Design tenets

**Powerful, efficient, information-dense.** Pointer + keyboard primary; support **menu bar**,
keyboard shortcuts, windows, and multiple windows. Denser layouts than iOS are appropriate.

## Input model

- **Pointer** (precise, hover states, right-click context menus) + **hardware keyboard** (full
  shortcuts essential). Trackpad gestures. Targets can be smaller than 44 pt but keep comfortable.

## Navigation & window model

- **Menu bar** at the top of the screen — every command lives in a logically grouped menu with
  keyboard shortcuts. This is mandatory Mac structure. See [[menus]].
- **Windows** (resizable, multiple), **panels** (auxiliary/utility), **sheets** (modal attached
  to a window), **popovers**, **toolbars**, and **sidebars** (source lists). See [[split-views]],
  [[sheets]], [[toolbars]].
- **Inspectors** on the trailing side; **source list** sidebar on the leading side.

## Exact values

- **Menu bar height ~24 pt** standard; **~37 pt** on 14"/16" MacBook Pro with the camera housing
  (notch) — keep menu content clear of the housing.
- Scale **@1x** and **@2x** (Retina).
- **Control sizes:** mini / small / medium → **rounded-rectangle** shapes; **large / x-large** →
  **capsule** shapes (Liquid Glass).
- Default window backgrounds via the dynamic semantic color `NSColor.windowBackgroundColor` (resolves
  per appearance/environment; not a fixed value). Approximate light → dark hex ~`#ECECEC` → ~`#323232`
  is a secondary-source reference only (system color values refreshed June 9 2025 and may change per
  release). See [[color]].
- **Typography:** default text **13 pt**, minimum legible size **10 pt**. macOS does **not** support
  Dynamic Type (unlike iOS, iPadOS, tvOS, visionOS, and watchOS).

## Conventions

- Provide **keyboard shortcuts** for frequent actions; show them in menus.
- Support **resizable** windows down to a sensible minimum; remember window state.
- Use **standard toolbar** items and the unified title/toolbar; respect the traffic-light controls.
- Right-click **context menus** everywhere relevant; full **drag and drop**. See [[drag-and-drop]].
- Respect user **accent color** and **highlight color** from System Settings. See [[color]].

## Mac Catalyst / iPad apps on Mac

When bringing an iPad app to Mac, adopt Mac idioms: real menu bar, pointer hover, window
chrome, keyboard shortcuts — don't ship touch-only chrome.

See also: [[ipados]], [[menus]], [[toolbars]], [[split-views]], [[liquid-glass]], [[layout]].

## Design rubric -- judge by macOS, not iOS

When reviewing a macOS screen, check these (not the iPhone defaults):
- **Density is correct, not clutter.** Inspectors, source lists, multi-column tables, and packed toolbars are idiomatic; apply "one primary task / minimal controls" to the per-window task only, never to overall control count. (apple_published -- Designing for macOS.)
- **Control size = macOS, not 44pt.** Judge against macOS control sizes (~28/24/20pt regular/small/mini -- platform_api_observed, a soft reference, not a hard gate); a 44pt-tall control in a dense desktop layout wastes space. Capsule shapes only for large/x-large prominent actions; mini/small/medium are rounded rectangles.
- **Complete menu bar.** Every command in a logically grouped top menu; standard menus present; inapplicable items disabled/grayed, not hidden. (apple_published -- The menu bar.)
- **No toolbar-only actions.** The toolbar is user-removable, so every toolbar command must also exist in the menu bar (and a shortcut where frequent). (apple_published -- Toolbars.)
- **Full Keyboard Access + standard shortcuts** (Cmd-C/V/Z/S/...), a visible focus ring, and no reassigning of system shortcuts. (apple_published -- Keyboards.)
- **Pointer affordances:** hover states that don't change selection; secondary-click (right/Control-click) context menus where relevant. Flag a macOS UI with no hover and no contextual menus. (apple_published.)
- **Sidebar -> content -> detail navigation** (+ optional trailing inspector), NOT an iOS bottom tab bar; auxiliary/attribute UI goes in an inspector or non-modal panel, not a modal sheet. (apple_published -- Sidebars / Panels.)
- **Windowing:** resizable, sensible min + default size, restored across launches (a fixed-size single-window app is a defect); first-class single AND multi-selection (Shift/Cmd) that respects the accent color, not color alone. (apple_published -- Windows / Selection.)
- **No Dynamic Type** (macOS doesn't support it) -- judge fixed ~13pt body / ~10pt-min legibility; the user adjusts via display zoom. (apple_published -- Typography.)

**iOS defaults WRONG here:** demanding one prominent CTA / minimal controls; 44pt-everywhere; a bottom tab bar as primary nav; "no dense layouts"; requiring Dynamic Type.
