# Native JUCE / C++ design review

The plugin's "measure, don't guess" review normally needs a browser (Playwright/DOM). Native JUCE apps can't
render there — so they get a **design probe** instead: a drop-in C++ header walks the live `Component` tree
and emits a `native-render` descriptor JSON (+ a snapshot PNG) that the reviewer measures, producing real
`evidence: extracted` findings (contrast, geometry/target-size, duplicate/overlap, clip, hierarchy).

## 1. Instrument (one debug build)

Add the header and write a probe once the editor is **shown** (laid out + attached to a window — required for
accessibility and the snapshot):

```cpp
#include "juce-design-probe.h"   // skills/apple-hig/references/juce-design-probe.h

// in your PluginEditor, on the MESSAGE THREAD (e.g. a debug hotkey, or resized() once shown):
hig::writeDesignProbe (*getTopLevelComponent(),
                       juce::File::getSpecialLocation (juce::File::userDesktopDirectory).getChildFile ("hig-probe.json"),
                       juce::File::getSpecialLocation (juce::File::userDesktopDirectory).getChildFile ("hig-probe.png"));
```

The header is `#if JUCE_DEBUG`-guarded and header-only — no Projucer/CMake change (it reuses
`juce_core`/`juce_gui_basics`/`juce_graphics`). For the reflow stress axis, `hig::describeAtSize(root, w, h)`
re-walks at a different window size and restores.

## 2. Review

```
/hig-review hig-probe.json
```

The reviewer runs `reviewNativeDescriptor` and reports findings tagged `evidence: extracted`, plus the
**coverage ratio** and the snapshot for eyeballing the duplicate-row / clipped-caption class.

## State sweep (non-default control states)

`writeDesignProbe`/`describeComponentTree` **sweep** each control through its programmatically-driveable
visual states on the message thread (one synchronous block) and emit measured per-state colour samples. The
reviewer's state checker (tiers 1–3) diffs them. `describeAtSize` does **not** sweep — it is a layout-only
reflow probe.

**What is swept** (verified against JUCE 6.1.6 / 7.0.12 / 8.0.4 sources, 2026-07-02):

- **Button family** (`TextButton`, `ToggleButton`, `DrawableButton`, `ImageButton`, `ShapeButton`,
  `ArrowButton`, `HyperlinkButton`) → `normal` / `over` / `down` (`Button::setState` — public, visual-only,
  never clicks), `disabled` (`setEnabled(false)`), and `toggledOn` / `toggledOff` for toggle-capable buttons
  (`setToggleState(x, dontSendNotification)`).
- **Every other control** (`Slider`, `ComboBox`, `TextEditor`, `Label`) → `normal` / `disabled` only.
- **Skipped:** controls currently reporting `isEnabled()==false` (a disabled ancestor makes restore
  non-exact); components serving a cached component image (`setBufferedToImage` stale-pixel risk); and
  `TextEditor` **text content is never swept** (rewriting it destroys undo history + caret).

Each state emits `{ rgb:[r,g,b], alpha:0..1, grid?:16×[r,g,b] }` — the mean colour over the control's
rect **inset 20% per edge** (min 2px) out of a snapshot of the probed **root** (never the control itself:
`createComponentSnapshot` uses `ignoreAlphaLevel=true`, which would hide a control's own `setAlpha()`
dimming). `alpha` is always present; a fully transparent sample emits `rgb:[0,0,0]` with `alpha:0` (the
checker treats low-alpha as not-measurable). The top-level `sweep` block carries `sweptControls`,
`blindSpots`, and `sideEffects`.

**Declared side effects** (unsuppressable; the sweep restores logical state exactly but these behavioural
leaks are inherent — emitted verbatim in `sweep.sideEffects`):

- `state listeners fired on forced transitions` — `Button::setState` fires `buttonStateChanged` /
  `Button::Listener` / `onStateChange` on every forced transition.
- `async Value callbacks possible` — toggling a `juce::Value` (toggle/value state) posts an async, coalesced
  `Value::Listener` callback that no `NotificationType` suppresses; it observes the already-restored value.
- `focus may move if a swept child held it` — `setEnabled(false)` on a focused control moves focus to the
  parent (or gives it away) and does **not** return it on re-enable. In headless/unfocused contexts nothing
  is focused, so this is usually moot; the sweep re-grabs best-effort.

**Declared blind spots** (proven-unforceable states — emitted verbatim in `sweep.blindSpots`, surfaced by
the reviewer as "not checked"):

- `window-inactive styling` — `TopLevelWindow::isActiveWindow()` is read-only; no public forcing API.
- `focus visuals (window unfocused)` — `takeKeyboardFocus` bails when the window peer lacks OS focus, so a
  headless/unfocused sweep can never render the focus ring / V4 saturation boost.
- `hover (non-Button controls)` — Slider/ComboBox/TextEditor hover is mouse-position-driven with no public
  setter. Only `Button` hover is coverable (`setState(buttonOver)`).
- `pressed/drag visuals (Slider/ComboBox)` — Slider's being-dragged visual is set only inside real mouse
  handling; ComboBox has no forcing API, and its popup renders in a separate desktop window.

**Annotated fields (NOT emitted by the probe).** The descriptor schema also carries `recipe`, `appearance`,
and `primary` per element. The probe **cannot** know these and never emits them — they are added by the
**reviewing harness or the app author** so tier-3 can address a control into Apple's macOS recipe tables:

- `recipe` — `{ context, group, variant?, rowKey? }`, the control's address in `control-tokens-macos.md`.
- `appearance` — `'Light'` or `'Dark'`; **required** whenever `recipe` is present (a Dark app must not
  silently diff against the Light recipe).
- `primary` — `true` for a prominent/CTA control (escalates a tier-1 unstyled finding to `high`).

The structural emission test asserts only `states` + `sweep` (what the probe produces); the schema mirror
covers all of `states`/`recipe`/`appearance`/`primary`. This split is explicit, never silent.

**Reference aesthetic (tier 3, opt-in).** Pass `--aesthetic apple-macos` to diff the swept samples against
Apple's macOS control recipes:

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/native-review.mjs" hig-probe.json --aesthetic apple-macos
```

macOS is a **reference aesthetic here, not the authority of record** — a JUCE app is not a macOS app, so
these are `advisory` "reference aesthetic (macOS): …" findings, only for elements the harness/author gave a
`recipe` + `appearance`. Without the flag, only the universal tier-1 (inertness) and tier-2 (disabled-louder)
checks run.

## Honest limits (read these)

- **Message-thread only.** The probe's reads carry no assertion, so an off-thread call is *silent undefined
  behaviour*. Call it synchronously from the message thread.
- **Custom-paint blind spot (the big one).** Colours drawn inside a custom `paint()` are unreachable; those
  nodes are emitted `measurable:false`, `fg/bg: "not introspectable"`, and are **never contrast-scored**.
  Heavily custom pro-audio editors will have a *low coverage ratio* — that's reported, not hidden. Standard
  widgets (`Label`/`TextButton`/`TextEditor`/`Slider`/`ComboBox`/…) measure cleanly.
- **Contrast is an approximation.** `findColour` returns the *registered* colour, not the drawn pixel
  (`LookAndFeel` may blend/brighten/gradient). Treat contrast findings as a strong signal, confirmed by the
  snapshot.
- **Accessibility needs JUCE 6.1+ and a shown editor.** Role/value/state enrichment is opportunistic; the
  geometry/colour/snapshot core works on JUCE 6.0/6/7/8.
- **Never `verified-pass`.** A descriptor review is deterministic but not a pixel render — it reaches at most
  `advisory-pass`. (A true `verified-pass` would need real pixels — a future render path.)
- **RTL is not assessed** (JUCE has no bidi/layout-direction through JUCE 8). Stress = **reflow only** for v1;
  the optional `Desktop::setGlobalScaleFactor` axis is whole-UI zoom, not text-only growth.
- **Snapshot blanks** on `OpenGLContext`/`WebBrowserComponent`/`VideoComponent` subtrees (flagged
  `snapshotMayBeBlank`) — those aren't pixel-scored.
- **`duplicate` findings are advisory.** Two *legitimately* repeated controls of the same type, label, and
  size (e.g. a "Remove" button in each row of a list) are flagged as a `duplicate` "confirm against the
  snapshot" — geometry alone can't tell a paint-bug from intentional repetition. Confirm via the PNG before
  acting; an *overlapping* identical pair (`high`) is the strong paint-twice signal.
