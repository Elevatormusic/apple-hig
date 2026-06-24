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
- **Typography:** default text **13 pt**, minimum legible size **10 pt**. macOS has **no iOS-style Dynamic
  Type ramp**, and is **not** in Apple's Larger-Text accessibility criterion (that lists iOS/tvOS/visionOS/
  watchOS only). macOS 14 Sonoma+ instead exposes **"Use Preferred Reading Size"** (System Settings ▸
  Accessibility ▸ Display ▸ Text Size) which adopting apps MAY support for key text/sidebars (13 pt default,
  developer-supportable ~8–42 pt). See the Larger Text rubric dimension.

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

**How to score:** judge a Mac screen by macOS — information density *done well*, a complete menu bar,
resizable multi-window robustness, pointer + full-keyboard parity, and the macOS accessibility-stress set.
This IS genuine Apple territory: macOS HIG facts are `apple_published`, but WCAG-derived numbers stay
`wcag_external` and AppKit/SwiftUI runtime facts stay `platform_api_observed`. The cardinal sin here is the
REVERSE — do **not** impose iOS chrome on the Mac.

1. **Layout & spacing** `apple_published` — PASS: leading sidebar/source-list → content → trailing detail/
   inspector on a consistent grid; dense-but-comfortable gutters (macOS is denser than iOS); content reflows
   when sidebar/inspector toggles; nothing critical under the 14/16-inch notch; density is idiomatic (apply
   "one primary task per window" to the per-window *task*, never to overall control count). FAIL: iOS-style
   single-column with oversized margins on a wide window. (Designing for macOS.)
2. **Typography & hierarchy** `apple_published` — system font, ~13pt body, ~10–11pt legible floor, a small
   set of sizes/weights; custom fonts scale relative to a text style. FAIL: hard-coded pixel fonts, sub-10pt
   body, importing the iOS Dynamic Type ramp wholesale. (No full iOS Dynamic Type ramp — see dim 10.)
3. **Color / contrast / dark mode** `apple_published` — dynamic semantic NSColors (`windowBackgroundColor`,
   `labelColor`, `controlAccentColor`) not fixed hex; full light AND dark, contrast verified in BOTH;
   respects user accent + highlight; selection shown by accent PLUS a second cue. FAIL: hardcoded backgrounds
   that don't flip, selection by hue alone, low-contrast vibrancy/glass text.
4. **Text & non-text contrast thresholds** `wcag_external` — body ≥4.5:1 (≥3:1 large ≥18pt/≥14pt bold);
   icons/control borders/focus rings/state changes ≥3:1; both light AND dark. The 4.5:1/3:1 NUMBERS are
   W3C-derived (Apple's Sufficient Contrast page itself attributes the formula to the W3C); the REQUIREMENT
   to meet them + check both appearances is `apple_published` (App Store Connect Sufficient Contrast, which
   lists macOS). — https://www.w3.org/TR/WCAG22/#contrast-minimum
5. **Components & controls** `apple_published` — standard AppKit/SwiftUI controls at macOS control sizes:
   verified table **DEFAULT 28×28 pt, MINIMUM 20×20 pt** (NOT 44pt-everywhere); `NSControl.ControlSize`
   regular/small/mini behavior is a runtime detail (`platform_api_observed`, no precise small-height
   asserted); mini/small/medium = rounded rectangle, large/x-large = capsule (Liquid Glass); default button
   responds to Return, Esc cancels; toolbar items standard + user-customizable; traffic lights respected.
   FAIL: oversized touch-tier controls in dense layouts; custom controls lacking keyboard/VoiceOver behavior.
6. **Navigation & IA (menu bar)** `apple_published` — complete menu bar with standard menus (Apple, App,
   File, Edit, Format/View, Window, Help) in order; every command in a logically grouped menu; inapplicable
   items disabled/grayed NOT hidden; primary nav sidebar→content→detail (+ optional inspector), NOT a bottom
   tab bar; right/Control-click context menus duplicate (not replace) menu commands. (The menu bar.)
7. **No toolbar-only / context-only actions** `apple_published` — every toolbar and context-menu command
   also exists in the menu bar (+ a shortcut if frequent), because toolbars are user-removable and it aids
   Full Keyboard Access. FAIL: any action reachable ONLY via toolbar or context menu.
8. **Content & writing / voice** `apple_published` — standard macOS terminology (Settings…/Quit/standard
   Edit verbs); title case for menu titles, sentence case for most controls; alerts state problem + a verb
   action button. FAIL: nonstandard command names, vague alert text, wrong casing.
9. **States** (default/empty/error/loading/disabled/offline-no-permission/first-run) `apple_published` —
   helpful empty state (what + how to add the first item); first-run guides setup; errors as a
   window-attached sheet or inline with recovery, never a falsely-clean state; loading shows progress with a
   responsive, cancellable window; disabled commands grayed in menu+toolbar; offline/no-permission messaged
   with a path to the relevant System Settings privacy pane. FAIL: blank pane, silent failure, app-blocking
   modal, hidden disabled commands.
10. **Accessibility · Larger Text / Preferred Reading Size** `apple_published` — macOS has NO iOS-style
    Dynamic Type ramp AND is NOT in Apple's Larger-Text ASC criterion; the real mechanism is **"Use Preferred
    Reading Size"** (System Settings ▸ Accessibility ▸ Display ▸ Text Size, macOS 14+), opt-in for key text/
    sidebars (13pt default, ~8–42pt). Judge: if the app opts in, key text scales/reflows without truncation;
    generally an in-app text-size control or tolerance of display zoom keeps the layout usable. FAIL: text
    that clips/overlaps when enlarged via a supported path. Mixed: the setting exists = `apple_published`;
    which apps/elements scale = `platform_api_observed`; an in-app-control expectation = `inference` (not
    mandated on macOS). — https://support.apple.com/guide/mac-help/mchld786f2cd/mac
11. **Accessibility · Increase Contrast** `apple_published` — with Increase Contrast on, the app strengthens
    separation (thicker borders, higher-contrast colors, stronger outlines). FAIL: appearance unchanged.
12. **Accessibility · Reduce Transparency** `apple_published` — vibrancy/Liquid-Glass surfaces fall back to
    opaque legible backgrounds when Reduce Transparency is on. FAIL: translucent surfaces remain, harming
    legibility.
13. **Accessibility · Reduce Motion** `apple_published` — with Reduce Motion on, non-essential animation is
    removed or replaced by cross-fades; no parallax/auto-playing motion. (macOS IS listed in Apple's Reduced
    Motion ASC criteria.)
14. **Accessibility · Differentiate Without Color** `apple_published` — status, selection, required/invalid,
    chart/series distinctions use shape/text/icon/pattern in addition to color. FAIL: meaning by color alone.
    (macOS IS listed in this ASC criterion.)
15. **Accessibility · Full Keyboard Access & focus** `apple_published` — every control reachable/operable by
    keyboard alone; Minimize/Zoom invokable; a visible focus ring follows a logical order; standard shortcuts
    (Cmd-C/V/Z/S…) honored, none reassigned. FAIL: keyboard traps, no visible focus, clobbered shortcuts.
16. **Accessibility · VoiceOver semantics** `apple_published` — every control exposes role + label + value
    (VoiceOver speaks e.g. "Unsubscribe, checkbox"); custom controls implement roles/actions; context-menu
    actions via the actions rotor; meaningful images described, decorative hidden. (macOS IS listed in the
    VoiceOver ASC criterion.)
17. **Responsiveness & robustness** `platform_api_observed` — resizable window with sensible default +
    defined `NSWindow.minSize`; at minimum size important controls stay reachable (sidebar/inspector collapse
    gracefully); window state restored across launches; content reflows/columns wrap without 2-D scrolling;
    tolerant of Display Text Size + display zoom; RTL locales mirror leading/trailing layout + directional
    icons. FAIL: fixed-size single-window app (non-utility), controls clipped at min size, broken layout under
    text-scaling, no RTL mirroring. NOTE: the WCAG ~320px reflow figure is a REFERENCE analogue
    (`wcag_external`, informs-not-governs), not a macOS spec; the binding criterion is window-resize
    robustness. Mixed: resize/min/restore = `apple_published`; `NSWindow.minSize` = `platform_api_observed`.
18. **Motion & animation** `apple_published` — brief, purposeful (window/sheet/popover transitions,
    disclosures) reinforcing the spatial model; honors Reduce Motion. FAIL: gratuitous/long animations.
19. **Perceived performance** `inference` — long operations show progress immediately, window stays
    interactive, expensive content renders progressively, no main-thread blocking/beachball. (Apple offers
    loading guidance; the ~100ms responsiveness target is a general HCI heuristic, hence `inference`.)
20. **Forms & validation** `community_convention` — labels trailing/right-aligned per macOS form convention
    and grouped logically; inline specific validation; default button performs the primary action on Return,
    Esc cancels; logical tab order; required/invalid use icon+text not color alone. FAIL: ad-hoc label
    alignment, submit-only vague validation, keyboard-incomplete tab order. NOTE: the right-aligned-label
    convention = `community_convention` and SwiftUI `Form`/`LabeledContent` auto-alignment =
    `platform_api_observed`; do NOT cite the generic Layout page as proof of this macOS-specific rule.
21. **Feedback & affordances** `apple_published` — pointer hover states that don't change selection;
    appropriate cursors (resize/I-beam); destructive actions confirm via a sheet; selection respects accent +
    a second cue; success/failure acknowledged. FAIL: a macOS UI with NO hover affordances AND NO contextual
    menus; unconfirmed destructive actions.
22. **Internationalization / localization** `apple_published` — layouts tolerate text expansion (German/
    Finnish) without truncation; no concatenated strings; dates/numbers/currency localized; RTL mirroring for
    Arabic/Hebrew; menu titles/shortcuts localized while preserving standard command semantics. FAIL: clipped
    expanded strings, hardcoded English, no RTL mirroring.
23. **Platform-fit (RIGHT to use vs WRONG to borrow)** `apple_published` — RIGHT: menu bar, multiple
    resizable windows, window-attached sheets, popovers, panels/inspectors, source-list sidebars,
    customizable toolbars, traffic lights, pointer hover, right/Control-click context menus, full keyboard
    shortcuts, dense multi-column layouts, drag-and-drop. WRONG to borrow from iOS: bottom tab bar as primary
    nav, large-title navigation bars, 44pt-everywhere targets, one-CTA/minimal-controls dogma, no-dense-
    layouts, full-screen sheets for routine settings, hamburger replacing the menu bar, demanding an iOS
    Dynamic Type ramp.

**iOS defaults WRONG here:** demanding one prominent CTA / minimal controls; 44pt-everywhere; a bottom tab
bar as primary nav; "no dense layouts"; full-screen sheets for routine settings; a hamburger replacing the
menu bar; **requiring an iOS Dynamic Type ramp** (macOS uses Preferred Reading Size, not Dynamic Type).
