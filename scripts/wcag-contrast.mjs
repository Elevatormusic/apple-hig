// Deterministic WCAG 2.x contrast — the measured core of the design-reviewer's `evidence: computed`
// findings. The same formula is mirrored inside the browser probe (references/dom-probe.js), which can't
// import this module; keep the two in sync. See specs/2026-06-17-design-spE-deterministic-evidence.md.

function toRgb(c) {
  if (Array.isArray(c)) return { r: c[0], g: c[1], b: c[2] };
  if (c && typeof c === 'object') return { r: c.r, g: c.g, b: c.b };
  let h = String(c).trim().replace(/^#/, '');
  if (h.length === 3) h = h.split('').map((x) => x + x).join('');
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}

// Composite a (possibly translucent) foreground over an opaque background — alpha matters for contrast:
// rgba(60,60,67,0.6) over white reads ~3.45:1, not the opaque ~9:1. Returns an [r,g,b] array.
export function blendOver(fg, bg, alpha) {
  const f = toRgb(fg), b = toRgb(bg);
  const mix = (x, y) => x * alpha + y * (1 - alpha);
  return [mix(f.r, b.r), mix(f.g, b.g), mix(f.b, b.b)];
}

function channel(ch) {
  const c = ch / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(color) {
  const { r, g, b } = toRgb(color);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(c1, c2) {
  const l1 = relativeLuminance(c1), l2 = relativeLuminance(c2);
  const hi = Math.max(l1, l2), lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

// AA floors: normal text 4.5 (WCAG 1.4.3); large text 3 (1.4.3); non-text/UI 3 (1.4.11).
export function meetsAA(ratio, role = 'normal') {
  const floor = role === 'large' || role === 'nontext' ? 3 : 4.5;
  return ratio >= floor;
}
