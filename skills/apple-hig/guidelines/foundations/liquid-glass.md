---
title: Liquid Glass
source_url: https://developer.apple.com/design/human-interface-guidelines/materials
platforms: [ios, ipados, macos, watchos, tvos, visionos]
value_type: platform-specific
last_verified: 2026-06-14
---

# Liquid Glass (the "26" generation, 2025–2026)

> ⏱️ **Fast-moving.** Liquid Glass shipped in iOS/iPadOS/macOS/watchOS/tvOS/visionOS **26**
> (announced WWDC25, June 9 2025) and was **refined at WWDC 2026** (June 8 2026), which
> announced iOS/iPadOS/macOS **27** (macOS 27 is named *Golden Gate*). The 27 refinements
> include a **user-facing transparency/personalization control**, **improved contrast and
> legibility**, **more consistent refraction**, and **sharper app icons**; on macOS,
> **standardized window borders/shapes** and **sidebar appearance changes** (sidebars expand
> and regain active-window color). This remains the same Liquid Glass design language
> (a 26 → 27 refinement, not a new system). **Treat every value here as version-dependent and
> re-verify on Apple as the HIG migrates from the 26 to the 27/Golden Gate generation.**

## What it is

Liquid Glass is a **dynamic material** — Apple calls it "a new digital meta-material that
dynamically bends and shapes light." Where older materials *scattered* light, Liquid Glass
**bends, shapes, and concentrates** light in real time. It combines the optical qualities of
glass with fluid motion and transforms depending on content and context. It is Apple's
"broadest software design update ever" and the biggest visual change since iOS 7's move to flat.

Characteristics:
- **Real-time lensing / refraction** of the content behind it.
- **Specular highlights** that respond to device motion.
- **Adaptive shadows** and **translucency** that adapt to the underlying content.

## Where it applies (and where it does NOT)

- ✅ Apply to the **navigation layer**: nav bars, tab bars, toolbars, sidebars, buttons,
  controls, sheets, alerts, popovers.
- ❌ Do **not** apply to **content layers** (lists, table rows, the main scroll content).
  Content stays opaque and legible; glass is reserved for chrome floating above it.
- **Exception:** transient/in-content controls (sliders, toggles, segmented pickers) can
  **lift up into / adopt Liquid Glass while active**, then settle back to their resting,
  non-glass state when interaction ends.
- One continuous glass layer per region — avoid stacking glass on glass (legibility + perf).

## Concrete iOS 26 changes

- **Tab bar** is a floating, inset, **pill-shaped capsule** (not full-width), with **search**
  often split out as a separate circular "island." See [[tab-views]].
- **Controls float** above scrolling content rather than sitting in opaque bars.
- **Scroll edge effects** — a fade + blur where content meets the status/nav/tab bars — keep
  bars legible as content scrolls under them.
- **App icons are layered** (assembled in **Icon Composer**) and adopt **light / dark / clear /
  tinted** appearances. See [[icons]].
- Concentric corner radii: control radius is concentric with its container and the display.

## Two variants: regular and clear

Apple's HIG defines **two** Liquid Glass variants — **regular** and **clear** — and they
should **never be mixed** in the same context:
- **Regular** is the versatile, adaptive default. It is usable over any content and adapts
  automatically for legibility.
- **Clear** has no adaptive behaviors and is permanently more transparent, for components
  layered over **rich media** (photos/video). Add a **dimming layer** (~35% opacity dark
  layer) behind clear when the background is bright; skip the dimming when the background is
  already dark enough, or for AVKit media controls.

## Performance

Glass blur (`backdrop-filter` on the web; system materials natively) is **GPU-expensive** — and
historically slower in some web engines (notably Firefox). Large or stacked blurs can hitch, especially
on re-entry/refocus, and **continuous motion under glass forces the blur to recompute every frame**.

- Keep glass on **chrome, not content**, and use **one** glass layer per region — don't stack blurs.
- Keep the **blur radius modest**; a smaller radius composites much faster.
- **Don't run live animation behind glass** — content moving under a `backdrop-filter` forces the blur
  to recompute every frame (see [[motion]]).
- For **off-screen or backgrounded** glass on the web, drop the blur to an **opaque fallback** (reuse
  the Reduce Transparency surface) so there are no live blur layers to rebuild; restore it when visible.
- Always ship the **Reduce Transparency / Increase Contrast** opaque fallback (below) — it's also the
  cheap path.

## APIs (for engineers)

- **SwiftUI:** `.glassEffect()`, `GlassEffectContainer`, `glassEffectID` for morphing
  transitions; `.buttonStyle(.glass)`. `.tinted(...)` is a SwiftUI **modifier** that colors a
  glass effect (e.g. `.glassEffect(.regular.tinted(...))`) — it is **not** a third variant.
- **UIKit/AppKit:** glass is applied by standard bars/controls automatically; custom glass via
  the platform's material/visual-effect APIs.
- **Pre-26 fallback:** the standard material set (`ultraThin … ultraThick`). See [[materials]].

## Accessibility caveat (important)

Liquid Glass transparency drew **legibility criticism** during the iOS 26 betas. Apple
responded by **increasing opacity** in navigation chrome and adding a **user-facing
transparency control**. Always:
- Honor **Reduce Transparency** (fall back to opaque chrome).
- Honor **Increase Contrast**.
- Verify text on glass meets contrast minimums over the *worst-case* background. See [[accessibility]].

## When NOT to chase Liquid Glass

On **web/Android**, do not emulate iOS glass chrome by default — it reads as foreign. Keep the
principle (chrome defers to content) using the host platform's own materials. See [[universal]].

See also: [[materials]], [[color]], [[motion]], [[icons]].
