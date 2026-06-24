// Deterministic layout-robustness primitives for the stress pass (roadmap #4): does a screen survive
// largest text, 200% resize, WCAG text-spacing, narrow reflow, and RTL without clipping / truncating /
// overlapping / losing content? All math is grounded in WCAG 2.2 + Apple Dynamic Type (see specs/spG).
// The DOM stress probe mirrors these; this is the unit-tested core.

const EPS = 1; // sub-pixel / anti-alias noise floor, in CSS px

// --- grounded constants ---
export const REFLOW_WIDTH_CSS_PX = 320;  // WCAG 2.2 SC 1.4.10 — single-column reflow width (= 1280px @ 400% zoom)
export const REFLOW_HEIGHT_CSS_PX = 256; // SC 1.4.10 — for horizontally-scrolling / vertical-writing content
export const RESIZE_TEXT_PERCENT = 200;  // SC 1.4.4 — text resizes to 200% with no loss (F69 = clip/truncate/obscure)
// SC 1.4.12 Text Spacing — a tolerance the layout must SURVIVE (not a style to apply): set all four, lose nothing.
export const TEXT_SPACING_OVERRIDE = { lineHeight: 1.5, paragraphSpacing: 2, letterSpacing: 0.12, wordSpacing: 0.16 };
// Largest iOS Dynamic Type (AX5): Body ~53pt (platform_api_observed, OS-version-dependent) / 17pt default ≈ 3.12.
// NON-LINEAR per text style — a flat scale OVER-scales titles; iOS/iPadOS only (macOS has no Dynamic Type).
export const DYNAMIC_TYPE_AX5_SCALE = 3.12;
// Report threshold for overlap DEPTH — the stress probe only reports a collision when boxes overlap by more
// than this, to suppress sub-pixel / anti-alias noise. Distinct from EPS (the 1px existence floor).
export const OVERLAP_NOISE_PX = 2;

// --- geometry (collision / obscured content, WCAG F69) ---
export function boxesOverlap(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}
export function intersectionArea(a, b) {
  const w = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
  const h = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  return w * h;
}
export function overlapDepth(a, b) {
  const w = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
  const h = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  return Math.min(w, h);
}

// --- clipping / truncation (WCAG F69) ---
// A single-line node clips when its content overflows a hidden/clip box and there's no reveal (title, expand).
export function isHorizClipped({ scrollWidth, clientWidth, overflowX = '', hasReveal = false }) {
  return scrollWidth - clientWidth > EPS && /^(hidden|clip)$/.test(overflowX) && !hasReveal;
}
// A fixed-height container clips when text overflows it with overflow hidden (worsens after the 1.4.12 override).
export function isVertClipped({ scrollHeight, clientHeight, overflowY = '' }) {
  return scrollHeight - clientHeight > EPS && /^(hidden|clip)$/.test(overflowY);
}

// --- reflow (WCAG SC 1.4.10) — a page-level horizontal scrollbar at 320px = two-dimensional scrolling ---
export function hasHorizontalScroll({ scrollWidth, clientWidth }) {
  return scrollWidth - clientWidth > EPS;
}
