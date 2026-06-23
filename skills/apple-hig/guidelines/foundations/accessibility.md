---
title: Accessibility
source_url: https://developer.apple.com/design/human-interface-guidelines/accessibility
platforms: [ios, ipados, macos, watchos, tvos, visionos]
value_type: exact-spec
last_verified: 2026-06-14
---

# Accessibility

> 🔢 Mixes universal rules and exact thresholds. Accessibility is **not optional** — design it in
> from the start. Re-verify on Apple.

## Contrast (exact)

- **4.5:1** minimum for **normal body text** (WCAG 1.4.3).
- **3:1** for **large text** (≥18 pt regular / ≥14 pt bold) and for **meaningful non-text** — essential
  glyphs/icons (e.g. icon-only-button symbols) and the boundaries/states of interactive UI components
  (WCAG 1.4.11; mirrors [color.md](color.md)). **Decorative**, **disabled/inactive**, and **logotype**
  elements are **exempt** — don't flag them.
- **Placeholder text** must also meet **4.5:1**.
- **Never rely on color alone** — pair color with text, shape, or SF Symbol (Differentiate
  Without Color).
- Test against the worst-case background behind translucent materials/glass.

## Hit targets (exact)

- **Design target: ≥44×44 pt** on touch platforms (iOS/iPadOS/watchOS) and **≥60×60 pt** on
  **visionOS** (eye-tracking imprecision). This is the operative design-review rule.
- 44×44 pt is Apple's **default** (recommended) control size; **28×28 pt** is the technical
  absolute minimum. Don't design down to the minimum — keep 44 (60 visionOS) as the target.
- ≥4 pt spacing/padding between targets.
- WCAG 2.2's 24×24 px floor is *looser* than Apple's — use Apple's.
- tvOS uses **focus**, not direct targets — every actionable element must be focusable.

**Per-platform control sizes** (Apple HIG, "Offer sufficiently sized controls"; default / minimum, pt):

| Platform      | Default     | Minimum     |
|---------------|-------------|-------------|
| iOS / iPadOS  | 44×44       | 28×28       |
| macOS         | 28×28       | 20×20       |
| tvOS          | 66×66       | 56×56       |
| visionOS      | 60×60       | 28×28       |
| watchOS       | 44×44       | 28×28       |

## Dynamic Type

- Support all **12** iOS sizes (7 standard + AX1–AX5). Use built-in text styles. See [[typography]].
- Provide the **Large Content Viewer** for fixed-size chrome (tab/tool/nav bar items) so users at
  large sizes can read them via long-press.

## VoiceOver & assistive tech

- Give **every interactive element** an accessibility **label** — especially **icon-only**
  buttons (the symbol name is not a label). Add **hints**/**values**/**traits** where useful.
- Ensure a logical **focus/reading order**; group related elements; expose state changes.
- Support **Switch Control**, **Full Keyboard Access**, **Voice Control**, and (visionOS) hands/eyes.

## Settings to honor

- **Reduce Motion** → crossfade alternatives (see [[motion]]).
- **Reduce Transparency** → opaque chrome (see [[materials]], [[liquid-glass]]).
- **Increase Contrast** → stronger separators/borders, higher-contrast colors.
- **Bold Text** → heavier weights; layout must not break.
- **Differentiate Without Color** → add shapes/labels to color-coded info.
- **Captions & audio descriptions** for media.

## Prefer system components

System controls bring accessibility **for free** (labels, traits, Dynamic Type, focus, RTL).
Custom controls must replicate all of it — a strong reason to use stock components. See [[universal]].

## Quick audit checklist

- [ ] Every target ≥44 pt (60 pt visionOS)
- [ ] Body & placeholder ≥4.5:1; large text & meaningful non-text/UI ≥3:1 (decorative, disabled, logotype exempt)
- [ ] Semantic colors; dark mode pairs present
- [ ] No info by color alone
- [ ] Dynamic Type works at xSmall and AX5
- [ ] VoiceOver labels on all controls incl. icon-only
- [ ] Reduce Motion / Reduce Transparency / Bold Text honored

See also: [[color]], [[typography]], [[motion]], [[inclusion]], [[materials]].
