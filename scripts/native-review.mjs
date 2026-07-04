// Native review: consume a native-render descriptor (the JUCE design probe's output) and produce findings by
// reusing the plugin's existing measurement math — wcag-contrast (contrast), layout-robustness (overlap/
// target geometry), visual-weight (hierarchy). Findings are `evidence: extracted` (deterministic from the
// live component tree, but NOT a pixel render). Contrast is scored ONLY on introspectable (`measurable`)
// nodes; a coverage ratio is reported so a heavily custom-painted UI is never mistaken for "fully reviewed".

import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { contrastRatio } from './wcag-contrast.mjs';
import { boxesOverlap, overlapDepth } from './layout-robustness.mjs';
import { visualWeight } from './visual-weight.mjs';
import { validateDescriptor } from './native-descriptor.mjs';
import { parseRecipes, compositeAlpha } from './recipe-tokens.mjs';

const isLarge = (el) => el.fontPt >= 18 || (el.bold && el.fontPt >= 14);
const rect = (b) => ({ left: b.x, top: b.y, right: b.x + b.w, bottom: b.y + b.h });
// full containment = parent/child nesting (the probe emits a flat tree with absolute bounds), NOT a collision.
// A small tolerance absorbs residual window/border offsets so an edge-touching child still reads as nested.
const contains = (p, q, t = 2) => p.left <= q.left + t && p.top <= q.top + t && p.right >= q.right - t && p.bottom >= q.bottom - t;
const interactive = (el) => /button|toggle|slider|combo/i.test(el.type) || /button|link|slider|checkbox/i.test(el.role);

export function coverage(elements) {
  const total = elements.length;
  const measurable = elements.filter((e) => e.measurable).length;
  return { total, measurable, ratio: total ? measurable / total : 0 };
}

export function contrastFindings(elements) {
  const out = [];
  for (const el of elements) {
    if (!el.measurable || !el.fgIntrospectable || !el.bgIntrospectable) continue; // never score a custom-painted node
    if (!el.label && !el.value) continue;
    const ratio = contrastRatio(el.fg, el.bg);
    const floor = isLarge(el) ? 3 : 4.5;
    if (ratio < floor) out.push({ category: 'contrast', severity: ratio < floor - 1 ? 'high' : 'medium', element: el.id, ratio: +ratio.toFixed(2), evidence: 'extracted', message: `text contrast ${ratio.toFixed(2)}:1 is below ${floor}:1 (registered colours — an approximation of the drawn pixel)` });
  }
  return out;
}

export function geometryFindings(elements) {
  const out = [];
  const vis = elements.filter((e) => e.visible && e.showing);
  for (let i = 0; i < vis.length; i++) for (let j = i + 1; j < vis.length; j++) {
    const a = vis[i], b = vis[j];
    const ra = rect(a.bounds), rb = rect(b.bounds);
    const overlap = boxesOverlap(ra, rb) && overlapDepth(ra, rb) > 2;
    const nested = contains(ra, rb) || contains(rb, ra); // child inside its ancestor — not a collision
    const identical = a.type === b.type && a.label && a.label === b.label && a.bounds.w === b.bounds.w && a.bounds.h === b.bounds.h;
    if (identical) out.push({ category: 'duplicate', severity: overlap ? 'high' : 'medium', element: b.id, evidence: 'extracted', message: `identical "${a.label}" (${a.type}) appears twice — ${a.id} & ${b.id}${overlap ? ', overlapping (painted twice)' : ' (stacked — confirm against the snapshot)'}` });
    else if (overlap && !nested) out.push({ category: 'overlap', severity: 'medium', element: b.id, evidence: 'extracted', message: `${b.id} overlaps ${a.id} by ${overlapDepth(ra, rb)}px` });
  }
  for (const el of vis) if (interactive(el) && (el.bounds.w < 24 || el.bounds.h < 24)) out.push({ category: 'target-size', severity: 'medium', element: el.id, evidence: 'extracted', message: `${el.bounds.w}×${el.bounds.h}px target is below the 24px pointer floor (WCAG 2.5.8 — not Apple's 44pt)` });
  for (const el of vis) if (el.textOverflows) out.push({ category: 'clip', severity: 'medium', element: el.id, evidence: 'extracted', message: `"${(el.label || el.value || '').slice(0, 32)}" overflows its bounds and is clipped/truncated` });
  return out;
}

export function hierarchyFindings(elements) {
  const ranked = elements
    .filter((e) => e.visible && e.showing && (e.label || e.value))
    .map((e) => ({ el: e, weight: visualWeight({ area: e.bounds.w * e.bounds.h, contrast: (e.fgIntrospectable && e.bgIntrospectable) ? contrastRatio(e.fg, e.bg) : 4, filled: false, bold: e.bold }) }))
    .sort((a, b) => b.weight - a.weight);
  if (!ranked.length) return [];
  const top = ranked[0].el;
  return [{ category: 'hierarchy', severity: 'low', element: top.id, evidence: 'extracted', message: `dominant element by visual weight: ${top.id} ("${(top.label || top.value).slice(0, 32)}")` }];
}

// =========================================================================================================
// STATE CHECKER — three tiers over the JUCE state-sweep samples (descriptor `element.states`). All findings
// are `evidence: extracted` (deterministic samples of the live component tree, not a pixel render on glass).
// The reframing is research-verified (2026-07-02): Apple's own macOS recipes contain idle==state equalities
// (23 raw), so a naive "every state must differ" is WRONG — hence tier 1 is inertness-across-ALL-states,
// tier 2 is a one-direction threshold-gated "disabled louder" check, and tier 3 diffs against the actual
// recipes with the equality expectations as ground truth. See specs/2026-07-02-state-checker-design.md.
// =========================================================================================================

const SWEEP_STATES = ['normal', 'over', 'down', 'disabled', 'toggledOn', 'toggledOff'];
const RGB_TOL = 2;      // per-channel |Δ| ≤ 2 (of 255) counts as identical (research: V4 hover overlay ≈ 5% is a REAL delta)
const ALPHA_TOL = 0.01; // |Δalpha| ≤ 0.01 counts as identical

const hasRgb = (s) => s && Array.isArray(s.rgb) && s.rgb.length === 3 && s.rgb.every((n) => typeof n === 'number');
const chDiff = (a, b) => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2]));

// Two swept samples are "the same" iff mean rgb within RGB_TOL on every channel AND every co-indexed grid
// entry within RGB_TOL AND alpha within ALPHA_TOL. A missing grid on either side means "compare mean only"
// (graceful degradation — an empty/absent grid must not throw or force a false difference).
function samplesEqual(a, b) {
  if (!hasRgb(a) || !hasRgb(b)) return false;               // can't prove equality without both colours
  if (chDiff(a.rgb, b.rgb) > RGB_TOL) return false;
  if (Math.abs((a.alpha ?? 1) - (b.alpha ?? 1)) > ALPHA_TOL) return false;
  const ga = Array.isArray(a.grid) ? a.grid : [];
  const gb = Array.isArray(b.grid) ? b.grid : [];
  const n = Math.min(ga.length, gb.length);
  for (let i = 0; i < n; i++) {
    if (Array.isArray(ga[i]) && Array.isArray(gb[i]) && ga[i].length === 3 && gb[i].length === 3
      && chDiff(ga[i], gb[i]) > RGB_TOL) return false;
  }
  return true;
}

// A control is a "primary action" if the descriptor flags it — the sweep/probe signal for a prominent/CTA.
const isPrimaryAction = (el) => el.primary === true || el.prominent === true || /prominent/i.test(el.variant || '');

// ---- TIER 1: inertness ----------------------------------------------------------------------------------
// A swept control whose samples are identical across ALL its swept states is unstyled — the motivating bug.
// A single equal PAIR among otherwise-differing states is NOT a finding (Apple ships equal pairs).
function tier1Inertness(el) {
  const states = el.states;
  if (!states || typeof states !== 'object') return null;
  const present = SWEEP_STATES.filter((k) => states[k] && hasRgb(states[k]));
  if (present.length < 2) return null; // nothing to compare (only `normal`, or none measurable)
  // Inert = every swept pair equal. Compare each to the first; equality here is transitive within tolerance.
  const first = states[present[0]];
  const allEqual = present.every((k) => samplesEqual(states[k], first));
  if (!allEqual) return null;
  // A TWO-state all-identical sweep (typically normal+disabled — the only pair most non-Button controls can
  // drive) is often SANCTIONED: stock LookAndFeel_V4 paints linear sliders identically enabled vs disabled
  // and drawTickBox ignores state entirely, and Apple's own export ships 18 Disabled==Idle identities
  // (research 2026-07-02, J7-lnf4-direction-facts + directionModel). The medium/high unstyled finding
  // therefore requires ≥3 present states; a 2-state identical sweep is an info-severity note only.
  if (present.length === 2) {
    return {
      category: 'two-state-inert',
      severity: 'info',
      element: el.id,
      evidence: 'extracted',
      message: `control renders identically across its 2 swept states (${present.join('/')}) — may be sanctioned (stock V4 sliders/tickboxes and Apple's Disabled==Idle identities are identical by design); verify intent`,
    };
  }
  return {
    category: 'unstyled-control-states',
    severity: isPrimaryAction(el) ? 'high' : 'medium',
    element: el.id,
    evidence: 'extracted',
    message: `control renders identically across all ${present.length} swept states (${present.join('/')}) — states appear unstyled`,
  };
}

// ---- TIER 2: disabled-not-louder ------------------------------------------------------------------------
// Only when both `normal` and `disabled` exist. Metric: with an introspectable bg, compare WCAG contrast of
// the state mean-colour vs that bg — flag only when disabled contrast EXCEEDS normal by a clear margin.
// Else fall back to mean alpha — flag when disabled alpha > normal alpha + 0.05. One-direction,
// threshold-gated: even Apple's recipes violate naive dimming (the prominent accent-swap — dark disabled
// #0A99FF is BRIGHTER than idle #0091FF), so a symmetric "must be dimmer" rule would false-positive.
//
// The margin must clear Apple's own SANCTIONED louder-than-idle deltas (measured, research 2026-07-02,
// directionModel): the prominent accent-swap idle #0091FF → disabled #0A99FF = Δ+0.519 contrast points over
// black, and the sanctioned plus-darker overlay (CA Controls Light [Active, On]) ≈ Δ+0.57 over white —
// hence 0.75, not 0.5.
const CONTRAST_LOUDER_MARGIN = 0.75;
const ALPHA_LOUDER_MARGIN = 0.05;
const HUE_SWAP_DEG = 60; // normal→disabled hue rotation beyond this (at similar alpha) = a colour SWAP

// Hue in degrees (0-360) or null for achromatic colours (no meaningful hue).
function hueDeg(rgb) {
  const [r, g, b] = rgb.map((v) => v / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), c = max - min;
  if (c < 1e-6) return null;
  let h;
  if (max === r) h = ((g - b) / c) % 6;
  else if (max === g) h = (b - r) / c + 2;
  else h = (r - g) / c + 4;
  return (h * 60 + 360) % 360;
}

// Smallest angular hue difference; 0 when either side is achromatic (a gray has no hue to rotate).
function hueDelta(a, b) {
  const ha = hueDeg(a), hb = hueDeg(b);
  if (ha == null || hb == null) return 0;
  const d = Math.abs(ha - hb);
  return Math.min(d, 360 - d);
}

// Normalize the element's introspectable background to a numeric [r,g,b] — or null when unusable. The
// DESCRIPTOR SCHEMA types `bg` as a hex STRING ("#RRGGBB", or the literal 'not introspectable');
// contrastFindings() needs no parsing because contrastRatio's toRgb accepts hex natively, but tiers 2/3 do
// numeric work (hue rotation, recipe compositing) — guarding on Array.isArray(el.bg) alone made the contrast
// path unreachable on every schema-valid descriptor (N3). Accept the schema's hex string (parsed via the
// same hexToRgb the recipe layers use) AND the [r,g,b] array form used by internal/test callers.
function bgRgb(el) {
  if (!el.bgIntrospectable) return null;
  const bg = el.bg;
  if (Array.isArray(bg) && bg.length >= 3 && bg.slice(0, 3).every((v) => typeof v === 'number')) return bg.slice(0, 3);
  if (typeof bg === 'string' && /^#?[0-9a-fA-F]{6}$/.test(bg.trim())) return hexToRgb(bg.trim());
  return null;
}

function tier2DisabledDirection(el) {
  const n = el.states?.normal;
  const d = el.states?.disabled;
  if (!n || !d) return null; // only when both normal AND disabled samples exist
  const an = n.alpha ?? 1;
  const ad = d.alpha ?? 1;
  const bg = bgRgb(el);
  if (bg && hasRgb(n) && hasRgb(d)) {
    // A substantial hue rotation at similar alpha is a colour SWAP — export-style state feedback (Apple's
    // prominent variants swap accent colours rather than dim; research 2026-07-02, directionModel), not a
    // dimming failure. Raw contrast direction is meaningless across a swap — skip.
    if (hueDelta(n.rgb, d.rgb) > HUE_SWAP_DEG && Math.abs(ad - an) <= ALPHA_LOUDER_MARGIN) return null;
    const cn = contrastRatio(n.rgb, bg);
    const cd = contrastRatio(d.rgb, bg);
    if (cd > cn + CONTRAST_LOUDER_MARGIN) {
      return {
        category: 'disabled-louder', severity: 'low', element: el.id, evidence: 'extracted',
        message: `disabled contrast ${cd.toFixed(2)}:1 exceeds normal ${cn.toFixed(2)}:1 — disabled reads louder than idle`,
      };
    }
    return null;
  }
  // alpha fallback
  if (ad > an + ALPHA_LOUDER_MARGIN) {
    return {
      category: 'disabled-louder', severity: 'low', element: el.id, evidence: 'extracted',
      message: `disabled alpha ${ad.toFixed(2)} exceeds normal alpha ${an.toFixed(2)} — disabled reads louder than idle`,
    };
  }
  return null;
}

// ---- TIER 3: recipe diff (opt-in, apple-macos only) -----------------------------------------------------
// The descriptor state → the recipe's sparse state axis (Apple: 01=Idle, 03=Clicked, 04=Disabled; no hover).
const STATE_TO_RECIPE = { normal: 'Idle', down: 'Clicked', disabled: 'Disabled' };

// Export-sanctioned NO-SIGNAL identities (research 2026-07-02, directionModel): the 18 Disabled==Idle + 3
// Clicked==Idle cells that carry no state signal at the fill level — where Apple's export declares two states
// EQUAL, an observed difference IS the finding, and an observed equality is correct. Keyed
// context>group>variant>appearance>[stateA,stateB]. Only the tier-3-relevant (button/toggle-fill) entries
// are transcribed here; entries whose values alias across appearance are handled by the skip rules below,
// not by this table.
const EQUALITY_IDENTITIES = [
  // CA 02 Bordered Tinted: Disabled == Idle, both appearances (directionModel: "CA 02 Bordered Tinted Light+Dark").
  { context: 'CONTENT AREA', group: 'Buttons', variant: '02 — Bordered Tinted', appearance: 'Light', states: ['Idle', 'Disabled'] },
  { context: 'CONTENT AREA', group: 'Buttons', variant: '02 — Bordered Tinted', appearance: 'Dark', states: ['Idle', 'Disabled'] },
  // CA 03 Bordered Destructive: Clicked == Idle == Disabled, both appearances (directionModel: "CA 03 ... Light+Dark").
  { context: 'CONTENT AREA', group: 'Buttons', variant: '03 — Bordered Destructive', appearance: 'Light', states: ['Idle', 'Disabled'] },
  { context: 'CONTENT AREA', group: 'Buttons', variant: '03 — Bordered Destructive', appearance: 'Light', states: ['Idle', 'Clicked'] },
  { context: 'CONTENT AREA', group: 'Buttons', variant: '03 — Bordered Destructive', appearance: 'Dark', states: ['Idle', 'Disabled'] },
  { context: 'CONTENT AREA', group: 'Buttons', variant: '03 — Bordered Destructive', appearance: 'Dark', states: ['Idle', 'Clicked'] },
  // CA 02 Bordered Tinted Dark: Clicked == Idle (directionModel clicked-exceptions: "CA 02 Dark Clicked == Idle").
  { context: 'CONTENT AREA', group: 'Buttons', variant: '02 — Bordered Tinted', appearance: 'Dark', states: ['Idle', 'Clicked'] },
  // CA toggle-knob Dark fills: Disabled == Idle (directionModel: "CA Toggle knob Dark fills ... both").
  { context: 'CONTENT AREA', group: 'Knobs — Toggle', variant: 'Fills', appearance: 'Dark', states: ['Idle', 'Disabled'] },
];

// Cells whose direction/values are export-defined, NOT heuristic — skip tier-3 entirely on these
// (research 2026-07-02, directionModel, rule c):
//   - toggle-knob Clicked fills (incl. the in-doc `#FF0000` Figma authoring marker)
//   - any base layer that aliases across appearance (the "(**dark**)"-in-Light cases) — a pixel probe can't
//     reproduce a cross-appearance/vibrant blend, so its direction is not ours to judge.
function recipeCellSkipped(cells) {
  for (const c of cells) {
    if (c.kind !== 'fill' || !Array.isArray(c.layers)) continue;
    for (const l of c.layers) {
      // the Figma authoring marker (pure #FF0000) — never a shippable value
      if (l.hex && l.hex.toUpperCase() === '#FF0000') return true;
      // a fully-transparent placeholder toggle fill (Clicked = `#FFFFFF` α0) carries no colour signal
      if (l.hex && (l.alpha ?? 1) === 0) return true;
      // cross-appearance / vibrant alias ("(**dark**)"-in-Light, plus-lighter/plus-darker) → export-defined
      if (l.aliasRaw && (/\(\*\*(?:dark|light)\*\*\)/i.test(l.aliasRaw) || l.blend)) return true;
    }
  }
  return false;
}

// Composite a recipe fill cell's LITERAL layers (draw order, layer 0 = bottom) into a single {rgb, alpha}.
// `bg` (the element's introspectable background, or null) is what a translucent bottom layer composites over
// — a swept sample IS a composite over the real backdrop, so the recipe expectation must be too. Returns null
// when the cell has no literal fill we can reproduce (aliases-only, absent, translucent-with-no-known-bg) —
// tier 3 then has no ground truth to diff against and skips the state (never invents a value; research rule d).
function recipeExpectedColor(cells, resolve, bg) {
  const fills = cells.filter((c) => c.kind === 'fill' && Array.isArray(c.layers) && c.layers.length);
  if (!fills.length) return null;
  const cell = fills[0];
  // Resolve every layer to a literal {hex, alpha}; bail if any layer cannot be reproduced by a pixel probe.
  const lits = [];
  for (const l of cell.layers) {
    if (l.hex) { lits.push({ rgb: hexToRgb(l.hex), alpha: l.alpha ?? 1 }); continue; }
    if (l.aliasRaw) {
      if (l.blend) return null; // blend-mode layer — not literally reproducible
      const r = resolve(l.aliasRaw);
      if (!r || !r.hex) return null;
      lits.push({ rgb: hexToRgb(r.hex), alpha: r.alpha ?? 1 });
      continue;
    }
    return null;
  }
  const cAlpha = compositeAlpha(lits);
  // If the whole stack is translucent (composite alpha < ~1), the on-screen colour depends on the backdrop.
  // Composite over a known introspectable bg; without one we cannot reproduce the sampled pixel → skip.
  let acc;
  if (cAlpha < 0.999) {
    if (!Array.isArray(bg) || bg.length < 3) return null;
    acc = bg.slice(0, 3);
  } else {
    acc = lits[0].rgb.slice(); // opaque bottom layer
  }
  const startIdx = cAlpha < 0.999 ? 0 : 1;
  for (let i = startIdx; i < lits.length; i++) {
    const { rgb, alpha } = lits[i];
    acc = acc.map((c, k) => rgb[k] * alpha + c * (1 - alpha));
  }
  return { rgb: acc.map(Math.round), alpha: cAlpha };
}

function hexToRgb(hex) {
  const h = String(hex).replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

const RECIPE_DIFF_TOL = 8; // per-channel tolerance for "the sample matches the recipe" (probe/quantisation slack)

// Lazily parse the two macOS token references once per review (read relative to THIS script, like the other
// reference reads in the repo). Cached so a whole descriptor is one parse.
let _recipes = null;
function loadMacosRecipes() {
  if (_recipes) return _recipes;
  const ref = (p) => readFileSync(new URL('../skills/apple-hig/references/' + p, import.meta.url), 'utf8');
  _recipes = parseRecipes({ controlTokensText: ref('control-tokens-macos.md'), designTokensText: ref('design-tokens-macos.md') });
  return _recipes;
}

// True when tier 3 OWNS this element (apple-macos profile + a recipe address) — tier 2 defers to it.
function tier3Covers(el, opts) {
  return opts && opts.aestheticProfile === 'apple-macos' && el.recipe && el.recipe.context && el.recipe.group;
}

function tier3RecipeDiff(el, recipes) {
  const out = [];
  const { context, group, variant } = el.recipe;
  const appearance = el.appearance || 'Light'; // descriptor may carry the sampled appearance; default Light
  const states = el.states || {};
  // Human-readable address for messages — never prints a literal `undefined` when variant is absent (D1).
  const addrLabel = [group, variant].filter(Boolean).join(' / ');

  // Expected color per recipe state, from the parsed recipes (skipping export-defined cells).
  const expected = {};   // recipeState -> {rgb, alpha} | null
  const skipState = {};  // recipeState -> true when the cell is export-defined (toggle clicked, cross-appearance)
  for (const recipeState of ['Idle', 'Clicked', 'Disabled']) {
    const cells = recipes.get(context, group, variant, appearance, recipeState);
    if (!cells.length) { expected[recipeState] = null; continue; }
    // UNAMBIGUOUS-CELL GATE (D1): an address like {context, group} alone can match SEVERAL recipe rows
    // (e.g. CA Controls: Active/Inactive × Off/On). We cannot know which row this control IS — diffing
    // against an arbitrary fills[0] false-flags correct controls. >1 distinct (variant, rowKey) among the
    // matched fill cells → skip the state entirely (skip, never guess).
    const fillCells = cells.filter((c) => c.kind === 'fill' && Array.isArray(c.layers) && c.layers.length);
    const addrs = new Set(fillCells.map((c) => `${c.variant ?? ''}\u0000${c.rowKey ?? ''}`));
    if (addrs.size > 1) { expected[recipeState] = null; continue; }
    if (recipeCellSkipped(cells)) { skipState[recipeState] = true; continue; }
    const bg = bgRgb(el); // schema hex-string bg OR internal [r,g,b] — normalized for the composite (N3)
    expected[recipeState] = recipeExpectedColor(cells, recipes.resolve, bg);
  }

  // (1) Equality identities: where the recipe declares two states EQUAL, an observed difference is a finding.
  // Coverage bookkeeping (D3): a VIOLATED identity owns BOTH its states (one defect → one finding, never the
  // double-count "idle==disabled differ" + "disabled ≠ expected"); an identity that HOLDS excludes only the
  // partner and keeps ONE representative in the value-diff loop — a consistently-wrong pair (both states
  // equal AND both off the recipe colour) must still be caught. A missing partner sample marks nothing
  // (the present state stays value-diffable).
  const identityCovered = new Set();
  for (const id of EQUALITY_IDENTITIES) {
    if (id.context !== context || id.group !== group || id.variant !== variant || id.appearance !== appearance) continue;
    const [ra, rb] = id.states;
    if (skipState[ra] || skipState[rb]) continue;            // one side is export-defined → not ours to judge
    const da = descriptorStateFor(states, ra);
    const db = descriptorStateFor(states, rb);
    if (!hasRgb(da) || !hasRgb(db)) continue;                // need both samples — a missing partner un-checks nothing
    if (chDiff(da.rgb, db.rgb) > RECIPE_DIFF_TOL) {
      identityCovered.add(ra); identityCovered.add(rb);      // violated → owned; suppress the value-diff echo
      out.push({
        category: 'recipe-state-diff', severity: 'advisory', element: el.id, evidence: 'extracted',
        message: `reference aesthetic (macOS): recipe declares ${ra}==${rb} for ${addrLabel} but the samples differ (${fmt(da.rgb)} vs ${fmt(db.rgb)})`,
      });
    } else {
      identityCovered.add(rb);                               // holds → keep ra as the representative value-diff
    }
  }

  // (2) Value diffs: where the recipe declares a concrete literal colour for a state, the sample should match.
  for (const recipeState of ['Idle', 'Clicked', 'Disabled']) {
    if (skipState[recipeState]) continue;                    // export-defined (e.g. toggle Clicked) → skip
    if (identityCovered.has(recipeState)) continue;          // owned by an equality identity above (1)
    const exp = expected[recipeState];
    if (!exp) continue;                                      // no reproducible literal / ambiguous → nothing to diff
    const sample = descriptorStateFor(states, recipeState);
    if (!hasRgb(sample)) continue;
    if (chDiff(sample.rgb, exp.rgb) > RECIPE_DIFF_TOL) {
      out.push({
        category: 'recipe-state-diff', severity: 'advisory', element: el.id, evidence: 'extracted',
        message: `reference aesthetic (macOS): ${addrLabel} ${recipeState} sampled ${fmt(sample.rgb)} but the recipe expects ${fmt(exp.rgb)}`,
      });
    }
  }
  return out;
}

// Map a recipe state name back to the descriptor sample (normal↔Idle, down↔Clicked, disabled↔Disabled).
function descriptorStateFor(states, recipeState) {
  for (const [dk, rk] of Object.entries(STATE_TO_RECIPE)) if (rk === recipeState) return states[dk];
  return undefined;
}

const fmt = (rgb) => `[${rgb.map((n) => Math.round(n)).join(',')}]`;

// Resolve the tier-3 recipe tables for this review. A load failure must NEVER kill the review (an
// unreadable reference file is a degradation, not a crash) — it returns { recipes: null, failed: true } and
// reviewNativeDescriptor() declares it as a review-level blind spot (D2b). `opts._loadRecipes` is the
// injectable seam that lets tests exercise the unreadable-file path.
function resolveRecipes(opts) {
  if (!opts || opts.aestheticProfile !== 'apple-macos') return { recipes: null, failed: false };
  const load = typeof opts._loadRecipes === 'function' ? opts._loadRecipes : loadMacosRecipes;
  try { return { recipes: load(), failed: false }; }
  catch { return { recipes: null, failed: true }; }
}

// The state checker entry point. Runs tier 1 + tier 2 (universal) and, opt-in, tier 3 (apple-macos).
export function stateFindings(descriptor, opts = {}) {
  const els = (descriptor && descriptor.elements) || [];
  const out = [];
  const { recipes } = resolveRecipes(opts);
  for (const el of els) {
    if (!el || typeof el !== 'object') continue;
    const t1 = tier1Inertness(el);
    if (t1) out.push(t1);
    // Tier 3 first: tier 2 defers to it ONLY when it actually COMPLETED (D2a). A mid-diff failure is never
    // a silent pass — it emits an explicit advisory finding (falsifiable) and the universal tier-2 check
    // runs for that element instead. Recipe-load failure (recipes null) likewise leaves tier 2 active.
    let tier3Complete = false;
    if (recipes && tier3Covers(el, opts)) {
      try {
        out.push(...tier3RecipeDiff(el, recipes));
        tier3Complete = true;
      } catch (e) {
        out.push({
          category: 'recipe-diff-unavailable', severity: 'advisory', element: el.id, evidence: 'extracted',
          message: `reference aesthetic (macOS): recipe diff could not run on ${el.id} (${(e && e.message) || 'error'}) — the universal state checks apply instead`,
        });
      }
    }
    if (!tier3Complete) {
      const t2 = tier2DisabledDirection(el);
      if (t2) out.push(t2);
    }
  }
  return out;
}

export function reviewNativeDescriptor(descriptor, opts = {}) {
  const els = descriptor.elements || [];
  const findings = [
    ...contrastFindings(els), ...geometryFindings(els), ...hierarchyFindings(els),
    ...stateFindings(descriptor, opts),
  ];
  const cov = coverage(els);
  const blocking = findings.some((f) => f.severity === 'high' || f.severity === 'critical');
  // Sweep blind spots (proven-unforceable states) pass through so the report layer (invariant C) surfaces
  // them — the reviewer must SAY what wasn't checked. Empty array when the descriptor carries no sweep.
  const blindSpots = (descriptor.sweep && Array.isArray(descriptor.sweep.blindSpots)) ? [...descriptor.sweep.blindSpots] : [];
  // D2b: a failed recipe load is a DECLARED blind spot, not a silent skip (loadMacosRecipes caches, so this
  // second resolve is free on the success path).
  if (resolveRecipes(opts).failed) blindSpots.push('recipe tables unavailable — tier-3 skipped');
  // a native (introspection) review is deterministic but not a pixel render — never `verified-pass`.
  return { findings, coverage: cov, blindSpots, verdict: blocking ? 'fail' : 'advisory-pass' };
}

// --- CLI: `node scripts/native-review.mjs <descriptor.json> [--json]` ---
// The design-reviewer subagent has no Bash and no browser for native, so the `/hig-review` command (which
// has Bash) runs THIS on a JUCE design-probe descriptor to get the measured findings.
if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const path = process.argv[2];
  if (!path) { console.error('usage: node native-review.mjs <descriptor.json> [--json]'); process.exit(2); }
  let desc;
  try { desc = JSON.parse(readFileSync(path, 'utf8')); } catch (e) { console.error(`cannot read ${path}: ${e.message}`); process.exit(2); }
  const errs = validateDescriptor(desc);
  if (errs.length) { console.error(`not a valid native-render descriptor:\n  ${errs.join('\n  ')}`); process.exit(2); }
  // `--aesthetic apple-macos` opts the swept descriptor into tier-3 recipe diffing against Apple's macOS
  // reference tokens (a reference aesthetic, not an authority-of-record). Only 'apple-macos' is recognised.
  const ai = process.argv.indexOf('--aesthetic');
  const opts = (ai !== -1 && process.argv[ai + 1] === 'apple-macos') ? { aestheticProfile: 'apple-macos' } : {};
  const r = reviewNativeDescriptor(desc, opts);
  if (process.argv.includes('--json')) { console.log(JSON.stringify(r, null, 2)); process.exit(0); }
  const pct = (r.coverage.ratio * 100).toFixed(0);
  console.log(`Native JUCE review (evidence: extracted) — verdict: ${r.verdict}  ·  never verified-pass (not a pixel render)`);
  console.log(`Coverage: ${r.coverage.measurable}/${r.coverage.total} nodes introspectable (${pct}%); custom-painted nodes are NOT contrast-scored.`);
  const order = { critical: 0, high: 1, medium: 2, low: 3, advisory: 4, info: 5 };
  const sorted = [...r.findings].sort((a, b) => (order[a.severity] ?? 9) - (order[b.severity] ?? 9));
  if (!sorted.length) console.log('  (no measured issues on the introspectable subset)');
  for (const f of sorted) console.log(`  [${f.severity}] ${f.category} — ${f.element}: ${f.message}`);
  if (r.blindSpots.length) {
    console.log(`Sweep blind spots (proven-unforceable states — NOT checked): ${r.blindSpots.join('; ')}.`);
  }
  console.log('Confirm the duplicate/clip/overlap class against the snapshot PNG.');
  process.exit(0);
}
