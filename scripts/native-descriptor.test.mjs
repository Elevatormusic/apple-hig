import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateDescriptor, ELEMENT_FIELDS, SWEEP_ELEMENT_FIELDS } from './native-descriptor.mjs';
const fx = JSON.parse(readFileSync(new URL('../test/fixtures/native/ears-like.json', import.meta.url)));

test('the golden fixture validates', () => assert.deepEqual(validateDescriptor(fx), []));

test('missing meta or malformed elements are reported', () => {
  assert.ok(validateDescriptor({}).length >= 1);
  assert.ok(validateDescriptor({ meta: {}, elements: [{}] }).some((e) => /bounds|type|measurable/.test(e)));
  assert.ok(validateDescriptor(null).length >= 1);
});

test('every element carries the measurable flag and root-logical bounds', () => {
  for (const el of fx.elements) {
    assert.equal(typeof el.measurable, 'boolean');
    assert.equal(typeof el.bounds.w, 'number');
    assert.equal(typeof el.bounds.h, 'number');
  }
});

test('the field list matches the schema doc', () => {
  const schema = JSON.parse(readFileSync(new URL('../schemas/native-render.schema.json', import.meta.url)));
  const props = Object.keys(schema.properties.elements.items.properties);
  // The schema mirrors BOTH the base fields and the additive state-sweep fields.
  for (const f of [...ELEMENT_FIELDS, ...SWEEP_ELEMENT_FIELDS]) assert.ok(props.includes(f), `schema missing element field ${f}`);
  // The top-level sweep block is documented in the schema too.
  assert.ok(schema.properties.sweep, 'schema missing top-level sweep');
});

// =========================================================================================================
// STATE-SWEEP EXTENSION (Task S3) — all fields are additive/optional; old descriptors stay valid. The shapes
// mirror exactly what native-review.mjs stateFindings() reads: per-element `states` (keyed by state name →
// { rgb:[r,g,b], alpha, grid:[[r,g,b]×16] }), `recipe`, `appearance`, `primary`, and a top-level `sweep`.
// =========================================================================================================

// A well-formed 4×4 (16-entry) sample grid of one colour.
const grid16 = (rgb) => Array.from({ length: 16 }, () => [...rgb]);
const state = (rgb, alpha = 1) => ({ rgb: [...rgb], alpha, grid: grid16(rgb) });

// A minimal valid element with the required base fields, plus whatever sweep extras a test needs.
const swept = (extra = {}) => ({
  id: 'btn', type: 'TextButton', bounds: { x: 0, y: 0, w: 80, h: 30 }, measurable: true, ...extra,
});
const asDesc = (el) => ({ meta: {}, elements: [el] });

test('a descriptor with well-formed states/sweep/recipe/appearance/primary validates', () => {
  const el = swept({
    primary: true,
    appearance: 'Dark',
    recipe: { context: 'CONTENT AREA', group: 'Buttons', variant: '02 — Bordered Tinted', rowKey: 'Off' },
    states: {
      normal: state([0, 122, 230]),
      over: state([20, 132, 240]),
      down: state([0, 100, 200]),
      disabled: state([0, 122, 230], 0.4),
      toggledOn: state([0, 145, 255]),
      toggledOff: state([60, 60, 60]),
    },
  });
  const d = { meta: {}, elements: [el], sweep: { sweptControls: 6, blindSpots: ['window-inactive styling'], sideEffects: ['state listeners fired'] } };
  assert.deepEqual(validateDescriptor(d), []);
});

test('states without `normal` is rejected', () => {
  const el = swept({ states: { over: state([10, 10, 10]), disabled: state([20, 20, 20]) } });
  assert.ok(validateDescriptor(asDesc(el)).some((e) => /states.*normal/i.test(e)), 'must require normal when states present');
});

test('a state rgb of the wrong length is rejected', () => {
  const el = swept({ states: { normal: { rgb: [1, 2], alpha: 1 } } });
  assert.ok(validateDescriptor(asDesc(el)).some((e) => /rgb/i.test(e)));
});

test('a state rgb value of 256 (out of 0-255) is rejected', () => {
  const el = swept({ states: { normal: { rgb: [256, 0, 0], alpha: 1 } } });
  assert.ok(validateDescriptor(asDesc(el)).some((e) => /rgb/i.test(e)));
});

test('a state alpha of 1.5 (out of 0..1) is rejected', () => {
  const el = swept({ states: { normal: { rgb: [0, 0, 0], alpha: 1.5 } } });
  assert.ok(validateDescriptor(asDesc(el)).some((e) => /alpha/i.test(e)));
});

test('a grid with 15 entries (not 16) is rejected', () => {
  const el = swept({ states: { normal: { rgb: [0, 0, 0], alpha: 1, grid: Array.from({ length: 15 }, () => [0, 0, 0]) } } });
  assert.ok(validateDescriptor(asDesc(el)).some((e) => /grid/i.test(e)));
});

test('a grid entry of the wrong shape is rejected', () => {
  const g = grid16([0, 0, 0]); g[5] = [0, 0]; // a 2-tuple where a triplet is required
  const el = swept({ states: { normal: { rgb: [0, 0, 0], alpha: 1, grid: g } } });
  assert.ok(validateDescriptor(asDesc(el)).some((e) => /grid/i.test(e)));
});

test('a state with a missing grid is accepted (grid optional, shape-validated only when present)', () => {
  const el = swept({ states: { normal: { rgb: [10, 20, 30], alpha: 1 } } });
  assert.deepEqual(validateDescriptor(asDesc(el)), []);
});

test('sweep.sweptControls negative is rejected', () => {
  const d = { meta: {}, elements: [swept()], sweep: { sweptControls: -1, blindSpots: [], sideEffects: [] } };
  assert.ok(validateDescriptor(d).some((e) => /sweptControls/i.test(e)));
});

test('sweep.sweptControls non-integer is rejected', () => {
  const d = { meta: {}, elements: [swept()], sweep: { sweptControls: 2.5, blindSpots: [], sideEffects: [] } };
  assert.ok(validateDescriptor(d).some((e) => /sweptControls/i.test(e)));
});

test('sweep.blindSpots with a non-string entry is rejected', () => {
  const d = { meta: {}, elements: [swept()], sweep: { sweptControls: 0, blindSpots: ['ok', 42], sideEffects: [] } };
  assert.ok(validateDescriptor(d).some((e) => /blindSpots/i.test(e)));
});

test('a `recipe` present without `appearance` is rejected (dark apps must not silently diff against Light)', () => {
  const el = swept({ recipe: { context: 'CONTENT AREA', group: 'Buttons' } });
  assert.ok(validateDescriptor(asDesc(el)).some((e) => /appearance/i.test(e)), 'recipe requires an explicit appearance');
});

test('a `recipe` missing context is rejected', () => {
  const el = swept({ appearance: 'Light', recipe: { group: 'Buttons' } });
  assert.ok(validateDescriptor(asDesc(el)).some((e) => /recipe.*context|context/i.test(e)));
});

test('a `recipe` missing group is rejected', () => {
  const el = swept({ appearance: 'Light', recipe: { context: 'CONTENT AREA' } });
  assert.ok(validateDescriptor(asDesc(el)).some((e) => /recipe.*group|group/i.test(e)));
});

test('unknown state keys are accepted when well-formed (permissive names, strict shapes)', () => {
  const el = swept({ states: { normal: state([0, 0, 0]), hovered: state([5, 5, 5]), pressed: state([1, 1, 1]) } });
  assert.deepEqual(validateDescriptor(asDesc(el)), []);
});

test('an unknown state key with a malformed value is still rejected (shapes are strict)', () => {
  const el = swept({ states: { normal: state([0, 0, 0]), weird: { rgb: [0, 0, 0], alpha: 9 } } });
  assert.ok(validateDescriptor(asDesc(el)).some((e) => /alpha/i.test(e)));
});

test('an appearance that is neither Light nor Dark is rejected', () => {
  const el = swept({ appearance: 'Auto' });
  assert.ok(validateDescriptor(asDesc(el)).some((e) => /appearance/i.test(e)));
});

test('a non-boolean primary flag is rejected', () => {
  const el = swept({ primary: 'yes' });
  assert.ok(validateDescriptor(asDesc(el)).some((e) => /primary/i.test(e)));
});
