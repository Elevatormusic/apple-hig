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

## Design rubric -- focus, not touch

- **Everything actionable must be FOCUSABLE** with an obviously distinct focused state -- tvOS has no cursor or touch; the user moves a focus ring with the Siri Remote, so a non-focusable control is unreachable. (apple_published -- Designing for tvOS.)
- **Use the system focus effect** (parallax / lift / illumination via system views and `.focusable`/`focusEffect`), not a hand-rolled highlight; never convey focus by color alone. (apple_published.)
- **Target floor 66pt default / 56pt minimum** (larger than iOS 44pt), with generous spacing so focus moves cleanly and items don't merge at distance. (apple_published -- Accessibility control-size table.)
- **Overscan:** keep titles/actions/key UI within **80pt of the sides and 60pt top/bottom**. (apple_published -- Layout.)
- **Design for ~8+ feet:** large legible type, high contrast, edge-to-edge cinematic artwork as the hero; flag dense small type, low-contrast text over imagery, and phone-ported layouts. (apple_published.)
- **Minimize text entry** (remote typing is slow) -- prefer selection, sign-in via a nearby iPhone/QR, or dictation over on-screen keyboards. (community_convention -- follows from the remote/focus model.)
- **Top Shelf** dynamic content for top-row apps; a **layered parallax app icon** (not a flat square); honor Reduce Motion (damp the focus parallax). (apple_published -- Top Shelf / App icons / Accessibility.)

**iOS defaults WRONG here:** 44pt targets (tvOS floor is 56/66pt); an app-drawn pressed/selected tint as sufficient (use the system focus effect); assuming touch or a pointer; bezel-sized safe areas (tvOS adds 80/60pt overscan); dense small phone layouts.
