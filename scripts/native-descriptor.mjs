// The native-render descriptor: the JSON a native introspection probe (the JUCE design probe) emits, and the
// reviewer's native path consumes. Dependency-free validation (no ajv) — see schemas/native-render.schema.json
// for the full contract. Every element carries root-logical `bounds` and a `measurable` flag (false = a
// custom-painted / non-introspectable node that must NOT be contrast-scored).

export const ELEMENT_FIELDS = [
  'id', 'type', 'role', 'label', 'value', 'bounds', 'fg', 'bg', 'fgIntrospectable', 'bgIntrospectable',
  'fontPt', 'bold', 'visible', 'showing', 'enabled', 'checkable', 'checked', 'measurable', 'snapshotMayBeBlank',
  'textOverflows',
];

export const META_FIELDS = ['juceVersion', 'scaleFactor', 'rootBounds', 'snapshotPath', 'shown', 'axCoverageRatio'];

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
  });
  return errs;
}
