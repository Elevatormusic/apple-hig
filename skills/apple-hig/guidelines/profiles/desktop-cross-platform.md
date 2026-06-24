---
title: Desktop / Cross-Platform Software
platforms: [windows, linux, electron, qt, java]
value_type: profile
last_verified: 2026-06-23
---

# Desktop / Cross-Platform Software Rubric (host-OS conventions, NOT iOS/macOS chrome)

For software that is **neither Apple-native nor web**: Windows (Win32/WinUI/WPF/WinForms), Linux
(GTK/GNOME, Qt/KDE), Electron, Qt, Java/Swing/JavaFX.

## Scope & stance

Judge by **general HCI/usability principles PLUS the host OS's own conventions** (Microsoft Fluent /
Windows app design; GNOME HIG; KDE HIG; Nielsen/NN-g). The only thing carried over from Apple's HIG is its
**transferable, platform-agnostic PRINCIPLES** — clarity, deference (content over chrome), visual
hierarchy, consistency, never-color-alone, purposeful-motion-with-reduced-fallback — tagged `inference`
when applied to a non-Apple surface (transferring an Apple idea to non-Apple software is a judgment call,
NOT an Apple ruling). **NOTHING in this file is `apple_published`**, because Apple's HIG does not govern
Windows/Linux/Electron/Qt/Java.

**THE CARDINAL SIN:** never flag a Windows/Linux/Electron app for *lacking* iOS/macOS chrome (bottom tab
bars, nav bars, sheets, SF Symbols, the 44pt target, segmented controls, the macOS global menu bar,
traffic-light window buttons). The WRONG-to-borrow direction is the thing to flag.

## Authority routing (read first)

- Windows/Fluent → `community_convention` (learn.microsoft.com); GNOME → `community_convention`
  (developer.gnome.org/hig); KDE → `community_convention` (develop.kde.org/hig); Nielsen →
  `community_convention` (nngroup.com).
- Accessibility numbers (4.5:1 / 3:1, 24×24 CSS px, keyboard, focus, reflow/text-spacing tolerances) →
  `wcag_external` (W3C).
- Native a11y/theme APIs (UI Automation, AT-SPI2/ATK, ThemeResource/SystemColors) → `platform_api_observed`.
- Transferred Apple principles → `inference`.

---

## Dimensions

### 1 — Layout & spacing  `community_convention`
PASS: consistent spacing grid and alignment; readable line length (~45–90ch) constrained at large sizes;
related controls grouped with generous whitespace; respects host window padding/margins; baseline-aligned
vertical rhythm. FAIL: cramped/randomly-spaced controls, full-bleed body text with no max width,
magic-number insets ignoring the toolkit grid. Carry Apple's hierarchy/deference as `inference` only — do
NOT impose iOS safe-area or 8pt-grid specifics. — https://designsystem.digital.gov/components/typography/

### 2 — Typography & hierarchy  `community_convention`
PASS: the host OS UI font (Windows: Segoe UI Variable; GNOME: Cantarell/system; KDE/Qt: Noto Sans/system) or
a bundled licensed font — NEVER SF Pro/SF Compact off Apple platforms; a small consistent type ramp;
honors OS UI font-size/scaling. FAIL: SF fonts on non-Apple OS, >4–5 ad-hoc sizes, hierarchy by color
alone, ignoring OS text scale. Apple's "type creates structure" = `inference`; host font stacks/type ramp =
`community_convention`. (The Microsoft URL backs Segoe UI Variable + the type ramp only — NOT any
character-per-line metric.) — https://learn.microsoft.com/en-us/windows/apps/design/signature-experiences/typography

### 3 — Color, contrast & dark mode  `community_convention`
PASS: no hardcoded hex for UI surfaces — colors resolve from OS theme tokens (Windows ThemeResource/
SystemColors, GTK/libadwaita theme, Qt QPalette) so the app follows the OS light/dark setting and accent
color; pairs every custom color light/dark. FAIL: fixed colors that ignore the OS theme, light-only UI on a
dark-themed OS, hardcoded brand color that breaks under a user theme. Mixed: no-hardcoded-color principle =
`inference`; per-OS token mechanism = `community_convention`; theme APIs = `platform_api_observed`.
— https://learn.microsoft.com/en-us/windows/apps/design/style/color

### 4 — Text contrast (a11y)  `wcag_external`
PASS: body text ≥4.5:1, large text (≥18pt or ≥14pt bold) ≥3:1 against background in BOTH light and dark
themes; placeholder/hint also ≥4.5:1. FAIL: low-contrast gray-on-gray, brand-color text below ratio,
contrast that passes in only one theme. WCAG, never Apple. — https://www.w3.org/TR/WCAG22/#contrast-minimum

### 5 — Non-text / UI contrast (a11y)  `wcag_external`
PASS: meaningful icons, control boundaries, focus indicators, graphical state cues ≥3:1 against adjacent
colors (1.4.11). FAIL: 1px hairline borders or focus rings below 3:1, icon-only buttons whose glyph blends
into the surface. — https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html

### 6 — Pointer target size (a11y)  `wcag_external`
PASS: pointer targets ≥24×24 CSS px, OR smaller with adequate spacing / an equivalent larger control
(2.5.8). FAIL: <24px clickable icons packed adjacent with no spacing. EXPLICITLY: Apple's 44pt touch
minimum does NOT apply to pointer-driven desktop software — flag any rule that imposes it.
— https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html

### 7 — Keyboard operability & shortcuts  `wcag_external`
PASS: every action reachable by keyboard (2.1.1), NO keyboard traps (2.1.2); host-correct shortcuts — **Ctrl
(not Cmd)**, Alt/F10 reaches the menu bar, Alt+F4/Ctrl+Q quits, F1 help, the Menu/context key opens context
menus; mnemonics/access keys on labels; label precedes its control in focus order (GNOME). FAIL: macOS
Cmd-based shortcuts on Windows/Linux, mouse-only actions, no menu mnemonics. Mixed: operability/no-trap =
`wcag_external`; per-OS shortcut set + "label precedes control" = `community_convention`.
— https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html

### 8 — Visible focus & focus order  `wcag_external`
PASS: a clearly visible focus indicator on every focusable control (2.4.7), focus order follows reading/
logical order (2.4.3), focus moves into and is restored after dialogs; arrow-key directional navigation
within composite widgets (GNOME). FAIL: invisible/removed focus ring, focus jumps illogically, dialog opens
without taking focus. Mixed: focus = `wcag_external`; directional-arrow expectation = `community_convention`.
— https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html

### 9 — Screen-reader semantics / accessibility tree  `platform_api_observed`
PASS: controls expose name+role+state to the OS accessibility tree (Windows UI Automation; Linux AT-SPI2/
ATK) so NVDA/JAWS/Narrator/Orca announce them; icon-only buttons have accessible names; custom-drawn widgets
implement the a11y interface. FAIL: custom canvas controls invisible to AT, unlabeled icon buttons,
decorative images announced. **NOT VoiceOver (Apple-only).** Mixed: native widgets earn this free
(`community_convention`); the API contract = `platform_api_observed`; name/role/value maps to WCAG 4.1.2
(`wcag_external`). — https://learn.microsoft.com/en-us/windows/win32/winauto/uiauto-specifyinguiautomationproperties

### 10 — Components & controls (native widgets)  `community_convention`
PASS: the host toolkit's native controls (buttons, checkboxes, radios, combos, lists, trees, tabs) so they
inherit OS theme + a11y + IME; custom controls only when no native one fits, then they replicate native
keyboard/a11y/state behavior. FAIL: reimplemented combo/checkbox that misses keyboard or a11y, iOS-style
toggles/segmented controls pasted onto a Windows/Linux app, Electron app rendering web controls that ignore
OS conventions. Mixed: prefer-system-components is an Apple principle reused as `inference`; the
native-widget catalogue = `community_convention`. — https://learn.microsoft.com/en-us/windows/apps/design/controls/

### 11 — Menus, toolbars & command surfaces  `community_convention`
PASS: command model matches the host — Windows: menu bar and/or command bar/ribbon; GNOME: header bar with a
primary (hamburger) menu, **NO global menu bar** (the primary menu replaces the menu bar; a secondary menu
carries view/content actions); KDE: menu bar or hamburger, consistent toolbar. Destructive actions
de-emphasized; primary action placed per host. FAIL: importing the macOS global menu-bar model onto
Windows/Linux, hiding all commands behind a non-standard custom menu, iOS bottom tab bar as primary nav. All
`community_convention`; never `apple_published`. (menus.html backs the no-global-menu-bar/primary-menu rule;
cite header-bars.html separately for header-bar composition.)
— https://developer.gnome.org/hig/patterns/controls/menus.html

### 12 — Navigation & information architecture  `community_convention`
PASS: shallow hierarchy (GNOME: generally one level of depth); desktop-native patterns — sidebar/
master-detail, tabs, view switcher; a clear single primary task per window (GNOME "do one thing well");
Preferences/Settings in a standard location; a coherent window/document model (SDI vs MDI vs document windows
per host). FAIL: deeply nested drill-downs, mobile-style full-screen page stacks on a wide desktop window,
settings scattered or hidden. `community_convention` (GNOME/KDE/Nielsen); Apple clarity reused as
`inference`. — https://developer.gnome.org/hig/guidelines/navigation.html

### 13 — Content, writing & voice  `community_convention`
PASS: concise user-language labels (Nielsen "match the real world"), host-consistent capitalization
(Windows/GNOME favor sentence case for most UI), no jargon, button verbs describe the action; menu items
opening a dialog may use an ellipsis. FAIL: system jargon, inconsistent casing, vague buttons ("OK" where
"Delete"/"Save" is clearer). `community_convention` (Nielsen + host style); ellipsis/voice ideas reused as
`inference`. — https://www.nngroup.com/articles/ten-usability-heuristics/

### 14 — States: default/empty/error/loading/disabled/offline-no-permission/first-run  `community_convention`
PASS: first-run/unconfigured state guides setup; empty states explain + offer a first action; errors are
specific, recoverable, shown inline near the cause (Nielsen #9), not raw codes; loading uses determinate
progress when measurable, indeterminate/busy-cursor otherwise, and never freezes the UI thread; disabled
controls look disabled and ideally hint why; offline/no-permission degrade gracefully with a clear path.
FAIL: blank screen with no guidance, modal error dumps, spinner with a frozen window, ambiguous greyed
controls. `community_convention` (Nielsen + host patterns). — https://www.nngroup.com/articles/ten-usability-heuristics/

### 15 — Forms & validation  `wcag_external`
PASS: every field has a programmatically associated label (exposed to the a11y tree); validate inline with
clear specific messages and an error summary for long forms; use native input controls and OS pickers (date,
file) before custom; preserve user input on error; required/optional clearly marked. FAIL: placeholder-as-
label, validation only on submit with no field-level cues, custom date picker that loses keyboard/a11y.
Mixed: label/programmatic association = `wcag_external` (1.3.1); native-control preference =
`community_convention`. — https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html

### 16 — Feedback & affordances  `community_convention`
PASS: interactive elements show hover/pressed/focus/disabled states + an appropriate cursor; system keeps
the user informed of status (Nielsen #1); native tooltips for icon-only controls; prefer undo over
confirmation dialogs and avoid destructive-by-default (GNOME "Be Considerate"); confirm only truly
destructive, hard-to-undo actions. FAIL: dead-looking buttons with no states, silent long operations, modal
confirms for trivially-undoable actions. `community_convention` (Nielsen + GNOME).
— https://developer.gnome.org/hig/principles.html

### 17 — Notifications & background status  `community_convention`
PASS: passive status surfaced via the OS notification center, taskbar/dock badges, and tray icons per host
convention; non-urgent updates do not steal focus or block work; a tray/menu presence follows host
conventions. FAIL: a foreground modal for passive status, notification spam, hijacking focus for non-urgent
info, a tray icon with no purpose. `community_convention`.
— https://learn.microsoft.com/en-us/windows/apps/design/shell/tiles-and-notifications/adaptive-interactive-toasts

### 18 — Window management & resize robustness  `community_convention`
PASS: defines a sensible minimum window size and stays usable at it (GNOME desktop floor 1024×600; adaptive
apps scale to ~360×294); resize is smooth/glitch-free with stable widget positions; content reflows (wraps
lists, switches multi-pane to single-pane) rather than clipping; remembers window size/position; supports
maximize and OS snap/tiling; constrains body text to a max width at large sizes. FAIL: fixed-size/
non-resizable main window, clipped/overlapping controls on resize, content that never reflows, forgetting
window geometry. `community_convention` (GNOME adaptive); WCAG 1.4.10 reflow informs the wrap-not-clip
expectation. — https://developer.gnome.org/hig/guidelines/adaptive.html

### 19 — Reflow / text-scaling / zoom (a11y robustness)  `community_convention`
PASS (binding native criterion): honors the OS display-scaling and UI-text-size setting (per-monitor DPI on
Windows; GTK/Qt scale factors) without clipping or overlap; layout survives users enlarging the system font.
FAIL: text truncated/overlapping at 150–200% OS scale, fixed pixel layouts that ignore DPI, controls that
clip when the system font grows. NOTE: WCAG 1.4.10 (reflow at 320 CSS px) and 1.4.12 (text-spacing) are the
**ANALOGUE/backbone** here (`wcag_external`, informs-not-governs) — NOT a literal native gate; the binding
obligation is host display-scaling tolerance. Mixed: native scaling = `community_convention`; WCAG analogue =
`wcag_external`. — https://learn.microsoft.com/en-us/windows/win32/hidpi/high-dpi-desktop-application-development-on-windows

### 20 — OS high-contrast / forced-colors  `community_convention`
PASS: app remains fully usable when the OS high-contrast/contrast theme is active — Windows Contrast Themes
(Aquatic, Desert, Dusk, Night sky; constrained palette typically ≥7:1) require resolving colors from
SystemColor theme resources (ThemeResource) and FORBID hard-coded colors in the HighContrast dictionary;
Linux high-contrast theme respected via toolkit theming; informational color paired with text/shape. FAIL:
hard-coded colors that ignore the contrast theme, invisible borders/focus when forced colors apply, meaning
by color alone. Mixed: contrast-themes mechanism = `community_convention`; WCAG 1.4.1 backs the
not-color-alone clause (`wcag_external`). — https://learn.microsoft.com/en-us/windows/apps/design/accessibility/high-contrast-themes

### 21 — Motion & animation  `community_convention`
PASS: motion is purposeful (feedback, wayfinding, spatial continuity — Fluent "reactive, direct,
context-appropriate"), respects the OS "reduce/disable animations" setting with a non-animated fallback,
and is cheap (transform/opacity, paused off-screen/backgrounded). FAIL: gratuitous looping decoration,
motion that ignores the OS animation-off setting, layout/paint-thrashing animation. Mixed: honoring the OS
reduce-motion setting = `community_convention` (no AA SC mandates it — WCAG 2.3.3 Animation from Interactions
is **AAA / advisory**, not an AA gate); "motion with purpose" = `inference`; Fluent motion =
`community_convention`. — https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html

### 22 — Platform-fit (host conventions RIGHT vs WRONG to borrow)  `community_convention`
PASS: looks and behaves like a citizen of its host OS — native title bar/window controls in the OS position
and order (close-right on Windows/KDE, header-bar pattern on GNOME), OS menu/toolbar model, OS file dialogs,
OS notifications, native widgets so it inherits theme+a11y+IME; Electron/Qt apps adapt per-OS rather than
shipping one foreign skin. **FAIL (cardinal sin):** importing iOS/macOS chrome onto non-Apple software —
bottom tab bars as primary nav, the macOS global menu bar, SF Symbols, 44pt targets, traffic-light window
buttons on Windows, iOS-style sheets/segmented controls. Mixed: per-OS conventions = `community_convention`;
"defer to host, carry only principles" = the `inference` guardrail.
— https://learn.microsoft.com/en-us/windows/apps/design/basics/design-and-ui-intro

### 23 — Perceived performance  `community_convention`
PASS: UI responds to input within ~100ms or shows immediate feedback; the UI thread is never blocked by I/O
(work off-thread); long operations show determinate progress when measurable and a busy cursor / indeterminate
indicator otherwise; optimistic updates / skeleton content where appropriate; operations are cancelable.
FAIL: spinning/frozen window during work, no feedback on slow actions, hangs, non-cancelable long tasks.
`community_convention` (Nielsen response-time + host patterns).
— https://www.nngroup.com/articles/response-times-3-important-limits/

### 24 — Internationalization & localization (incl. RTL)  `community_convention`
PASS: all UI strings externalized/translatable; layout tolerates ~30% medium-string text growth (more for
short labels) without clipping; fully mirrors for RTL locales (layout, alignment, directional icons, progress
direction) using the toolkit's RTL support; locale-aware number/date/currency formatting; no text baked into
images. FAIL: hardcoded English strings, fixed-width labels that truncate when translated, no RTL mirroring,
concatenated sentence fragments. `community_convention` (host i18n frameworks); Apple's "design for RTL"
reused as `inference`. — https://developer.gnome.org/documentation/guidelines/localization.html

---

## Platform-fit notes

- **RIGHT to use:** the host OS's title bar / window controls (close-right on Windows/KDE, GNOME header
  bar), its menu/toolbar model, native file dialogs + pickers, OS notifications and tray, native widgets
  (free theme/a11y/IME), per-OS adaptation for Electron/Qt.
- **WRONG to borrow (cardinal sin):** iOS/macOS chrome on non-Apple software — bottom tab bars, the macOS
  global menu bar, SF Symbols, 44pt targets, traffic-light buttons on Windows, iOS sheets/segmented
  controls. Flag the transplant, never the absence.
- Apple's contribution here is **principles only** (`inference`): clarity, deference, hierarchy,
  consistency, never-color-alone, purposeful motion.
