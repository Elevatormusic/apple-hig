# Review Router — design spec

**Goal:** Restructure the design-reviewer around a **routing table** that decomposes a review into focused
per-subsystem passes (typography, controls, motion, states, microcopy, …). The router guarantees coverage,
keeps each pass focused, enables **targeted audits** (review only buttons / only motion), and **lazy-loads
only the routed subsystem's rules** into context — saving tokens on both axes.

**Why:** Today the reviewer does one holistic pass and carries broad rules in context. On a large UI that pass
thins itself across everything, so whole dimensions get skipped — the design-coverage gap audit's central
finding (motion, microcopy, states are the plugin's thinnest reviewed dimensions *because* nothing forces a
pass on them). A router fixes coverage (every applicable row gets a pass), focus (one subsystem at a time),
and cost (only the asked-for rows, only their rules loaded). It extends a pattern the plugin already uses:
the `apple-hig` skill is already a *router* for **which guideline files to load** — this lifts routing to
**which design areas to audit**.

## Architecture

Four units:

1. **The routing table** — `skills/apple-hig/references/review-router.md`. One row per design subsystem. Each
   row carries: the subsystem name; the **scopes** it applies to (element/component/screen/flow); a pointer
   to its **criteria** (the rubric dimension — the router *indexes* the rubrics, never re-states them); the
   **guideline file(s)** to load for it; and its **method** (`static` source-read, `probe` measured, or
   `both`). The router is a thin index + driver, not a second copy of the rules.

2. **The driver** — instructions in `agents/design-reviewer.md`: load the router first; from the request,
   resolve **which rows apply** (scope-gated, or an explicit `--only <areas>` filter); then audit **row by
   row**, loading each row's rules **on demand** and emitting findings tagged with the subsystem. A focused
   request loads only its rows' rules; a full review walks all applicable rows.

3. **Scope-gating + targeted filter** — the proportionality valve (element/component/screen/flow) maps to a
   default row set (a single button → `target-size · contrast · label/microcopy · control-states`; a screen →
   all applicable rows). An explicit filter (`/hig-review --only buttons,motion`) overrides it to exactly
   those rows. This is the token win: small/targeted reviews never load the rest.

4. **Fan-out for large reviews** — when a review spans many components, each routed row becomes a **fresh
   focused agent** (one per subsystem, in parallel) whose entire context is that one area — it can't lose
   focus, and a large app scales by farming rows out. (The existing benchmark/workflow machinery already does
   this fan-out shape.)

## The routing table (initial rows)

Each row = `subsystem · scopes · criteria(rubric dim) · guideline file · method`:

- Typography & type ramp · component+ · `static`
- Color / contrast / dark mode · component+ · `probe` (measured) + `static` (hardcoded-colour)
- Layout & spacing · component+ · `probe`
- Buttons & controls · element+ · `static` + `probe`
- Navigation & IA · screen+ · `static`
- **Motion & animation** · component+ · `static` (read `@keyframes`/`transition`/`prefers-reduced-motion`) + tokens
- **States** (default/empty/loading/error/offline/disabled) · component+ · `static` (read the source's branches)
- **Microcopy & consistency** · element+ · `static` (all label strings)
- Accessibility (contrast/targets/keyboard/SR/reduced-motion) · element+ · `both`
- Iconography & imagery · component+ · `static`
- Forms & validation · component+ · `both`
- Feedback & affordances · component+ · `static` + `probe`
- Platform-fit · screen+ · `static`
- Data-viz · component+ · `probe` (limited — custom paint)

## The three new routed subsystems (the gap-closers)

These are the rows the plugin can't do today; each is added with its criteria + method.

### Microcopy & consistency (static, deterministic from the labels)
Runs on every label/value string the reviewer can see (web DOM text, native descriptor labels, source
strings). **Authority discipline (research-validated 2026-06-24):** tag the *principles* `apple_published` but
the *detectors* `inference` built on them; the all-caps length threshold is `community_convention` (NN/g) and
the acronym rule is `wcag_external` (AAA → advisory). **Every check is advisory — none hard-fails a review** —
and several default **off / INFO**, especially in expert/pro-audience tools (in a pro-audio app `SNR`/`HEQ`
are house-standard, and per NN/g all-caps even *aids* short glanceable labels — so don't flag them).

- **Redundant copy (DRY)** — `apple_published` principle (Writing HIG: "be clear, concise… cut filler");
  detector is `inference`. Flag a normalized non-stopword content token appearing 2+× in one control's string,
  or once in a control **and** once in its section label, **only when a disambiguation guard confirms the
  child stays unambiguous without it**. Exempt brand names + intentional sibling parallelism (Left/Left,
  Min/Max). **Low / advisory, off-by-default** (high false-positive risk). (the `(virtual)` case.)
- **Casing consistency** — `apple_published` (Writing HIG endorses exactly title- or sentence-case applied
  consistently; all-caps is not a third style). Flag the same concept (normalized token sequence) shipped in
  2+ case patterns on one surface — pure self-contradiction, no judging which is "correct"; exclude acronyms/
  proper nouns. **The one deterministic, low-noise check — may be a soft `fail`.** Low–medium. **Do NOT cite
  WCAG 3.1.2** (it governs language, not capitalization).
- **Long all-caps readability** — `community_convention` (NN/g glanceable study: all-caps *aids* short labels
  but hurts long runs). Flag an all-caps string only when passage-style (**>2 words or >~15–20 chars**,
  tuneable `inference`) and not an acronym/unit; **exempt short eyebrow/section labels**. Low / **INFO-only**.
  (The W3C all-caps page is a non-normative wiki note — never attach a WCAG SC.)
- **Unexplained acronym** — `wcag_external` SC 3.1.4 Abbreviations + 3.1.3 Unusual Words (**both AAA → always
  advisory, never an A/AA fail**). Flag `^[A-Z]{2,6}[0-9]?` not on a **curated, configurable, audience-relative
  allowlist** (OK/USB/URL/…), with no expansion/gloss/tooltip in the same view; **exclude unit symbols
  (dB/Hz/ms)**. Low / INFO in pro-audience domains. (Don't tag the expansion requirement `apple_published`.)
- **Placeholder-glyph** — **split:** (a) no-value-token *standardization* (`—`/`-`/`N/A`/blank mixed for the
  same semantic) = `community_convention`/`inference`, advisory/off-by-default, fire only on like-for-like
  comparable slots; (b) `...`→`…` *correctness* = `apple_published`, low-noise, may default-on.
- **Destructive-verb** (advisory prompt-to-verify) — `apple_published` principle (Alerts HIG: a Cancel +
  Destructive style, confirm the un-undoable). Since confirm/undo is **invisible in a label string**, word it
  as *"confirm this Remove/Delete has a confirmation or undo"*, not an asserted violation. Strictly advisory;
  → medium **only** in the gated WCAG 3.3.4 (AA) case (persisted/legal/financial data, not a transient Reset).

**Net:** only casing-*inconsistency* surfaces as a near-fail; the rest are advisory, with redundant-copy,
glyph-standardization, and long-all-caps **off-by-default**. The router exposes per-check enable + an
audience profile (a "pro/expert tool" profile that drops acronym + all-caps to INFO).

### States (static, read the source's branches)
The source **declares every state** — including the ones the developer forgot (a fetch-and-render with no
empty branch *is* the missing empty state, visible in the code). For the component under review: find the
state model (enum / `isLoading`/`error`/`isEmpty` conditionals / `switch`), check each expected state is
handled, and review **each state's copy + recovery path** (and run the microcopy checks on every state's
strings, not just the rendered one). This catches "missing states" + "bad state copy" deterministically — the
thing a single render can't, because a render shows one state.

### Motion (static, read the animation code + tokens)
Read `@keyframes`/`transition`/`animation` (web), the animation calls (native), and the duration/easing
tokens: flag a layout/paint property being animated, a missing `prefers-reduced-motion`/reduce-motion
fallback, and (with motion tokens) ad-hoc durations. (Motion's runtime *feel* is still eyeball-only.)

## Static-read vs render/probe — the method split (honest)

The router's `method` column makes the division explicit:
- **`static` (read the code)** — best for: state coverage, destructive-handling, microcopy across all states,
  declared design values (hardcoded colour/font/size), motion code. Sees *all* states + behaviour, cheaply,
  and reveals *absence*.
- **`probe` (render & measure)** — best for the runtime-only facts: real layout/clip/overlap/duplicate
  geometry, effective contrast (incl. dynamic/custom colour), "does this state actually *look* right".

So `static = is it handled and is the copy/behaviour right`; `probe = does it render right`. Most of the
gap-audit's thin dimensions (states/microcopy/motion) are the static side — cheaper and broader.

## Token efficiency (the explicit win)

- **Targeted audit:** `--only buttons,motion` loads two rows' rules + audits two subsystems. No whole-UI pass.
- **Lazy rules:** each row's guideline/criteria load **only when that row runs** — the reviewer never carries
  the full ruleset; a focused audit's context is one subsystem's rules.
- **Scope-gate:** an element review never loads screen-level rows (nav/IA/data-viz).

## Honest limits

- The router **indexes** the rubrics; if a rubric dimension changes, the row must still point at it (a sync
  test guards row→rubric references so they can't dangle).
- Custom-painted UIs (graphs, bespoke controls) stay `measurable:false` — data-viz/graph-axes is snapshot/eye
  only, not deterministic.
- *Whole-app exhaustive* state/coverage is bounded by how much code the reviewer reads in one pass; per-
  screen/component routing is strong, a 200-file app covers what it's pointed at.
- The render/probe is still required for the layout/contrast layer — the router doesn't replace it, it
  schedules both as method-tagged rows.

## Testing

- **Router structural test:** every row references a real rubric dimension + an existing guideline file (no
  dangling), and declares a valid scope + method.
- **Microcopy checks:** unit-tested against the **exact EARS examples** as fixtures (`virtual ×3`,
  `COMBINE MODE`/`Combine mode`, `HEQ`, `—`/`-`, a `Remove` button) → assert each fires; negative fixtures
  (legit repeats, a real acronym with a gloss) → assert each does *not*.
- **State-coverage:** source fixtures with/without an empty/error/loading branch → assert the absence is
  flagged and the present-but-bad-copy case is flagged.
- **Scope-gating:** an element request loads only the element-scope rows; `--only` loads exactly the named
  rows.

## Scope (1.8.0)

IN: the router table + driver + scope-gating + `--only` filter; the three new routed subsystems (microcopy/
consistency, static state-coverage, motion) with criteria + tests. Fan-out is wired as the large-review path.
DEFERRED: a deterministic graph-axes check (custom-paint blind spot); whole-app exhaustive crawling.
