---
title: tvOS (Apple TV)
source_url: https://developer.apple.com/design/human-interface-guidelines/designing-for-tvos
platforms: [tvos]
value_type: exact-spec
last_verified: 2026-06-14
---

# tvOS (Apple TV)

> 🔢 Canvas + overscan are **exact-spec**. Re-verify on Apple.

## Design tenets

A **10-foot UI**: cinematic, simple, viewed from across the room by a group. Big type, big art,
focus-driven. Minimize text entry. Let content (posters, video) dominate.

## Input model

- **Focus model** with the **Siri Remote** (swipe/click) and game controllers — there is **no
  cursor**. The user moves a **focused** element; the focused item lifts with a subtle
  **parallax** tilt. Everything actionable must be **focusable** and visibly change on focus.
- Text entry is slow — minimize it; prefer selection, sign-in via phone, and dictation.

## Navigation model

- **Tab bar** across the top for sections; horizontal **shelves/collections** of artwork below.
- **Top Shelf** content when the app is focused on the Home Screen. See [[widgets]].
- Keep hierarchy shallow and predictable; the user navigates with directional moves.

## Exact values

- Design on a **1920 × 1080 pt** canvas. Renders **@1x** on HD and **@2x** (3840 × 2160 px) on 4K.
  Supply **@1x and @2x** assets.
- **Overscan safe margins:** keep title/action-safe content within **80 pt** of the left/right edges and
  **60 pt** of the top/bottom edges (don't place UI at the extreme edge).
- App icon: **800 × 480 px** landscape, **Parallax**, **2–5 layers** (background + foreground layers). See [[icons]].

## Conventions

- Large, legible type at distance; high contrast; generous spacing between focusable items.
  Default body text **29 pt**, minimum **23 pt**; tvOS supports **Dynamic Type**.
- Clear **focused state** (scale + parallax + highlight); never rely on color alone.
- Provide a clean **focus order**; group shelves logically. Support **Top Shelf** and screensaver
  aerials where relevant.
- Honor Reduce Motion (parallax). See [[motion]], [[accessibility]].

See also: [[ios]], [[tab-views]], [[layout]], [[motion]], [[icons]].
