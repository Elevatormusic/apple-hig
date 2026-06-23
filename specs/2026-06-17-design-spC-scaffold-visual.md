# SP-C — Scaffold v2 + visual-verification mode set (design spec)

**Part of:** the design-audit response. Sub-project C of four. Consumes SP-A's verdict/level model and
SP-B's platform rubrics. **Grounding is inherited** — every dimension here (interaction states, hierarchy,
the Apple "settings to honor" accessibility set, the WCAG-EM automated-then-rendered verification ladder,
deployment-target/API-availability) was already validated against primary sources in the SP-A and SP-B
research passes. SP-C introduces **no new authority claims**; it operationalizes the grounded ones into
the scaffold method and a rendered-verification reference. No fresh research pass required.

**Goal:** (1) make `/hig-scaffold` produce a product/IA/state/responsive **plan before code** instead of
jumping to styled output; (2) define the **rendered visual-verification mode set** that determines when a
review's `level` reaches `visual`/`full` — the piece the SP-A reviewer already references as "SP-C
expands the required mode set."

## Component 1 — Visual-verification mode set (new reference, loaded by the reviewer)

Create `skills/apple-hig/references/visual-verification.md`. It defines:

- **The modes**, grouped:
  - **Basic** (minimum for `level: visual`): light, dark, narrow (compact), wide (regular), keyboard
    focus order + visible focus indicator.
  - **Accessibility**: largest Dynamic Type / 200% text (reflow/truncation/control growth — Apple
    Dynamic Type; web WCAG 1.4.4/1.4.10); Increase Contrast / forced-colors; Reduce Transparency (glass →
    opaque); Reduce Motion; accessibility tree (role/value/state/reading order); grayscale (meaning
    survives without color — WCAG 1.4.1).
  - **Hierarchy** (visual-weight, audit UX-02): grayscale + blur/downscale reveals weight independent of
    label meaning — the dominant element and attention order must read correctly; confirm hierarchy holds
    under dark/narrow/wide/large-text.
  - **UX states** (render each that applies): happy, loading, empty, error, disabled, offline,
    permission-denied, destructive-confirmation.
- **Level rules:** `static` = nothing rendered → never `verified-pass`; `visual` = the Basic set ran;
  `full` = every mode the screen type requires ran (Basic + applicable Accessibility/Hierarchy/UX-state).
  A `verified-pass` needs ≥ `visual`; a hierarchy finding at `confidence: high` needs the grayscale/blur
  pass. Record `checksRun`/`checksSkipped` honestly.

Then update `agents/design-reviewer.md` "Visual verification" section (replace the "SP-C expands…"
placeholder at ~line 147) to load this reference and apply the level rules.

## Component 2 — Scaffold v2 (`commands/hig-scaffold.md` rewrite)

Insert a **plan-before-code** phase ahead of generation, and fix the audit findings:

1. **Screen definition / product assumptions** (audit UX-04, §12) — before any code, state: user; primary
   task; success condition; primary content; primary action (may be *none*); secondary/destructive
   actions; required states; navigation context; data density; accessibility risks; **deployment target**
   (min OS / SDK / fallback policy — audit P1-08/PLAT-01). If the request doesn't specify, infer + list
   the assumptions for the user to correct.
2. **Hierarchy plan** — page context → status → primary content → primary action → secondary controls →
   advanced/diagnostic. (Why information is ordered as shown.)
3. **State plan** — which of default/loading/empty/error/disabled/offline/permission-denied apply, and
   how each is handled (not color/motion alone; recovery for errors).
4. **Responsive plan** — compact/regular, large-text, landscape/resized, keyboard/pointer, RTL.
5. **Then generate code**, applying the plan + the platform's **design rubric** (SP-B): not iOS defaults
   everywhere — defer targets/spacing/nav/density to the platform (macOS dense + 28pt controls + menu
   bar; iPad restructure; tvOS focus + 56/66pt; visionOS 60pt gaze; web web-native).

Fixes folded in:
- **Deployment-target aware** — emit `#available` checks / legacy fallbacks where an API isn't in the min
  OS; don't default to Liquid Glass / current-gen APIs without confirming support (P1-08).
- **Rationale out of production code** (P2-11) — put the HIG/why in the **plan + summary**, not as a
  comment on every line; only comment genuinely non-obvious decisions.
- **Validate, don't assert** (P2-12) — drop "compliant by construction"; when tools are available,
  offer to compile/typecheck/render, and report what was and wasn't verified. Offer `/hig-review`.
- **Maps not forced** (P1-22/PLAT-05) — recommend MapKit where appropriate, state the provider as an
  assumption; don't mandate Apple Maps for every map.
- **Platform-correct targets/spacing** — replace the blanket "44×44 pt / 4-8 grid" with "platform-
  appropriate (see the platform design rubric)"; keep semantic colors, light+dark, Reduce Motion,
  animate-cheaply, and the web-defers-to-host rule.

## Testing approach

- `test/visual-verification.test.mjs` — the reference has the Basic/Accessibility/Hierarchy/UX-state mode
  groups + the level rules (`static`/`visual`/`full`) + the verified-pass-needs-visual rule; and the
  reviewer references the file.
- `test/scaffold-method.test.mjs` — `hig-scaffold.md` has the screen-definition/hierarchy/state/responsive
  phases *before* code, mentions deployment-target, keeps rationale out of production code, no longer says
  "compliant by construction", doesn't force MapKit, and defers to the platform rubric (not blanket 44pt).

## In scope vs deferred

- **SP-C:** the visual-verification reference + reviewer wiring; the scaffold rewrite; tests.
- **Not SP-C:** actually building a deterministic rendering/measurement engine (that's the deferred
  governance audit). SP-C defines the *procedure* the reviewer follows when a live preview exists.

## Plan (task breakdown)

- **Task 1:** visual-verification reference + reviewer wiring + test.
- **Task 2:** scaffold v2 rewrite + test.
