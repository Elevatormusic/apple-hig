---
title: Universal Principles
source_url: https://developer.apple.com/design/human-interface-guidelines
platforms: [ios, ipados, macos, watchos, tvos, visionos]
value_type: universal
last_verified: 2026-06-14
---

# Universal Principles

> ⚠️ Seeded from the local Apple HIG reference report (2026-06). Apple's live HIG is
> JavaScript-gated and the "26" generation (Liquid Glass) is fast-moving — re-verify exact
> numbers at the `source_url` of each file before shipping.

These rules apply on **every** Apple platform. Platform-specific values live in `platforms/`,
exact numbers in files tagged `value_type: exact-spec`. Load this file for any HIG task.

## The three foundational principles (iOS 26 framing)

Apple now frames the system around **Hierarchy, Harmony, Consistency**, building on the
classic **Clarity, Deference, Depth** triad (both still underlie the system).

- **Hierarchy** — Establish a clear visual hierarchy where controls and interface elements
  elevate and distinguish the content beneath them.
- **Harmony** — Align with the concentric design of the hardware and software; match corner
  radii and insets to the device and to nested containers.
- **Consistency** — Adopt platform conventions so the design adapts continuously across
  window sizes, displays, and inputs.
- **Clarity** — Legible text, precise icons, purposeful adornments; functionality drives form.
- **Deference** — Content is primary; chrome defers to it (now expressed via Liquid Glass).
- **Depth** — Distinct visual layers and realistic motion convey hierarchy and vitality.

## Non-negotiable rules (apply everywhere)

1. **Defer to content.** Chrome (nav/tab bars, toolbars, sheets) floats above and serves the
   content; it never competes with it. See [[liquid-glass]].
2. **Prefer system components.** They bring free accessibility, Dynamic Type, RTL, and
   correct platform behavior. Build custom only when nothing fits.
3. **Use semantic, not hardcoded, colors.** `label`, `secondaryLabel`, `systemBackground`,
   `tint`/accent — never raw hex in UI. Semantic colors adapt to light/dark, contrast, and
   vibrancy automatically. See [[color]].
4. **Support Dark Mode** with paired light/dark values for every color, image, and material.
5. **Use built-in text styles** (Body, Headline, Title…) so **Dynamic Type** scales text.
   Never hardcode point sizes for body copy. See [[typography]].
6. **Respect safe areas and layout margins.** Avoid the notch / Dynamic Island, camera
   housing, Home indicator, bars, and overscan regions. See [[layout]].
7. **Meet minimum hit targets.** 44×44 pt on touch platforms; **60 pt on visionOS**; focusable
   elements on tvOS. See [[accessibility]].
8. **Meet contrast minimums** (WCAG): **4.5:1** for body text, **3:1** for large text
   (≥18 pt regular / ≥14 pt bold) and meaningful UI glyphs. Placeholder text must also hit 4.5:1.
9. **Never rely on color alone** to convey meaning — pair with text, shape, or SF Symbol.
10. **Honor accessibility settings:** Reduce Motion (crossfade alternatives), Reduce
    Transparency, Increase Contrast, Bold Text, Differentiate Without Color, VoiceOver labels
    on **every** interactive element (including icon-only buttons). See [[accessibility]].
11. **Use motion purposefully** — to show hierarchy and spatial relationships, not decoration;
    always provide a Reduce Motion alternative. **Animate cheaply:** prefer `transform`/`opacity`
    (compositor-only); don't loop-animate layout/paint properties (`width`, `box-shadow`, `clip`) or
    force layout every frame; avoid animating expensive `filter`/`backdrop-filter` blur; and **pause
    continuous animation when it's off-screen or the tab/app is backgrounded**. See [[motion]].
12. **Protect privacy.** Request data only when needed, in context, with clear purpose
    strings; minimize collection. See [[privacy]].
13. **Write in Apple's voice** — concise, specific, title- or sentence-style capitalization;
    menu/button text that opens a dialog ends with an ellipsis (…). See [[writing]].
14. **Design for RTL** — mirror layout and directional glyphs for right-to-left languages;
    SF Symbols mirror automatically. See [[right-to-left]].

## Platform selection (router input)

Pick the correct platform scope before applying values:

| If the target is… | Load platform file |
|---|---|
| iPhone app/screen | [[ios]] |
| iPad app, sidebar, split view, Stage Manager | [[ipados]] |
| Mac app, menu bar, windows, dense desktop UI | [[macos]] |
| Apple Watch, complications, Digital Crown | [[watchos]] |
| Apple TV, focus UI, Top Shelf, 10-foot UI | [[tvos]] |
| Vision Pro, spatial, windows/volumes, ornaments | [[visionos]] |
| **Web / Android** | Keep Apple **principles + tokens**, but defer to the *native* platform's conventions for chrome and navigation. Do **not** impose iOS chrome on the web by default. |

## Web & cross-platform note

Apple's HIG targets Apple platforms. When building for web or Android, keep the *principles*
(clarity, deference, accessibility, semantic color, type scale, spacing rhythm) and you may
reuse the *tokens* as a starting palette — but adopt the host platform's navigation patterns,
control metaphors, and system fonts. Flag any place where iOS chrome would feel foreign.

## Knowledge base map (load on demand — never dump the whole folder)

The reference mirrors Apple's HIG taxonomy. Load only the files relevant to the task.

- `foundations/` (20) — principles, liquid-glass, color, typography, layout, materials, icons,
  interface-icons, sf-symbols, images, motion, accessibility, inclusion, privacy, writing,
  right-to-left, branding, dark-mode, immersive-experiences, spatial-layout.
- `platforms/` (6) — ios, ipados, macos, watchos, tvos, visionos (device specs, navigation/input model).
- `components/` (63) — every Apple component: content (charts, image/text/web views), layout
  (boxes, collections, column/outline views, disclosure controls, labels, lockups, lists-and-tables,
  split-views, tab-views), menus & actions (buttons, menus, the-menu-bar, context/dock/edit menus,
  pop-up/pull-down buttons, activity-views, ornaments, home-screen-quick-actions, toolbars),
  navigation & search (tab-bars, sidebars, navigation-bars, path-controls, search-fields, token-fields),
  presentation (sheets, popovers, alerts, action-sheets, panels, scroll-views, windows, page-controls),
  selection & input (pickers, sliders, steppers, toggles, text-fields, segmented-controls, color-wells,
  combo-boxes, digit-entry-views, image-wells, virtual-keyboards), status (progress-indicators, gauges,
  activity-rings, rating-indicators), system experiences (widgets, complications, controls, snippets,
  status-bars, top-shelf, watch-faces, app-shortcuts).
- `patterns/` (27) — onboarding, launching, navigation, modality, feedback, loading, searching,
  settings, data-entry, drag-and-drop, multitasking, notifications, live-activities, charting-data,
  collaboration-and-sharing, file-management, going-full-screen, live-viewing-apps, managing-accounts,
  offering-help, playing-audio/video/haptics, printing, ratings-and-reviews, undo-and-redo, workouts.
- `inputs/` (13) — gestures, pointing-devices, keyboards, digital-crown, focus-and-selection, eyes,
  apple-pencil-and-scribble, game-controls, remotes, action-button, camera-control,
  gyroscope-and-accelerometer, nearby-interactions.
- `technologies/` (29) — AirPlay, App Clips, Apple Pay, CarPlay, HealthKit, HomeKit, iCloud,
  In-app purchase, Maps, SharePlay, Sign in with Apple, Siri, Wallet, VoiceOver, Generative AI,
  Machine learning, Mac Catalyst, and more (feature-integration guidance).
- `../references/design-tokens.md` — consolidated machine-readable tokens (colors incl. Mint/Cyan,
  type ramp, spacing, radii, control sizes) for the `/hig-tokens` command.

See also: [[principles]], [[accessibility]], [[licensing-and-assets]].
