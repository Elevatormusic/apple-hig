// Objective "squint test": a deterministic visual-weight estimate per element (rendered area × ink
// density × contrast-against-its-surround) so a hierarchy inversion — metadata or decoration outshouting
// the title / primary action — becomes a measured finding instead of a vibe. The DOM probe
// (references/dom-probe.js) supplies real geometry + contrast; this is the same heuristic, unit-tested.
// It is an approximation of perceived visual weight, not pixel saliency — see the spec's honest limits.

export function visualWeight({ area = 0, contrast = 1, filled = false, bold = false }) {
  const cf = Math.max(0, Math.min(1, (contrast - 1) / 20)); // 1:1 -> 0, 21:1 -> 1
  const ink = filled ? 1 : 0.15 * (bold ? 1.5 : 1);         // a fill covers ~100% of its bbox; text ~15%
  return area * ink * cf;
}

export function rankByWeight(elements) {
  return elements
    .map((e) => ({ ...e, weight: +visualWeight(e).toFixed(1) }))
    .sort((a, b) => b.weight - a.weight);
}
