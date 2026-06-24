# JUCE / C++ Design Probe — design spec

**Goal:** Extend the plugin's "measure, don't guess" review to native **JUCE/C++** UIs. A drop-in C++ probe
walks the live `Component` tree and emits a JSON descriptor (+ a snapshot PNG); the plugin runs its
**existing** measurement math on that descriptor → real measured findings (contrast / geometry / target-size
/ hierarchy) where introspectable, honestly scoped where not.

**Why:** 1.6.0's measuring features are browser-only (Playwright/DOM); SwiftUI/UIKit/JUCE fall to the static
tier, which can never be `verified-pass`. The EARS Bridge screenshot — a **duplicated status row**, **clipped
captions**, **orphaned meter labels** — is the motivating case: every one is a runtime *pixel* fact invisible
to source review. This is **sub-project A** of a 3-part native-measurement initiative (A: JUCE probe ·
B: SwiftUI/UIKit static extraction · C: SwiftUI `ImageRenderer`), sharing one descriptor schema + the
existing math + a new `evidence: extracted` tier.

**Validation:** Feasibility = **sound-with-adjustments** (4-area research-validation against JUCE docs +
source). Every API claim below is the *corrected* one.

## Global constraints

- **JUCE 6.1+** for the accessibility block (gated by a version macro); the JSON/geometry/snapshot core works
  on **6.0/6/7/8** unchanged.
- **Message-thread only.** The read methods carry no message-manager assertion, so off-thread use is *silent
  UB*, not a caught assert. The probe is called synchronously from `PluginEditor` code.
- **Header-only**, guarded `#if JUCE_DEBUG` (or an opt-in macro); every function `inline` (ODR). No
  Projucer/CMake change (reuses `juce_core`/`juce_gui_basics`/`juce_graphics`).
- **Authority:** the probe's values feed `evidence: extracted` — `wcag_external` / `community_convention`
  math, **never `apple_published`** (it's JUCE, not Apple).
- **Custom-paint is the dominant limit** (pro-audio JUCE is heavily custom-painted): measured contrast holds
  only for standard widgets; the spec scopes findings + emits a coverage ratio and **never over-claims full
  WCAG**.

## Architecture (five units)

1. **The probe** — `references/juce-design-probe.h` (header-only C++).
2. **The descriptor schema** — `schemas/native-render.schema.json`.
3. **Reviewer native path** — consumes a descriptor (+ PNG), runs the existing math.
4. **The `evidence: extracted` tier** — reviewer schema + verdict logic.
5. **Docs** — `skills/apple-hig/references/native-juce-review.md` (how to instrument + run).

---

## Unit 1 — the probe (`references/juce-design-probe.h`)

Entry points (both `inline`):
- `inline juce::String describeComponentTree (juce::Component& root)` — returns the JSON descriptor.
- `inline void writeDesignProbe (juce::Component& root, const juce::File& jsonOut, const juce::File& pngOut)`
  — descriptor + a single top-level snapshot PNG.

Behaviour, per the validated facts:
- **Tree walk:** recursive from `root` via `getNumChildComponents()` / `getChildComponent(int)` (or
  `getChildren()`); index 0 = back of z-order (record z-order).
- **Geometry → root logical space:** emit `root.getLocalArea (child->getParentComponent(), child->getBounds())`
  (transform/scale-aware); use `getBoundsInParent()` as the source rect when `setTransform()` may apply.
  Record `getScreenBounds()` and the snapshot `scaleFactor` separately; **all analysis geometry stays in root
  logical coords.**
- **Visibility/enabled:** record `isVisible()` (own flag) **and** `isShowing()` (this + ancestors) and
  `isEnabled()`.
- **Type:** a hard-coded `dynamic_cast` dispatch table over the standard widget set
  (`Label`/`TextButton`/`ToggleButton`/`TextEditor`/`Slider`/`ComboBox`/…), subclass-of-known → the base;
  everything else = `"custom/unknown"`. There is **no class-name API**; `getComponentID()`/`getName()`/
  `getTitle()` are developer-set hints only, never the type key.
- **Text (two paths):** generic via the accessibility **value interface**
  (`AccessibilityHandler::getValueInterface()->getCurrentValueAsString()` — real text for Button/Label/Slider/
  ComboBox) and specialized via `dynamic_cast` (`Label::getText` / `Button::getButtonText` /
  `TextEditor::getText`). Keep the control's **value** string (e.g. `"On"`/`"Off"`, slider numeric) in a field
  **separate** from its **label**, so the hierarchy math isn't fooled.
- **Font size:** emit `getFont().getHeightInPoints()` (NOT raw `getHeight()`, which overstates ~15–30%);
  guard the JUCE-8 sentinel `getHeight()==-1.0f` (point-constructed font) → read `getHeightInPoints()`. Record
  raw `getHeight()` and the active `Desktop` scale separately.
- **Colour:** standard-widget colours via `findColour(colourId, inheritFromParent)` with the verified
  ColourIds (pair `TextButton` text-OFF with `buttonColourId`, text-ON with `buttonOnColourId` by toggle
  state). **Two caveats emitted on every contrast-relevant node:** (a) `findColour` returns the *registered*
  colour, not the drawn pixel (`LookAndFeel` may blend/brighten/gradient) → contrast is an **approximation**;
  (b) a transparent/unset background means the real backdrop is the parent's paint → walk to the nearest
  opaque ancestor or sample the snapshot. For any custom-painted node (or transparent contrast-relevant id):
  emit `"colour": "not introspectable"` + fall back to snapshot pixel-sampling — **never fabricate a
  findColour-based contrast number.**
- **Toggle/state:** `getCurrentState().isCheckable()/isChecked()/isSelected()/isExpanded()` (NOT
  `role==toggleButton` — that role is not auto-assigned).
- **Accessibility (6.1+, best-effort, conditional):** `getAccessibilityHandler()` returns `nullptr` unless the
  component is **accessible AND attached to a native peer** (`getWindowHandle()!=nullptr`) → run the probe
  **post-realization (editor shown)**, not in the constructor, if AX data is wanted. The first call per node
  **allocates + fires a native `elementCreated` event** → call once per node and cache. Expose role/title/
  value/state; emit a **per-run coverage ratio** + a **per-node `measurable` flag**.
- **Snapshot:** `createComponentSnapshot(area, /*clip*/true, /*scale*/1.0f)` **once** on the top-level editor
  (it renders all children); use the **3-param** portable form (do NOT assert the 4-arg `ImageType` overload —
  it only exists on 8.0.8+/master, defaulted so calls still compile). `scaleFactor=1.0` for 1:1 pixel-to-geom
  (record it); guard the empty-`Image` early-return on zero-size/not-laid-out components; **flag
  `OpenGLContext`/`WebBrowserComponent`/`VideoComponent` subtrees as `"snapshotMayBeBlank": true`** and don't
  pixel-score them (wrap GL defensively — there's a crash report). Encode via
  `PNGImageFormat::writeImageToStream` into a `FileOutputStream`.
- **JSON:** build with explicit nested `DynamicObject` + `Array<var>` + `setProperty` (there is **no writable**
  `operator[]` — `json["a"]["b"]=x` does not compile). Set properties in a **fixed order** (NamedValueSet
  insertion order; deterministic within a JUCE version, **not** promised byte-stable across versions).
  Serialize with `JSON::toString` and write the file yourself.
- **Stress (v1 = REFLOW only):** `setSize()` to a value **different** from current → synchronous `resized()`
  → **re-walk in the same call** → diff geometry for new overlap/clip/offscreen (`setSize` is a no-op if
  unchanged; restore after). An **optional** whole-UI scale axis via `Desktop::setGlobalScaleFactor`
  (restore to 1.0), documented as **whole-UI zoom (text+geometry together), with host glitches — NOT
  text-only growth.** **RTL is CUT** and documented as a JUCE framework limit (bidi unimplemented through
  JUCE 8) — the probe never emits a misleading "RTL OK".

## Unit 2 — the descriptor schema (`schemas/native-render.schema.json`)

```
{
  "meta": { "juceVersion", "scaleFactor", "rootBounds", "snapshotPath", "shown", "axCoverageRatio" },
  "elements": [ {
    "id", "type", "role", "label", "value",
    "bounds": { "x", "y", "w", "h" },           // root logical coords
    "fg", "bg",                                   // hex or "not introspectable"
    "fgIntrospectable", "bgIntrospectable",
    "fontPt", "bold",
    "visible", "showing", "enabled",
    "checkable", "checked",
    "measurable",                                 // false → exclude from contrast scoring
    "snapshotMayBeBlank"
  } ]
}
```
Deliberately mirrors the DOM-probe output shape so the existing math consumes it unchanged.

## Unit 3 — reviewer native path

A new input mode: `/hig-review <descriptor.json>` (with the PNG alongside). The reviewer detects a native
descriptor (by its `meta`/schema) and:
- runs `wcag-contrast.mjs` on `measurable` introspectable fg/bg pairs → `evidence: extracted` contrast,
  **scoped to measurable nodes**, reporting the coverage ratio (never "full WCAG");
- runs the `layout-robustness` geometry on `bounds` → overlap / clip / sub-target-size, plus the reflow diff;
- runs `visual-weight` on bounds + colours → hierarchy ranking (the EARS duplicate-row class shows as two
  same-role nodes overlapping);
- runs an a11y-coverage check (unlabeled / role-missing) where AX is available;
- uses the **PNG** as the verify-by-eye artifact (the clipped-caption / orphaned-label class surfaces here).

## Unit 4 — the `evidence: extracted` tier

Add `evidence: extracted` between `inferred` and `computed`: deterministic from the live tree (stronger than
guessing) but **not a true pixel render**, so a JUCE native review can reach `advisory-pass` / flag with
confidence, but **NOT `verified-pass`** (reserved for real pixels — the future `ImageRenderer`/web path).
Update the finding schema, the verdict logic, and the validator.

## Data flow

dev adds the probe call → runs a debug build with the editor **shown** → probe walks the tree on the message
thread → writes `descriptor.json` + `snapshot.png` → `/hig-review descriptor.json` → reviewer runs the math →
findings (`evidence: extracted`) + the PNG.

## Error handling / honesty (the open risks, made explicit)

- **Custom-paint blind spot (dominant):** scope measured findings to the standard-widget subset; emit a
  coverage ratio; state qualitatively that the introspectable fraction of a real plugin UI may be a minority
  (EARS Bridge is heavily custom). Never over-claim.
- **AX fragility:** `nullptr` pre-realization + for many custom widgets → opportunistic enrichment, explicit
  null-handling, coverage ratio.
- **Off-thread = silent UB:** the header forces/documents message-thread-only usage.
- **Snapshot fidelity:** backend differences; GPU/Web/Video children blank → flagged, not scored; empty on
  not-laid-out → guarded.
- **Coordinate/scale + font-units:** reconcile to root logical space; record + divide out `scaleFactor`; use
  `getHeightInPoints()`.
- **Determinism:** JSON key order = NamedValueSet insertion (impl detail; not byte-stable cross-version).
- **Version-diff:** re-pin `createComponentSnapshot` arity, `Font` metrics, and AX members against the
  project's exact JUCE tag before relying on edge details.

## Testing strategy

**Built + TDD'd here (cross-platform, no JUCE needed):**
- The **descriptor schema** + a schema-validation test.
- A **golden descriptor fixture** (a JUCE screen encoded as JSON with known issues — a clipped label, a
  duplicated same-role row, a sub-target button, a custom-paint `measurable:false` node) → run the reviewer's
  native path → assert the expected findings + the coverage ratio + that contrast is NOT scored on
  `measurable:false` nodes.
- The **`evidence: extracted` tier** (ordering between inferred/computed; native never `verified-pass`).
- The native-path **reviewer wiring** (presence/structure tests, like the existing probe tests).

**User-gated (needs a JUCE toolchain — mirrors `hig-sync`/the SDK-bridge pattern):**
- **Compiling + running the C++ probe** on a real JUCE app (EARS Bridge) → produce a real descriptor + PNG →
  feed it back through `/hig-review`. The header is written + fresh-Opus reviewed here, but compile/run
  validation is owed on the user's JUCE setup (documented honestly, not claimed green).

## v1 scope

- **IN (real measured):** tree walk · geometry (root logical) · visibility/enabled · standard-widget type ·
  text · font (pt) · JSON descriptor · snapshot · reflow stress.
- **PARTIAL/scoped:** WCAG contrast (standard widgets only, registered-colour approximation, or snapshot
  pixel-sampling) · a11y enrichment (6.1+, shown, best-effort, coverage ratio).
- **DEFERRED/CUT:** RTL (CUT — JUCE limit) · text-only large-text (only optional whole-UI global-scale) ·
  full WCAG on custom-paint · pixel-perfect custom-`LookAndFeel` bounds · generalizing to Qt/wxWidgets.
