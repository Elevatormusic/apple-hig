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
