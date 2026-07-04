// The native-render descriptor: the JSON a native introspection probe (the JUCE design probe) emits, and the
// reviewer's native path consumes. Dependency-free validation (no ajv) — see schemas/native-render.schema.json
// for the full contract. Every element carries root-logical `bounds` and a `measurable` flag (false = a
// custom-painted / non-introspectable node that must NOT be contrast-scored).

// The base descriptor element fields, all emitted by the JUCE design-probe header today.
export const ELEMENT_FIELDS = [
  'id', 'type', 'role', 'label', 'value', 'bounds', 'fg', 'bg', 'fgIntrospectable', 'bgIntrospectable',
  'fontPt', 'bold', 'visible', 'showing', 'enabled', 'checkable', 'checked', 'measurable', 'snapshotMayBeBlank',
  'textOverflows',
];

// The state-sweep extension (Task S3): additive/optional element fields consumed by native-review.mjs
// stateFindings(). Kept separate from ELEMENT_FIELDS because the probe header emits them only once the
// sweep lands (Task S4); the schema must mirror ALL of them (both lists), but the header-emission structural
// test asserts the base list until S4 wires sweepStates().
export const SWEEP_ELEMENT_FIELDS = ['states', 'recipe', 'appearance', 'primary'];

export const META_FIELDS = ['juceVersion', 'scaleFactor', 'rootBounds', 'snapshotPath', 'shown', 'axCoverageRatio'];

// The sweep's own vocabulary (native-review.mjs SWEEP_STATES). Unknown keys are accepted permissively — only
// each VALUE's shape is validated — but `normal` is REQUIRED whenever `states` exists (it is always sampled).
const REQUIRED_STATE = 'normal';

const isInt = (n) => typeof n === 'number' && Number.isInteger(n);
const isByte = (n) => isInt(n) && n >= 0 && n <= 255;
const isRgb = (v) => Array.isArray(v) && v.length === 3 && v.every(isByte);

// Validate one swept state VALUE: { rgb:[byte×3], alpha:0..1, grid?:[[byte×3]×16] }. `where` is a message
// prefix so a bad state is traceable to its element and key. Grid is optional but strictly shaped when present.
function validateStateValue(s, where, errs) {
  if (!s || typeof s !== 'object') { errs.push(`${where}: not an object`); return; }
  if (!isRgb(s.rgb)) errs.push(`${where}: rgb must be 3 integers 0-255`);
  if (typeof s.alpha !== 'number' || s.alpha < 0 || s.alpha > 1) errs.push(`${where}: alpha must be a number 0..1`);
  if (s.grid !== undefined) {
    if (!Array.isArray(s.grid) || s.grid.length !== 16) errs.push(`${where}: grid must be exactly 16 entries`);
    else s.grid.forEach((g, gi) => { if (!isRgb(g)) errs.push(`${where}: grid[${gi}] must be 3 integers 0-255`); });
  }
}

export function validateDescriptor(obj) {
  const errs = [];
  if (!obj || typeof obj !== 'object') return ['descriptor is not an object'];
  if (!obj.meta || typeof obj.meta !== 'object') errs.push('missing meta');
  if (!Array.isArray(obj.elements)) { errs.push('missing elements[]'); return errs; }
  obj.elements.forEach((el, i) => {
    if (!el || typeof el !== 'object') { errs.push(`element ${i}: not an object`); return; }
    if (!el.type) errs.push(`element ${i}: missing type`);
    const b = el.bounds;
    if (!b || ['x', 'y', 'w', 'h'].some((k) => typeof b[k] !== 'number')) errs.push(`element ${i}: bad bounds`);
    if (typeof el.measurable !== 'boolean') errs.push(`element ${i}: missing measurable flag`);

    // --- State-sweep extension (all optional/additive) ---
    if (el.states !== undefined) {
      if (!el.states || typeof el.states !== 'object' || Array.isArray(el.states)) {
        errs.push(`element ${i}: states must be an object`);
      } else {
        if (!el.states[REQUIRED_STATE]) errs.push(`element ${i}: states missing required "${REQUIRED_STATE}" state`);
        for (const [k, v] of Object.entries(el.states)) validateStateValue(v, `element ${i}: states.${k}`, errs);
      }
    }
    if (el.appearance !== undefined && el.appearance !== 'Light' && el.appearance !== 'Dark') {
      errs.push(`element ${i}: appearance must be 'Light' or 'Dark'`);
    }
    if (el.primary !== undefined && typeof el.primary !== 'boolean') {
      errs.push(`element ${i}: primary must be a boolean`);
    }
    if (el.recipe !== undefined) {
      if (!el.recipe || typeof el.recipe !== 'object' || Array.isArray(el.recipe)) {
        errs.push(`element ${i}: recipe must be an object`);
      } else {
        if (typeof el.recipe.context !== 'string') errs.push(`element ${i}: recipe missing context (string)`);
        if (typeof el.recipe.group !== 'string') errs.push(`element ${i}: recipe missing group (string)`);
        if (el.recipe.variant !== undefined && typeof el.recipe.variant !== 'string') errs.push(`element ${i}: recipe.variant must be a string`);
        if (el.recipe.rowKey !== undefined && typeof el.recipe.rowKey !== 'string') errs.push(`element ${i}: recipe.rowKey must be a string`);
        // An element with a recipe MUST declare its appearance (S2 review): otherwise a Dark app silently
        // diffs against the Light recipe via the default. Reject rather than assume.
        if (el.appearance !== 'Light' && el.appearance !== 'Dark') {
          errs.push(`element ${i}: recipe requires an explicit appearance ('Light' or 'Dark')`);
        }
      }
    }
  });

  // --- Top-level sweep block (optional/additive) ---
  if (obj.sweep !== undefined) {
    const sw = obj.sweep;
    if (!sw || typeof sw !== 'object' || Array.isArray(sw)) {
      errs.push('sweep must be an object');
    } else {
      if (!isInt(sw.sweptControls) || sw.sweptControls < 0) errs.push('sweep.sweptControls must be an integer >= 0');
      const strArr = (name) => {
        const a = sw[name];
        if (!Array.isArray(a) || a.some((s) => typeof s !== 'string')) errs.push(`sweep.${name} must be an array of strings`);
      };
      strArr('blindSpots');
      strArr('sideEffects');
    }
  }
  return errs;
}
