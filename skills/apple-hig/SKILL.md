---
name: apple-hig
description: Use whenever designing, building, styling, scaffolding, or reviewing ANY user interface, screen, view, component, layout, color, theme, typography, font, icon, symbol, spacing, motion, or navigation for an Apple platform (iOS, iPadOS, macOS, watchOS, tvOS, visionOS) — including SwiftUI/UIKit/AppKit code, buttons, tab bars, navigation bars, sheets, alerts, lists, forms, pickers, toggles, widgets, dark mode, Liquid Glass, accessibility/contrast/Dynamic Type, app icons, or design tokens — and whenever any app or website should follow Apple's Human Interface Guidelines (HIG). Also use when asked to review a UI for HIG compliance or to emit Apple design tokens.
---

# Apple HIG — router

This skill is a **router**, not the content. It points to a complete on-disk Apple HIG reference
under `${CLAUDE_PLUGIN_ROOT}/skills/apple-hig/guidelines/` (plus
`${CLAUDE_PLUGIN_ROOT}/skills/apple-hig/references/design-tokens.md`). The reference never fetches
Apple at runtime. **Load only the files relevant to the current task — never read the whole folder.**

> Path note: `${CLAUDE_PLUGIN_ROOT}` resolves to this plugin's install directory. If it ever appears
> unresolved (you literally see `${CLAUDE_PLUGIN_ROOT}`), find the files with Glob —
> `**/apple-hig/guidelines/**/*.md` and `**/apple-hig/references/design-tokens.md` — and use those.

> ⏱️ The reference reflects the **Liquid Glass** ("26") generation, refined at **WWDC 2026** into
> the **iOS/iPadOS/macOS 27 ("Golden Gate")** generation. Each file carries a `source_url` and a
> "verify on Apple" banner; treat exact numbers as version-dependent.

## How to route (do this every time)

1. **Always load first:** `guidelines/universal.md` — the non-negotiable rules + platform-selection
   table + the full knowledge-base map.
2. **Detect the target platform** (see cues below) and load the matching `guidelines/platforms/<platform>.md`.
   If several apply (e.g. a SwiftUI app for iPhone + iPad), load each.
3. **Load the topic files** for the task from the routing table below — components, foundations,
   and/or patterns. Load 1–4 files, not the whole tree.
4. **For exact numbers** (colors/hex, type ramp, spacing, radii, control sizes), load
   `references/design-tokens.md` (compact, iOS-led) — and for platform-exact values the matching
   platform token reference: `references/design-tokens-macos.md`, `references/design-tokens-ios.md`
   (full set), `references/design-tokens-watchos.md`, `references/design-tokens-visionos.md`; for
   control **state** styling (button/toggle/slider states, focus geometry) add
   `references/control-tokens-macos.md` / `references/control-tokens-ios.md`.
5. **Whenever fonts, SF Symbols, or templates come up,** load `guidelines/licensing-and-assets.md`
   and never bundle/redistribute Apple assets — link only.
6. **Apply, then cite.** When you state a spec, you can cite the file's `source_url`. Prefer system
   components and semantic values; design light + dark together; meet 44pt (60pt visionOS) targets
   and 4.5:1 / 3:1 contrast.

## Platform detection cues

| Signal | Platform file |
|---|---|
| iPhone; `UIKit`; iOS-only SwiftUI; compact width | `platforms/ios.md` |
| iPad; sidebar; split view; Stage Manager; Slide Over; Apple Pencil | `platforms/ipados.md` |
| Mac; `AppKit`/Mac Catalyst; menu bar; windows; pointer; dense desktop | `platforms/macos.md` |
| Apple Watch; complication; Digital Crown; SF Compact | `platforms/watchos.md` |
| Apple TV; focus engine; Top Shelf; Siri Remote; 10-foot UI | `platforms/tvos.md` |
| Vision Pro; spatial; window/volume/space; ornament; eyes + hands | `platforms/visionos.md` |
| **Web / Android / non-Apple** | Keep Apple **principles + tokens** but defer to the host platform's chrome/navigation. See the Web note in `universal.md`. Do **not** impose iOS chrome by default. |

If the platform is ambiguous, ask or infer from the project (Xcode project → Apple; `package.json`
+ React/Vue → likely web; React Native/Flutter → cross-platform mobile).

## Routing table — task keyword → files (all under `guidelines/`)

**Foundations**
- color, theme, palette, hex, tint, accent, semantic color → `foundations/color.md`
- font, text style, type ramp, Dynamic Type, leading, size → `foundations/typography.md`
- spacing, margins, grid, safe area, layout, size class, corner radius → `foundations/layout.md`
- material, blur, vibrancy, translucency, glass, Liquid Glass → `foundations/liquid-glass.md` + `foundations/materials.md`
- dark mode, light/dark, appearance → `foundations/dark-mode.md`
- app icon → `foundations/icons.md`; custom interface glyph → `foundations/interface-icons.md`
- SF Symbols, symbol → `foundations/sf-symbols.md`
- image, asset, @2x/@3x, photo → `foundations/images.md`
- motion, animation, transition, Reduce Motion → `foundations/motion.md`
- accessibility, contrast, VoiceOver, touch target, hit area, Dynamic Type → `foundations/accessibility.md`
- inclusion, localization, RTL → `foundations/inclusion.md` + `foundations/right-to-left.md`
- privacy, permission, purpose string → `foundations/privacy.md`
- copy, label text, capitalization, voice → `foundations/writing.md`
- brand, logo → `foundations/branding.md`
- principles, hierarchy/harmony/consistency → `foundations/principles.md`
- visionOS depth/placement → `foundations/spatial-layout.md`; immersion → `foundations/immersive-experiences.md`

**Components** (load `guidelines/components/<file>.md`)
- button, CTA → `buttons` | segmented control → `segmented-controls` | toggle/switch → `toggles`
- tab bar / bottom nav → `tab-bars` (+ `tab-views`) | nav bar / large title → `navigation-bars`
- toolbar → `toolbars` | menu / context menu / pull-down / pop-up → `menus` (+ `pop-up-buttons`, `pull-down-buttons`, `context-menus`) | macOS menu bar → `the-menu-bar`
- sidebar → `sidebars` | split view / multicolumn → `split-views`
- list / table / row → `lists-and-tables` | collection / grid → `collections` | outline → `outline-views`
- sheet / modal → `sheets` (+ pattern `modality`) | popover → `popovers` | alert → `alerts` | action sheet / confirmation → `action-sheets` | window → `windows` | panel → `panels` | scroll view → `scroll-views` | page dots → `page-controls`
- text field / form input → `text-fields` (+ pattern `data-entry`) | picker / date picker → `pickers` | slider → `sliders` | stepper → `steppers` | color picker → `color-wells` | search field → `search-fields`
- progress / spinner → `progress-indicators` | gauge → `gauges` | activity ring → `activity-rings` | rating → `rating-indicators`
- widget → `widgets` | complication → `complications` | Live Activity → `../patterns/live-activities` | Control Center control → `controls` | share sheet → `activity-views` | status bar → `status-bars`
- chart → `charts` | image view → `image-views` | text view → `text-views` | web view → `web-views`

**Patterns** (load `guidelines/patterns/<file>.md`)
- onboarding/first run → `onboarding` | launch screen → `launching` | navigation model → `navigation`
- modal/dismiss → `modality` | feedback/empty/error → `feedback` | loading/skeleton → `loading`
- search UX → `searching` | settings → `settings` | data entry/validation → `data-entry`
- drag & drop → `drag-and-drop` | multitasking/windowing → `multitasking` | notifications → `notifications`
- sharing/collaboration → `collaboration-and-sharing` | files → `file-management` | full screen → `going-full-screen`
- ratings prompt → `ratings-and-reviews` | undo → `undo-and-redo` | accounts/sign-in → `managing-accounts` | help → `offering-help` | audio/video/haptics → `playing-audio`/`playing-video`/`playing-haptics`

**Inputs** (load `guidelines/inputs/<file>.md`)
- gesture → `gestures` | pointer/trackpad → `pointing-devices` | keyboard/shortcuts → `keyboards`
- Digital Crown → `digital-crown` | focus (tvOS) → `focus-and-selection` | eyes (visionOS) → `eyes`
- Apple Pencil → `apple-pencil-and-scribble` | game controller → `game-controls` | Siri Remote → `remotes` | Action button → `action-button`

**Technologies** (load `guidelines/technologies/<file>.md`) — Apple Pay, Sign in with Apple, CarPlay,
HealthKit, HomeKit, iCloud, Maps, SharePlay, Wallet, App Clips, In-app purchase, Siri, VoiceOver,
Generative AI, Machine learning, Mac Catalyst, etc. Load when integrating that specific service.

## Related plugin tools

- **Reviewing existing UI code?** Dispatch the `design-reviewer` subagent (or run `/hig-review`).
- **Generating a compliant component/screen?** Run `/hig-scaffold`.
- **Need design tokens (css/tailwind/json/swiftui/react-native)?** Run `/hig-tokens`.
- **Want visual verification?** If the **Playwright MCP** is installed, after building or reviewing a
  UI, render it and screenshot it to confirm contrast, spacing, dark mode, and target sizes hold up at
  real pixels — not just in the code. (`/plugin install playwright@claude-plugins-official`)
- **On macOS with Xcode, want exact current values?** Run `/hig-sync` to cache live colors + Dynamic
  Type from the local SDK; tokens then prefer `~/.cache/apple-hig/live-tokens.json` over the bundled
  set. Set `HIG_SDK_SYNC=always|never|ask` (default `ask`) to control prompting.

## Don't

- Don't read the entire `guidelines/` folder — route to the few relevant files.
- Don't hardcode hex or point sizes for body text — use semantic colors + text styles.
- Don't impose Apple/iOS chrome on web or Android by default.
- Don't bundle or redistribute SF fonts, SF Symbols, or Apple templates — link only.
