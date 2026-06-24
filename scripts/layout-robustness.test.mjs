import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  boxesOverlap, intersectionArea, overlapDepth,
  isHorizClipped, isVertClipped, hasHorizontalScroll,
  TEXT_SPACING_OVERRIDE, DYNAMIC_TYPE_AX5_SCALE, REFLOW_WIDTH_CSS_PX, REFLOW_HEIGHT_CSS_PX, RESIZE_TEXT_PERCENT,
} from './layout-robustness.mjs';

const box = (left, top, right, bottom) => ({ left, top, right, bottom });

test('boxesOverlap: true intersection only (edge-touching is not overlap)', () => {
  const a = box(0, 0, 100, 50);
  assert.equal(boxesOverlap(a, box(90, 10, 200, 40)), true);
  assert.equal(boxesOverlap(a, box(200, 0, 300, 50)), false); // disjoint
  assert.equal(boxesOverlap(a, box(100, 0, 150, 50)), false); // edge-touching at x=100
});

test('intersectionArea + overlapDepth (WCAG F69 obscured-content geometry)', () => {
  const a = box(0, 0, 100, 50);
  const b = box(90, 10, 200, 40); // x∩=10, y∩=30
  assert.equal(intersectionArea(a, b), 300);
  assert.equal(overlapDepth(a, b), 10); // min of the two overlap extents — the sub-pixel noise gate
  assert.equal(intersectionArea(a, box(200, 0, 300, 50)), 0);
});

test('isHorizClipped: clipped only when content overflows a hidden/clip box with no reveal', () => {
  assert.equal(isHorizClipped({ scrollWidth: 200, clientWidth: 100, overflowX: 'hidden' }), true);
  assert.equal(isHorizClipped({ scrollWidth: 200, clientWidth: 100, overflowX: 'clip' }), true);
  assert.equal(isHorizClipped({ scrollWidth: 90, clientWidth: 100, overflowX: 'hidden' }), false); // fits
  assert.equal(isHorizClipped({ scrollWidth: 200, clientWidth: 100, overflowX: 'visible' }), false); // shows (overlap, not clip)
  assert.equal(isHorizClipped({ scrollWidth: 200, clientWidth: 100, overflowX: 'auto' }), false); // scrollable = reachable
  assert.equal(isHorizClipped({ scrollWidth: 200, clientWidth: 100, overflowX: 'hidden', hasReveal: true }), false); // title/expand
});

test('isVertClipped: fixed-height container hides overflowing text (worse after 1.4.12 spacing)', () => {
  assert.equal(isVertClipped({ scrollHeight: 120, clientHeight: 60, overflowY: 'hidden' }), true);
  assert.equal(isVertClipped({ scrollHeight: 50, clientHeight: 60, overflowY: 'hidden' }), false);
  assert.equal(isVertClipped({ scrollHeight: 120, clientHeight: 60, overflowY: 'auto' }), false);
});

test('hasHorizontalScroll: page-level 2D-scroll signal for reflow (SC 1.4.10)', () => {
  assert.equal(hasHorizontalScroll({ scrollWidth: 360, clientWidth: 320 }), true);
  assert.equal(hasHorizontalScroll({ scrollWidth: 320, clientWidth: 320 }), false);
});

test('grounded WCAG / Dynamic-Type constants (from R1 research)', () => {
  assert.deepEqual(TEXT_SPACING_OVERRIDE, { lineHeight: 1.5, paragraphSpacing: 2, letterSpacing: 0.12, wordSpacing: 0.16 });
  assert.equal(REFLOW_WIDTH_CSS_PX, 320);
  assert.equal(REFLOW_HEIGHT_CSS_PX, 256);
  assert.equal(RESIZE_TEXT_PERCENT, 200);
  assert.ok(Math.abs(DYNAMIC_TYPE_AX5_SCALE - 3.12) < 0.001);
});
