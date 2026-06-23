---
title: Tab Bars
source_url: https://developer.apple.com/design/human-interface-guidelines/tab-bars
platforms: [ios, ipados, tvos, visionos]
value_type: exact-spec
last_verified: 2026-06-14
---

# Tab Bars

> 🔢 exact-spec / version-dependent. iOS 26 changed the tab bar shape significantly (floating Liquid
> Glass capsule). Re-verify on Apple as the HIG migrates from the 26 to the 27/Golden Gate generation.

## Purpose

A tab bar is the **bar control itself** that switches between an app's **top-level sections** (the
container/data model is the [[tab-views|tab view]]). Use it for flat, persistent peer sections — not
for actions (use a [[toolbars|toolbar]]) and not for sequential steps. See [[tab-views]].

## iOS / iPadOS specifics (exact)

- **2–5 tabs** on iPhone (a common convention — the current HIG says only "avoid adding too many tabs";
  more than 5 collapses into a system **More** tab), each an **SF Symbol + short label**; the selected tab
  uses the **filled** symbol variant + tint color. See [[sf-symbols]].
- **iOS 26:** the tab bar is a **floating, inset, pill/capsule shape** rendered in **Liquid Glass**
  (chrome-only; variants regular/clear) — it floats over content and is translucent, not glued to
  the bottom edge. The **scroll edge effect** keeps it legible. See [[liquid-glass]].
- **Search** is expressed as a dedicated search tab — `Tab(role: .search)` in SwiftUI, `UISearchTab`
  in UIKit — which the system renders as a **separate floating search button** (typically bottom-
  trailing) rather than a 5th list item. See [[search-fields]], [[searching]].
- Labels are **~10–11 pt** (approximate, system caption-style — not an Apple-published exact value)
  and **scale with Dynamic Type**. Tap target **≥44 pt** (60 pt visionOS). Provide the **Large
  Content Viewer** for large text.
- On iPad the system can present the same `TabView` as a **sidebar** in regular width. See
  [[sidebars]], [[split-views]], [[ipados]].

## Behavior

- Keep the same tabs available everywhere; selecting a tab **restores its prior navigation state**.
  Tapping the current tab scrolls to top / pops to root. Badge sparingly.
- The floating bar can **minimize on scroll** via the SwiftUI `tabBarMinimizeBehavior` modifier
  (`.onScrollDown`, `.onScrollUp`, `.automatic`, `.never`) — it **shrinks, it doesn't strand** the
  user. Don't fully hide it on scroll.
- An optional **accessory view** (e.g. a now-playing bar) can sit above the tab bar via
  `tabViewBottomAccessory`; when the bar minimizes the accessory tucks beside the minimized button.

## tvOS / visionOS

- **tvOS:** the tab bar runs across the **top**, focus-driven. See [[tvos]].
- **visionOS:** tabs appear as an **ornament** on the window's leading edge. See [[visionos]].
- Tab bars are **not** a macOS or watchOS pattern (use a [[sidebars|sidebar]] on Mac).

## SwiftUI

`TabView { Tab("Home", systemImage: "house") { … } }`; `Tab(role: .search) { … }` for the dedicated
search tab; `.tabViewStyle(.sidebarAdaptable)` to adapt to a sidebar on iPad;
`.tabBarMinimizeBehavior(.onScrollDown)`; `.tabViewBottomAccessory { … }`.

## Accessibility

Each tab needs a clear label + **selected trait**; never rely on color alone. Don't exceed 5 on
iPhone — overflow into "More" loses discoverability. Support Dynamic Type and the Large Content
Viewer. See [[accessibility]].

## Do / Don't

- **Do** keep 2–5 stable, equal-weight sections; mark selection with the filled symbol **and** tint.
- **Don't** put one-off actions in the tab bar, exceed 5 iPhone tabs, or hide the bar so the user
  loses their place.

See also: [[tab-views]], [[sidebars]], [[navigation-bars]], [[search-fields]], [[liquid-glass]], [[sf-symbols]], [[ios]]
