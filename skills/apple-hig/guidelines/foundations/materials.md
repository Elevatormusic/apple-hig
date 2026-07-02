---
title: Materials & Vibrancy
source_url: https://developer.apple.com/design/human-interface-guidelines/materials
platforms: [ios, ipados, macos, watchos, tvos, visionos]
value_type: platform-specific
last_verified: 2026-06-14
---

# Materials & Vibrancy

> ⚠️ The "26" generation adds **Liquid Glass** on top of the classic material set — see
> [[liquid-glass]]. Re-verify on Apple.

## The standard material set (most → least translucent)

SwiftUI `Material`:

Apple HIG enumerates **four** standard iOS/iPadOS materials (in addition to Liquid Glass):
"iOS and iPadOS continue to provide four standard materials — ultra-thin, thin, regular (default),
and thick."

| Material | Recommended for |
|---|---|
| `.ultraThin` | Full-screen views that require a **light** color scheme |
| `.thin` | Overlay views that partially obscure onscreen content and require a **light** color scheme |
| `.regular` (**default**) | Overlay views that partially obscure onscreen content |
| `.thick` | Overlay views that fully obscure onscreen content and require a **dark** color scheme |

> Note: `.ultraThick` is available in the SwiftUI `Material` API. On **macOS** the design-resource
> export defines a full **Ultra Thick** material (light `#ECECEC` α0.88 / dark `#2C2C2C` α0.82) — see
> the macOS material table in [[design-tokens-macos]]. iOS/iPadOS HIG prose enumerates four standard
> materials (ultra-thin/thin/regular/thick); `.ultraThick` sits above that set.

Plus `.bar` / system chrome materials for bars. UIKit equivalent: `UIBlurEffect` styles
(`.systemUltraThinMaterial … .systemThickMaterial`, regular/prominent variants).

## Vibrancy

- **Vibrancy** tints content (text, symbols, fills) placed *over* a material so it picks up and
  blends with the blurred background — e.g. `.secondaryLabel` vibrancy on a bar.
- UIKit: `UIVibrancyEffect` layered on a `UIBlurEffect`. SwiftUI applies vibrancy automatically
  to standard controls over materials.

## When to use materials

- ✅ For **chrome over content**: bars, sidebars, sheets, popovers, notifications, control panels.
- ✅ To imply **depth and layering** (Depth principle).
- ❌ Don't stack materials (glass on glass) — it muddies legibility and costs performance.
- ❌ Don't put body content on a material if it threatens contrast.
- ❌ Don't **animate** a material's blur, and don't run **live motion behind** a material — the blur
  recomputes every frame; pause/drop it when off-screen or backgrounded. See [[motion]], [[liquid-glass]].

## Liquid Glass relationship

On 26+, standard bars/controls render as **Liquid Glass** automatically. Use `.glassEffect()`
for custom glass; the material set above is the **pre-26 fallback** and the Reduce-Transparency
fallback. See [[liquid-glass]].

## Accessibility

- Honor **Reduce Transparency** → materials become opaque; provide a solid background.
- Honor **Increase Contrast**.
- Verify text-on-material contrast against the **worst-case** content behind it. See [[accessibility]].

See also: [[liquid-glass]], [[color]], [[motion]].
