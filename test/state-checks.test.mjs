import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stateFindings, reviewNativeDescriptor } from '../scripts/native-review.mjs';

// --------------------------------------------------------------------------------------------------------
// Synthetic-descriptor helpers. A swept element carries `states` keyed by normal/over/down/disabled/...;
// each state = { rgb:[r,g,b], alpha, grid:[[r,g,b] x16] }. The checker degrades gracefully on partial data.
// --------------------------------------------------------------------------------------------------------

// A flat 16-entry grid of one colour — the common case (the coarse 4×4 downsample of a solid fill).
const grid = (rgb) => Array.from({ length: 16 }, () => [...rgb]);
const st = (rgb, alpha = 1, g) => ({ rgb: [...rgb], alpha, grid: g || grid(rgb) });

// Minimal swept element. `states` is the only load-bearing field for tiers; the rest mirror the descriptor.
function el(id, states, extra = {}) {
  return {
    id, type: 'button', role: 'button', label: id, bounds: { x: 0, y: 0, w: 80, h: 30 },
    measurable: true, visible: true, showing: true, states, ...extra,
  };
}

const desc = (elements, sweep) => ({ meta: {}, elements, ...(sweep ? { sweep } : {}) });

// --------------------------------------------------------------------------------------------------------
// TIER 1 — inertness
// --------------------------------------------------------------------------------------------------------

test('tier 1: a control identical across ALL swept states fires unstyled-control-states', () => {
  const c = [100, 100, 100];
  const e = el('inert', { normal: st(c), over: st(c), down: st(c), disabled: st(c) });
  const f = stateFindings(desc([e]));
  const t1 = f.filter((x) => x.category === 'unstyled-control-states');
  assert.equal(t1.length, 1);
  assert.equal(t1[0].element, 'inert');
  assert.equal(t1[0].severity, 'medium');
  assert.equal(t1[0].evidence, 'extracted');
});

test('tier 1: a control with ONE differing state does not fire', () => {
  const c = [100, 100, 100];
  const e = el('mostly-inert', { normal: st(c), over: st(c), down: st([180, 180, 180]), disabled: st(c) });
  const f = stateFindings(desc([e]));
  assert.equal(f.filter((x) => x.category === 'unstyled-control-states').length, 0);
});

test('tier 1: a single equal PAIR among otherwise-differing states does not fire', () => {
  // normal == over (an Apple-shipped equal pair) but down and disabled differ → not inert.
  const c = [100, 100, 100];
  const e = el('has-equal-pair', { normal: st(c), over: st(c), down: st([50, 50, 50]), disabled: st([200, 200, 200]) });
  const f = stateFindings(desc([e]));
  assert.equal(f.filter((x) => x.category === 'unstyled-control-states').length, 0);
});

test('tier 1 tolerance: states differing by only Δ=2 are still inert (fires); Δ=3 breaks it (no fire)', () => {
  const base = [100, 100, 100];
  // Every state within Δ=2 of the others → treated as identical → inert → FIRES.
  const d2 = el('delta2', { normal: st(base), over: st([102, 102, 102]), down: st([98, 100, 100]), disabled: st([100, 102, 98]) });
  assert.equal(stateFindings(desc([d2])).filter((x) => x.category === 'unstyled-control-states').length, 1,
    'Δ≤2 across all channels is within tolerance → identical → inert → fires');
  // One state at Δ=3 → a genuine difference → not inert → does NOT fire.
  const d3 = el('delta3', { normal: st(base), over: st([103, 100, 100]), down: st(base), disabled: st(base) });
  assert.equal(stateFindings(desc([d3])).filter((x) => x.category === 'unstyled-control-states').length, 0,
    'Δ=3 in one state breaks inertness → does NOT fire');
});

test('tier 1 tolerance (grid): Δ=2 on a grid entry stays inert; Δ=3 breaks it', () => {
  const base = [100, 100, 100];
  // normal grid has one cell at Δ2, all mean rgb equal → still inert → fires.
  const g2 = grid(base); g2[5] = [102, 100, 100];
  const inert = el('grid2', { normal: st(base, 1, g2), over: st(base), down: st(base), disabled: st(base) });
  assert.equal(stateFindings(desc([inert])).filter((x) => x.category === 'unstyled-control-states').length, 1);
  // one grid cell at Δ3 → a real difference → not inert → no finding.
  const g3 = grid(base); g3[5] = [103, 100, 100];
  const differ = el('grid3', { normal: st(base, 1, g3), over: st(base), down: st(base), disabled: st(base) });
  assert.equal(stateFindings(desc([differ])).filter((x) => x.category === 'unstyled-control-states').length, 0);
});

test('tier 1: alpha delta > 0.01 breaks inertness', () => {
  const c = [100, 100, 100];
  const e = el('alpha-differ', { normal: st(c, 1.0), over: st(c, 1.0), down: st(c, 0.9), disabled: st(c, 1.0) });
  assert.equal(stateFindings(desc([e])).filter((x) => x.category === 'unstyled-control-states').length, 0);
});

test('tier 1: a primary-action inert control is high severity', () => {
  const c = [100, 100, 100];
  const e = el('cta', { normal: st(c), over: st(c), down: st(c), disabled: st(c) }, { primary: true });
  const t1 = stateFindings(desc([e])).filter((x) => x.category === 'unstyled-control-states');
  assert.equal(t1.length, 1);
  assert.equal(t1[0].severity, 'high');
});

// --------------------------------------------------------------------------------------------------------
// TIER 2 — disabled-not-louder
// --------------------------------------------------------------------------------------------------------

test('tier 2: disabled clearly louder than normal (contrast path) fires low', () => {
  // Introspectable white bg. normal = mid grey (lower contrast); disabled = near-black (higher contrast → louder).
  const e = el('louder', {
    normal: st([160, 160, 160]),
    disabled: st([20, 20, 20]),
  }, { bgIntrospectable: true, bg: [255, 255, 255] });
  const f = stateFindings(desc([e]));
  const t2 = f.filter((x) => x.category === 'disabled-louder');
  assert.equal(t2.length, 1);
  assert.equal(t2[0].severity, 'low');
  assert.equal(t2[0].evidence, 'extracted');
});

test('tier 2: disabled equal or dimmer than normal does not fire (contrast path)', () => {
  const e = el('dimmer', { normal: st([20, 20, 20]), disabled: st([160, 160, 160]) },
    { bgIntrospectable: true, bg: [255, 255, 255] });
  assert.equal(stateFindings(desc([e])).filter((x) => x.category === 'disabled-louder').length, 0);
});

test('tier 2: alpha-fallback path fires when there is no introspectable bg', () => {
  // No bg → fall back to mean alpha; disabled alpha > normal alpha + 0.05 → louder.
  const e = el('alpha-louder', { normal: st([100, 100, 100], 0.5), disabled: st([100, 100, 100], 0.7) });
  const t2 = stateFindings(desc([e])).filter((x) => x.category === 'disabled-louder');
  assert.equal(t2.length, 1);
  assert.equal(t2[0].severity, 'low');
});

test('tier 2: alpha-fallback does not fire when disabled alpha is lower', () => {
  const e = el('alpha-dim', { normal: st([100, 100, 100], 0.9), disabled: st([100, 100, 100], 0.5) });
  assert.equal(stateFindings(desc([e])).filter((x) => x.category === 'disabled-louder').length, 0);
});

test('tier 2: skipped when only normal exists (no disabled sample)', () => {
  const e = el('no-disabled', { normal: st([100, 100, 100]) });
  assert.equal(stateFindings(desc([e])).filter((x) => x.category === 'disabled-louder').length, 0);
});

test('tier 2: skipped for an element tier 3 covers with a recipe expectation', () => {
  // This element has an apple recipe address AND would trip the alpha-fallback tier-2 rule, but with the
  // apple-macos profile tier 3 owns it → tier 2 must not also fire (recipe wins over heuristic).
  const e = el('recipe-covered', { normal: st([0, 122, 230], 0.5), disabled: st([0, 122, 230], 0.9) },
    { recipe: { context: 'CONTENT AREA', group: 'Buttons', variant: '02 — Bordered Tinted' } });
  const f = stateFindings(desc([e]), { aestheticProfile: 'apple-macos' });
  assert.equal(f.filter((x) => x.category === 'disabled-louder').length, 0, 'tier 2 skipped — tier 3 covers it');
});

// --------------------------------------------------------------------------------------------------------
// TIER 3 — recipe diff (opt-in, apple-macos only)
// --------------------------------------------------------------------------------------------------------

test('tier 3: no findings without the aesthetic profile (opt-in only)', () => {
  // A recipe-addressed control whose disabled sample DIFFERS from the expected-equal identity — but with no
  // profile, tier 3 never runs.
  const e = el('rec', { normal: st([0, 122, 230]), disabled: st([255, 0, 0]) },
    { recipe: { context: 'CONTENT AREA', group: 'Buttons', variant: '02 — Bordered Tinted' } });
  assert.equal(stateFindings(desc([e])).filter((x) => x.category === 'recipe-state-diff').length, 0);
});

test('tier 3: an expected-EQUAL identity that DIFFERS in samples fires (reference aesthetic)', () => {
  // CA 02 Bordered Tinted (Light): Idle == Disabled is an allowlisted identity. Recipe composited ≈ [0,122,230].
  // normal matches, disabled is a wildly different colour → the identity is violated → fires.
  const e = el('tinted', {
    normal: st([0, 122, 230]),
    disabled: st([255, 0, 0]),
  }, { recipe: { context: 'CONTENT AREA', group: 'Buttons', variant: '02 — Bordered Tinted' }, appearance: 'Light' });
  const f = stateFindings(desc([e]), { aestheticProfile: 'apple-macos' });
  const t3 = f.filter((x) => x.category === 'recipe-state-diff');
  assert.equal(t3.length, 1, 'the violated idle==disabled identity fires exactly once (no double-count)');
  assert.equal(t3[0].severity, 'advisory');
  assert.equal(t3[0].evidence, 'extracted');
  assert.match(t3[0].message, /reference aesthetic/i);
  assert.match(t3[0].message, /idle==disabled/i);
});

test('tier 3: an expected-DIFFERENT pair whose samples match the recipe does not fire', () => {
  // CA 01 Bordered (Light): Idle #000000 α0.08 over an opaque light bg, Disabled α0.04 — expected different
  // (dims). If the samples match those recipe expectations, no finding. We sample the two states at the
  // recipe-composited colours over a white bg.
  const overWhite = (a) => Math.round(0 * a + 255 * (1 - a));
  const normal = st([overWhite(0.08), overWhite(0.08), overWhite(0.08)]); // ≈ [235,235,235]
  const disabled = st([overWhite(0.04), overWhite(0.04), overWhite(0.04)]); // ≈ [245,245,245]
  const e = el('bordered', { normal, disabled },
    { recipe: { context: 'CONTENT AREA', group: 'Buttons', variant: '01 — Bordered' }, appearance: 'Light',
      bgIntrospectable: true, bg: [255, 255, 255] });
  const f = stateFindings(desc([e]), { aestheticProfile: 'apple-macos' });
  assert.equal(f.filter((x) => x.category === 'recipe-state-diff').length, 0, 'samples match the recipe → no diff');
});

test('tier 3: toggle-knob Clicked fills (the #FF0000 Figma marker) are skipped', () => {
  // CA Knobs — Toggle Clicked Light = `#FFFFFF` α0 · `#FF0000` — an authoring marker, never a real value.
  // Even a wildly-off Clicked sample must NOT produce a recipe diff on that cell.
  const e = el('toggle', {
    normal: st([255, 255, 255]),
    down: st([0, 128, 0]), // "down" maps to the Clicked recipe state; whatever it is, must be skipped
  }, { recipe: { context: 'CONTENT AREA', group: 'Knobs — Toggle', variant: 'Fills' }, appearance: 'Light' });
  const f = stateFindings(desc([e]), { aestheticProfile: 'apple-macos' });
  const clickedDiffs = f.filter((x) => x.category === 'recipe-state-diff' && /clicked/i.test(x.message || ''));
  assert.equal(clickedDiffs.length, 0, 'clicked toggle-knob fill is skipped');
});

test('tier 3: elements without a recipe address are skipped even under the profile', () => {
  const e = el('no-address', { normal: st([0, 0, 0]), disabled: st([255, 255, 255]) });
  assert.equal(stateFindings(desc([e]), { aestheticProfile: 'apple-macos' })
    .filter((x) => x.category === 'recipe-state-diff').length, 0);
});

// --------------------------------------------------------------------------------------------------------
// BLIND SPOTS + integration
// --------------------------------------------------------------------------------------------------------

test('blind spots: descriptor.sweep.blindSpots surfaces on the review result', () => {
  const spots = ['window-inactive styling', 'focus visuals (window unfocused)'];
  const r = reviewNativeDescriptor(desc([], { sweptControls: 0, blindSpots: spots, sideEffects: [] }));
  assert.deepEqual(r.blindSpots, spots);
});

test('blind spots: absent sweep → empty array', () => {
  const r = reviewNativeDescriptor(desc([]));
  assert.deepEqual(r.blindSpots, []);
});

test('integration: reviewNativeDescriptor includes the tier-1 finding for a swept inert control', () => {
  const c = [120, 120, 120];
  const e = el('inert-int', { normal: st(c), over: st(c), down: st(c), disabled: st(c) });
  const r = reviewNativeDescriptor(desc([e]));
  assert.ok(r.findings.some((f) => f.category === 'unstyled-control-states' && f.element === 'inert-int'));
});

// --------------------------------------------------------------------------------------------------------
// Graceful degradation (self-review edge cases)
// --------------------------------------------------------------------------------------------------------

test('degrade: an element with no states object produces no state findings and does not throw', () => {
  const e = el('plain', undefined);
  delete e.states;
  assert.doesNotThrow(() => stateFindings(desc([e])));
  assert.equal(stateFindings(desc([e])).length, 0);
});

test('degrade: states with only normal produces no tier-1/tier-2 findings', () => {
  const e = el('only-normal', { normal: st([100, 100, 100]) });
  const f = stateFindings(desc([e]));
  assert.equal(f.filter((x) => x.category === 'unstyled-control-states').length, 0);
  assert.equal(f.filter((x) => x.category === 'disabled-louder').length, 0);
});

test('degrade: a state missing rgb / with an empty grid does not throw', () => {
  const e = el('malformed', { normal: { alpha: 1 }, disabled: { rgb: [10, 10, 10], alpha: 1, grid: [] } });
  assert.doesNotThrow(() => stateFindings(desc([e]), { aestheticProfile: 'apple-macos' }));
});

test('degrade: a descriptor with no elements returns no findings', () => {
  assert.deepEqual(stateFindings(desc([])), []);
});

// --------------------------------------------------------------------------------------------------------
// S2 RECHECK REPROS (coordinator review of 938aa14) — D1..D5
// --------------------------------------------------------------------------------------------------------

// D1 — ambiguous recipe address: {context, group} alone matches MULTIPLE recipe rows (CA Controls: Active/
// Inactive × Off/On); diffing against an arbitrary fills[0] false-flagged a CORRECT checkbox and printed a
// literal `undefined` variant in the message. Ambiguity must SKIP, never guess.
test('D1: an ambiguous recipe address (context+group only) produces no tier-3 findings', () => {
  const e = el('checkbox', {
    normal: st([0, 136, 255]),   // a correct [Active, On] blue
    disabled: st([0, 125, 235]),
  }, { recipe: { context: 'CONTENT AREA', group: 'Controls' }, appearance: 'Light',
       bgIntrospectable: true, bg: [255, 255, 255] });
  const f = stateFindings(desc([e]), { aestheticProfile: 'apple-macos' });
  assert.equal(f.filter((x) => x.category === 'recipe-state-diff').length, 0, 'ambiguous address → skip, not guess');
  assert.ok(!f.some((x) => /undefined/.test(x.message || '')), 'no literal "undefined" in any finding message');
});

// D2a — a mid-diff throw must be FALSIFIABLE: an explicit advisory finding, and tier 2 falls back for that
// element (tier-3 ownership only counts when tier 3 actually completed).
test('D2a: a tier-3 throw emits recipe-diff-unavailable AND tier 2 still runs for that element', () => {
  const e = el('exploder', { normal: st([100, 100, 100], 0.5), disabled: st([100, 100, 100], 0.7) }, {
    // tier3Covers reads context+group only; the diff destructures `variant` → synthetic mid-diff failure.
    recipe: { context: 'CONTENT AREA', group: 'Buttons', get variant() { throw new Error('synthetic mid-diff failure'); } },
  });
  const f = stateFindings(desc([e]), { aestheticProfile: 'apple-macos' });
  assert.equal(f.filter((x) => x.category === 'recipe-diff-unavailable' && x.element === 'exploder').length, 1);
  assert.equal(f.filter((x) => x.category === 'disabled-louder' && x.element === 'exploder').length, 1,
    'tier 2 falls back when tier 3 died mid-diff');
});

// D2b — an unreadable recipe reference must degrade to a review-level blind spot, not crash the review;
// tiers 1–2 and the other emitters survive. (_loadRecipes is the injectable seam for the unreadable file.)
test('D2b: a failed recipe load degrades to a review-level blind spot; tiers 1-2 survive', () => {
  const c = [120, 120, 120];
  const inert = el('inert-d2b', { normal: st(c), over: st(c), down: st(c), disabled: st(c) });
  const loud = el('loud-d2b', { normal: st([100, 100, 100], 0.5), disabled: st([100, 100, 100], 0.7) },
    { recipe: { context: 'CONTENT AREA', group: 'Buttons', variant: '01 — Bordered' } });
  const opts = { aestheticProfile: 'apple-macos', _loadRecipes: () => { throw new Error('EACCES: reference unreadable'); } };
  const r = reviewNativeDescriptor(desc([inert, loud]), opts);
  assert.ok(r.blindSpots.includes('recipe tables unavailable — tier-3 skipped'), 'declared, not silent');
  assert.ok(r.findings.some((x) => x.category === 'unstyled-control-states' && x.element === 'inert-d2b'), 'tier 1 survives');
  assert.ok(r.findings.some((x) => x.category === 'disabled-louder' && x.element === 'loud-d2b'), 'tier 2 replaces the dead tier 3');
  assert.ok(!r.findings.some((x) => x.category === 'recipe-state-diff'), 'tier 3 skipped');
});

// D3 — an identity that HOLDS between the samples must still be value-diffed once: a consistently-wrong
// pair (both states gray when the recipe says blue) must not pass clean.
test('D3: a consistently-wrong expected-equal pair still gets ONE representative value-diff', () => {
  const e = el('gray-tinted', { normal: st([128, 128, 128]), disabled: st([128, 128, 128]) },
    { recipe: { context: 'CONTENT AREA', group: 'Buttons', variant: '02 — Bordered Tinted' }, appearance: 'Light' });
  const t3 = stateFindings(desc([e]), { aestheticProfile: 'apple-macos' }).filter((x) => x.category === 'recipe-state-diff');
  assert.equal(t3.length, 1, 'identity holds → one representative value-diff against the recipe colour');
});

test('D3: a missing identity partner does not un-check the present state', () => {
  const e = el('half-tinted', { normal: st([128, 128, 128]) },
    { recipe: { context: 'CONTENT AREA', group: 'Buttons', variant: '02 — Bordered Tinted' }, appearance: 'Light' });
  const t3 = stateFindings(desc([e]), { aestheticProfile: 'apple-macos' }).filter((x) => x.category === 'recipe-state-diff');
  assert.equal(t3.length, 1, 'Idle sampled wrong → value-diff fires even though disabled was not swept');
});

// D4 — Apple-sanctioned disabled deltas must NOT fire tier 2 (research 2026-07-02, directionModel):
// the prominent accent-swap measures Δ=+0.519 contrast points over black; the sanctioned plus-darker
// overlay composite ≈ Δ+0.57 over white. Both are export-shipped, not dimming failures.
test('D4: the sanctioned prominent accent-swap (idle #0091FF → disabled #0A99FF, Δ=0.519 over black) must NOT fire', () => {
  const e = el('accent-swap', { normal: st([0, 145, 255]), disabled: st([10, 153, 255]) },
    { bgIntrospectable: true, bg: [0, 0, 0] });
  assert.equal(stateFindings(desc([e])).filter((x) => x.category === 'disabled-louder').length, 0);
});

test('D4: the sanctioned plus-darker overlay (idle #0088FF → composited ≈#007DEB, Δ≈0.57 over white) must NOT fire', () => {
  const e = el('pd-overlay', { normal: st([0, 136, 255]), disabled: st([0, 125, 235]) },
    { bgIntrospectable: true, bg: [255, 255, 255] });
  assert.equal(stateFindings(desc([e])).filter((x) => x.category === 'disabled-louder').length, 0);
});

test('D4: a large hue rotation at similar alpha (colour swap) skips the contrast path', () => {
  // red → blue is export-style state feedback (accent swap), not a dimming failure — even though the raw
  // contrast delta over white (≈+4.4) is far beyond any margin.
  const e = el('hue-swap', { normal: st([200, 30, 30]), disabled: st([30, 30, 200]) },
    { bgIntrospectable: true, bg: [255, 255, 255] });
  assert.equal(stateFindings(desc([e])).filter((x) => x.category === 'disabled-louder').length, 0);
});

test('D4: a genuinely louder disabled still fires (falsifiability guard)', () => {
  // Same-hue gray, far darker on white: Δ well beyond the 0.75 margin, no hue rotation → must fire.
  const e = el('still-louder', { normal: st([160, 160, 160]), disabled: st([20, 20, 20]) },
    { bgIntrospectable: true, bg: [255, 255, 255] });
  assert.equal(stateFindings(desc([e])).filter((x) => x.category === 'disabled-louder').length, 1);
});

// D5 — 2-state sweeps that are pixel-identical are often SANCTIONED (stock V4 linear sliders + tickboxes
// paint identically enabled vs disabled; Apple ships 18 Disabled==Idle identities — research 2026-07-02,
// J7-lnf4 + directionModel). The medium/high finding requires ≥3 present states; 2-state gets an info note.
test('D5: a 2-state all-identical sweep is an info note, not unstyled-control-states', () => {
  const c = [100, 100, 100];
  const e = el('slider-like', { normal: st(c), disabled: st(c) });
  const f = stateFindings(desc([e]));
  assert.equal(f.filter((x) => x.category === 'unstyled-control-states').length, 0,
    'pixel-identical enabled-vs-disabled is V4/export-sanctioned — not a medium finding');
  const note = f.filter((x) => x.category === 'two-state-inert');
  assert.equal(note.length, 1);
  assert.equal(note[0].severity, 'info');
});

test('D5: a 3-state all-identical sweep still fires unstyled-control-states at medium', () => {
  const c = [100, 100, 100];
  const e = el('three-inert', { normal: st(c), over: st(c), down: st(c) });
  const t1 = stateFindings(desc([e])).filter((x) => x.category === 'unstyled-control-states');
  assert.equal(t1.length, 1);
  assert.equal(t1[0].severity, 'medium');
});

// --------------------------------------------------------------------------------------------------------
// N3 (S3 reviewer) — the descriptor schema types `bg` as a HEX STRING ("#RRGGBB"); tiers 2/3 guarded on
// Array.isArray(el.bg), so on schema-valid descriptors the contrast path and the tier-3 bg composite were
// unreachable dead paths (the alpha fallback always ruled).
// --------------------------------------------------------------------------------------------------------

test('N3: tier 2 fires via the CONTRAST path on a schema-valid hex-string bg', () => {
  // Alphas are EQUAL (both 1) so the alpha fallback CANNOT produce this finding — only the contrast path
  // can. bg is the schema's hex-string form, exactly as the probe emits it.
  const e = el('hex-bg-louder', { normal: st([160, 160, 160], 1), disabled: st([20, 20, 20], 1) },
    { bgIntrospectable: true, bg: '#FFFFFF' });
  const t2 = stateFindings(desc([e])).filter((x) => x.category === 'disabled-louder');
  assert.equal(t2.length, 1, 'hex-string bg must engage the contrast path');
  assert.match(t2[0].message, /contrast .*:1 exceeds normal .*:1/, 'the metric in the message proves the contrast path ran');
  assert.ok(!/alpha/.test(t2[0].message), 'not the alpha fallback');
});

test('N3: tier 3 composites a translucent recipe stack over a hex-string bg', () => {
  // CA 01 Bordered (Light) Idle = #000000 α0.08 — translucent, so the expectation only exists by
  // compositing over the element bg. With the schema's hex-string bg: a matching sample stays clean and a
  // wildly-off sample MUST fire (before the fix, expected resolved to null and both were silently skipped).
  const matching = el('hex-bg-match', { normal: st([235, 235, 235]) },
    { recipe: { context: 'CONTENT AREA', group: 'Buttons', variant: '01 — Bordered' }, appearance: 'Light',
      bgIntrospectable: true, bg: '#FFFFFF' });
  const wrong = el('hex-bg-wrong', { normal: st([40, 40, 40]) },
    { recipe: { context: 'CONTENT AREA', group: 'Buttons', variant: '01 — Bordered' }, appearance: 'Light',
      bgIntrospectable: true, bg: '#FFFFFF' });
  const f = stateFindings(desc([matching, wrong]), { aestheticProfile: 'apple-macos' });
  assert.equal(f.filter((x) => x.category === 'recipe-state-diff' && x.element === 'hex-bg-match').length, 0,
    'sample matches the recipe composited over the hex bg → clean');
  assert.equal(f.filter((x) => x.category === 'recipe-state-diff' && x.element === 'hex-bg-wrong').length, 1,
    'sample far off the composite → fires (the bg pass-through is alive)');
});
