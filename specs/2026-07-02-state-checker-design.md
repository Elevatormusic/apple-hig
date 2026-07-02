# Recipe-consuming state checker (JUCE state sweep) — design spec

**Goal:** Measure control *state* styling instead of judging it: the JUCE design probe sweeps each
control through its programmatically driveable states, pixel-samples every state, and
`native-review.mjs` checks the results — deterministically for "states aren't styled at all" (the
motivating bug class), directionally for "disabled is louder than idle", and, opt-in, against the
actual `control-tokens-macos.md` recipes. Undriveable states become declared blind spots feeding
the 1.9.0 blind-spot verdict (invariant C).

All JUCE API facts below were adversarially verified against the juce-framework/JUCE sources
(master + 6.1.6 + 7.0.12 + 8.0.4) and docs; the recipe grammar was machine-verified against the
shipped reference files (382/382 cells parse; all 29 alias targets resolve). Research workflow
2026-07-02, two chains, both verified.

## Architecture (three units)

1. **Probe-side sweep** (`skills/apple-hig/references/juce-design-probe.h`, header-only, C++,
   `JUCE_DEBUG`-gated, message-thread-only — all as today): a new `hig::sweepStates(root)` used by
   `writeDesignProbe`, emitting per-element state samples into the descriptor.
2. **Descriptor extension** (`scripts/native-descriptor.mjs` + `schemas/native-render.schema.json`):
   additive, optional fields — per-element `states` and a top-level `sweep` block with the declared
   blind spots and side effects. Old descriptors stay valid.
3. **Checker** (`scripts/native-review.mjs` + a new `scripts/recipe-tokens.mjs` parser):
   `stateFindings()` implementing the three tiers; recipes parsed at review time from the shipped
   markdown (single source of truth — no generated twin).

## The sweep protocol (verified — ordering is load-bearing)

Per swept control, on the message thread, one synchronous block:

1. **Save** `{ isEnabled(), getToggleState(), getState() }` — plus the toggle states of **every
   same-`radioGroupId` sibling** (verified: `setToggleState(true, dontSendNotification)` silently
   un-toggles the rest of the group).
2. For each target state, **in this order**: set `setEnabled` / `setToggleState(...,
   dontSendNotification)` FIRST, force `Button::setState` LAST — verified:
   `enablementChanged()` → `updateState()` recomputes from the real mouse position and clears a
   forced state (and forces `buttonNormal` while disabled), so a forced over/down must be applied
   after everything else and snapshotted immediately.
3. **Snapshot the probed ROOT** (never the control itself — verified `ignoreAlphaLevel=true`
   caveat: a control dimming itself via `setAlpha` is invisible when snapshotting that control
   directly) with the existing portable 3-param `createComponentSnapshot(area, true, 1.0f)`;
   rendering is synchronous (`paintEntireComponent`), no message-loop wait. Pixel-sample the
   control's sub-rectangle via one `Image::BitmapData` read scope (on JUCE 8 the default snapshot
   image is native/Direct2D — a single BitmapData readback per state is the accepted cost).
   Sampling is **alpha-aware**: unpainted ARGB pixels read `a==0` (colour channels meaningless) and
   are excluded; the sample = mean colour + mean composite alpha + a coarse 4×4 downsample grid
   (enough to detect "identical" vs "changed" and directional lightness).
4. **Restore in reverse**: `setEnabled` → sibling + own `setToggleState(..., dontSendNotification)`
   → `setState(savedState)`.

**Sweepable states (verified inventory):** the whole `Button` family gets `normal`, `over`
(`buttonOver` — hover IS forceable for Buttons), `down`, `disabled`, and `toggled-on/off` where
applicable; every other component gets `normal` + `disabled` via `setEnabled`. Slider/ComboBox/
TextEditor extras are OUT for v1 (no reliable public visual-state forcing; mouse-event synthesis
was researched and rejected).

**Declared side effects (unsuppressable, restore-safe — the descriptor lists them):**
`buttonStateChanged`/`onStateChange` listeners fire on forced transitions; `juce::Value` listeners
on `getToggleStateValue()` fire asynchronously (coalesced, observing the restored value) regardless
of `dontSendNotification`; `setEnabled(false)` moves keyboard focus to the parent if a swept child
held it.

**Declared blind spots (proven unforceable → descriptor `sweep.blindSpots`, and the reviewer's
report inherits them under invariant C):** window-inactive styling (`isActiveWindow` is read-only,
set only from real OS focus events); keyboard-focus visuals whenever the window peer lacks OS focus
(`takeKeyboardFocus` bails on `!peer->isFocused()`); real hover for non-Button components.

## Descriptor extension (additive)

Per element (only when swept):

```json
"states": {
  "normal":   { "rgb": [r,g,b], "alpha": 0.94, "grid": [[...16 rgb triplets...]] },
  "down":     { ... },
  "disabled": { ... },
  "toggledOn": { ... }
}
```

Top-level:

```json
"sweep": {
  "sweptControls": 12,
  "blindSpots": ["window-inactive styling", "focus visuals (window unfocused)", "hover (non-Button)"],
  "sideEffects": ["state listeners fired on forced transitions", "async Value callbacks possible"]
}
```

`validateDescriptor()` accepts both old (no sweep) and new descriptors; new fields are
schema-validated.

## The recipe parser (`scripts/recipe-tokens.mjs`, dependency-free)

Implements the machine-verified grammar over `control-tokens-macos.md` +
`design-tokens-macos.md`: H1 context axis (CONTENT AREA / OVER-GLASS / GLOBAL LEFTOVERS), H2
control groups, H3 variants/appearance subsections; cell grammar for literal fills
(`` `#RRGGBB` α0.16 ``, `a=`/`α`/`(a1.0)` variants), multi-layer cells (`·` separator, draw
order), all alias-arrow forms (`-> System Colors / Blue (light)`,
`-> Fills / Dark Vibrant (plus-lighter).1 Primary`), `= Content Area` markers, em-dash absent
cells, blend tags, border/shadow syntax incl. the bold-width focus-ring strokes and U+2212
offsets. **Pinned by tests to the verified counts:** 29 tables, 109 data rows, 382 cells (0
unparseable), 158 alias arrows → 29 unique targets, 29/29 resolving against the token reference.
Exports `parseRecipes()` → a queryable structure and `compositeAlpha(layers)` = `1−∏(1−αᵢ)`.

## The three check tiers (reframed by the research — this is the key correction)

Apple's own recipes contain **23 idle==state equalities** (e.g. Bordered Tinted's disabled fill
equals idle) — so "each state must differ" would false-positive against Apple's own design.

- **Tier 1 — inertness (deterministic, universal, the motivating bug):** a control whose sampled
  pixels are **identical across ALL swept states** (normal/over/down/disabled within tolerance) is
  flagged — `unstyled control states`, severity medium (high when the control is a primary
  action), `evidence: extracted`. A single equal pair is NOT a finding (info at most) — Apple
  ships equal pairs.
- **Tier 2 — disabled direction (deterministic, universal default):** disabled must not be
  *louder* than normal — compared on **composited** alpha / whole-body contrast against the
  sampled background, never per-layer. Verified to hold across the recipe corpus as
  lower-composite-alpha or higher-ladder-tier; the finite exception set from the research ships in
  the checker as a suppression table. Severity low, `extracted`.
- **Tier 3 — recipe diff (opt-in, `aestheticProfile: "apple-macos"` in the review options):**
  sampled state colours diffed against the parsed recipes with alias resolution and the equality
  expectations as ground truth (an expected-equal pair that *differs* is as reportable as an
  expected-different pair that doesn't). Findings framed per the desktop-profile wiring:
  reference-grade on non-Apple hosts, never `apple_published` there. Severity advisory/low.

All three surface through the router's `states`/`buttons` rows; native reviews stay
`advisory-pass`-capped (extracted, not rendered pixels on glass), and sweep blind spots merge into
the report's `blindSpots[]`.

## Testing

- `test/recipe-tokens.test.mjs`: the pinned grammar counts; alias resolution 29/29; composite-alpha
  math; spot-checks (Bordered Light Idle `#000000 α0.08`, the 3.5px focus-ring stroke pair, a
  `= Content Area` row, an em-dash cell).
- `test/state-checks.test.mjs`: tier logic on synthetic descriptors — inert control fires; equal
  pair alone does not; disabled-louder fires; recipe-diff respects equality expectations;
  blind-spot pass-through into the report contract (invariant C interplay).
- `test/fixtures/native/ears-like.json` grows a swept control (one inert — the seeded bug — one
  healthy) + the `sweep` block; `test/native-path.test.mjs` assertions extend.
- Header changes reviewed line-by-line (Fable) against the verified J-claims; **compile validation
  is the maintainer's on-device step** (no JUCE toolchain on this machine — same honest caveat as
  v1.7.0, which shipped then hardened via the maintainer's real build).

## Scope

IN: the sweep (header), descriptor extension + validation, recipe parser, three tiers, router/
report wiring, tests, docs touch-ups (`native-juce-review.md`, router states-row method note).
OUT (later): web CSS static state-diff (phase 2 of the original decision), Slider/ComboBox visual
state forcing, mouse-event synthesis, window-inactive/focus/hover-beyond-Buttons (blind spots by
proof), iOS recipe tier-3 (macOS first; the parser is platform-parameterized for later).
