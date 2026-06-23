---
title: visionOS (Apple Vision Pro)
source_url: https://developer.apple.com/design/human-interface-guidelines/designing-for-visionos
platforms: [visionos]
value_type: exact-spec
last_verified: 2026-06-14
---

# visionOS (Apple Vision Pro)

> 🔢 **exact-spec / version-dependent.** Per-eye resolution is a teardown figure, not an Apple
> spec. Re-verify on Apple.

## Design tenets

**Spatial, immersive, comfortable.** Respect the person's space and body. Content lives in
**Windows**, **Volumes**, and **Spaces**; chrome uses **glass material** and **ornaments**.
Prioritize comfort — minimize fatigue and motion discomfort.

## Input model

- **Eyes + hands (indirect, preferred):** look to target, **pinch** to select; reduces arm
  fatigue. **Direct touch** for near objects. **Hover/look highlight** as feedback.
- **Minimum hit target 60 pt** (eye-tracking imprecision) — larger than the 44 pt touch floor;
  keep a **≥16 pt margin** around each target **or ≥60 pt center-to-center** spacing. Place primary controls within comfortable gaze
  range. See [[accessibility]].

## Spatial containers

- **Windows** — resizable 2D surfaces (SwiftUI), default ~**1280 × 720 pt**.
- **Volumes** — bounded 3D content (RealityKit) you can walk around.
- **Spaces** — Shared Space (apps coexist) vs a **Full Space** (immersive, your app only).
- **Ornaments** — controls anchored just outside a window's edge (e.g. a bottom toolbar/tab bar).

## Materials & depth

- Use the system **glass** window material; let real surroundings show through. Content is opaque
  for legibility; chrome is glass. See [[materials]], [[liquid-glass]].
- Use depth and parallax meaningfully; keep text crisp and frontal.

## Motion & comfort (critical)

- **Avoid moving the camera/viewpoint** and large field-of-view motion — it causes motion
  sickness. Keep a **stationary frame of reference** in immersive content; animate objects, not
  the world. Damp, gentle motion. Honor **Reduce Motion**. See [[motion]].

## Resolution

- Apple publishes "**23 million pixels**" total. A teardown estimate is ~**3660 × 3200 px per
  eye** (iFixit/UploadVR) — Apple does **not** publish a per-eye number. Don't design to pixels;
  design in **points** and at comfortable angular sizes.

## Conventions

- Hover effects on look; clear focus feedback. Comfortable reading distance and size.
- Don't crowd the field of view; leave breathing room. Respect passthrough and the user's room.

See also: [[materials]], [[liquid-glass]], [[motion]], [[accessibility]], [[layout]].

## Design rubric -- eyes + hands, spatial

- **Gaze target 60pt default**, with a **>=16pt margin around each target OR >=60pt center-to-center** spacing (eye-tracking imprecision; a 44pt iOS button is too small/tight). (apple_published -- Accessibility table / Eyes.)
- **Rounded interactive shapes** (eyes drift to corners; rounder is easier to hold gaze) that show the system look-highlight on gaze. (apple_published -- Eyes.)
- **Eyes + hands:** look to target, pinch to select, arms resting; reserve direct touch for nearby content; don't require reaching or precise drags. (apple_published -- Designing for visionOS.)
- **Right spatial container:** Windows (2D) for primary UI, Volumes for bounded 3D, Full Space only when needed; default to the Shared Space so the app coexists with others. (apple_published.)
- **Controls in ornaments** (floating just off the window edge, in a parallel z-plane), not in-window chrome or arbitrary floating panels. (apple_published -- Ornaments.)
- **Glass material over passthrough** plus a legibility check against an unpredictable real backdrop; let depth/scale convey hierarchy. (apple_published -- Materials.)
- **Motion comfort (critical):** keep a stationary frame of reference, animate objects not the viewpoint/world, avoid large/fast/peripheral/oncoming motion; in Full Space support the Digital Crown to adjust immersion / reveal passthrough and never trap the user. (apple_published -- Immersive experiences.)

**iOS defaults WRONG here:** 44pt targets / tight spacing; square interactive shapes; assuming a held multi-touch rectangle; treating the app as a full-screen 2D scene that owns the display; docking toolbars/tab bars in-window; opaque backgrounds; ignoring physical motion comfort.
