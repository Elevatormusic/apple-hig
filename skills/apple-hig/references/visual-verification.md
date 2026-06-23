---
title: Visual verification modes
source_url: https://www.w3.org/WAI/test-evaluate/conformance/wcag-em/
also: https://developer.apple.com/design/human-interface-guidelines/accessibility
last_verified: 2026-06-17
note: Defines the rendered modes a design review runs and the `level` (static|visual|full) each confers. Loaded by the design-reviewer (agents/design-reviewer.md).
---

# Visual verification modes

A design review's `level` reflects what was actually **rendered**. A static (code-only) review can never
be `verified-pass` — methodology precedent: **WCAG-EM** requires automated/static findings to be confirmed
by rendered/manual evaluation before conformance is claimed. Render with the Playwright MCP (or any live
preview); record `checksRun` / `checksSkipped` honestly.

## The modes

**Basic** — the minimum to reach `level: visual`:
- **Light** appearance
- **Dark** appearance
- **Narrow** viewport (compact width)
- **Wide** viewport (regular width)
- **Keyboard focus** — logical focus order + a visible focus indicator

**Accessibility:**
- **Largest Dynamic Type / 200% text** — check reflow, truncation, control growth (Apple Dynamic Type; on
  web, WCAG 1.4.4 Resize Text / 1.4.10 Reflow)
- **Increase Contrast** (Apple) / forced-colors (web)
- **Reduce Transparency** (Apple) — glass falls back to an opaque surface
- **Reduce Motion** (Apple / web `prefers-reduced-motion`) — the animation has a reduced alternative
- **Accessibility tree** — role, value, state, and reading order (not just a label)
- **Grayscale** — meaning must survive without color (WCAG 1.4.1 Use of Color)

**Hierarchy** (visual-weight tests):
- **Grayscale + blur / downscale** — reveals visual weight independent of label meaning; the dominant
  element and the attention order must read correctly. This is the single most revealing hierarchy test.
- Confirm the hierarchy holds under **dark**, **narrow**, **wide**, and **large-text**.

**UX states** — render each state that applies to the screen:
- **Happy path**, **Loading**, **Empty**, **Error**, **Disabled**, **Offline**, **Permission-denied**,
  **Destructive-confirmation**. (Loading/errors must not rely on color or motion alone; errors show a
  recovery path.)

## Level rules

- **static** — nothing rendered (code only); a static review can **never** be `verified-pass`.
- **visual** — the **Basic** modes ran (light/dark + narrow/wide + keyboard focus).
- **full** — every mode the screen type requires ran: Basic **plus** the applicable Accessibility,
  Hierarchy, and UX-state modes.

A **verified-pass** requires at least `level: visual`. A **hierarchy** finding at `confidence: high`
requires the **grayscale/blur** pass (otherwise cap its confidence at medium). Always list the modes you
ran in `checksRun` and the ones you skipped (and why) in `checksSkipped` — a skipped mode lowers `level`,
it does not silently pass.
