import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contrastRatio, relativeLuminance, meetsAA, blendOver } from './wcag-contrast.mjs';

const close = (a, b, eps = 0.02) => Math.abs(a - b) < eps;

test('black on white is 21:1', () => assert.ok(close(contrastRatio('#000000', '#ffffff'), 21)));
test('identical colors are 1:1', () => assert.equal(contrastRatio('#777', '#777'), 1));
test('mid-grey #777 on white is ~4.48:1', () => assert.ok(close(contrastRatio('#777777', '#ffffff'), 4.48)));

test('accepts rgb objects and short hex', () => {
  assert.ok(close(contrastRatio({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 }), 21));
  assert.ok(close(contrastRatio('#000', '#fff'), 21));
});

test('relativeLuminance: white=1, black=0', () => {
  assert.ok(close(relativeLuminance('#ffffff'), 1));
  assert.ok(close(relativeLuminance('#000000'), 0));
});

test('blendOver: composites a translucent fg over an opaque bg', () => {
  assert.deepEqual(blendOver([0, 0, 0], [255, 255, 255], 0.6), [102, 102, 102]);
  assert.deepEqual(blendOver([60, 60, 67], '#ffffff', 1), [60, 60, 67]);
});

test('a translucent secondary label measures its REAL (lower) contrast, not the opaque value', () => {
  // rgba(60,60,67,0.6) over white ≈ #8a8a8e ≈ 3.45:1 (fails 4.5), NOT opaque #3c3c43 ≈ 9:1
  const blended = blendOver([60, 60, 67], '#ffffff', 0.6);
  assert.ok(close(contrastRatio(blended, '#ffffff'), 3.45, 0.2), contrastRatio(blended, '#ffffff'));
  assert.equal(meetsAA(contrastRatio(blended, '#ffffff'), 'normal'), false);
});

test('meetsAA: normal needs 4.5, large/non-text need 3', () => {
  assert.equal(meetsAA(4.6, 'normal'), true);
  assert.equal(meetsAA(4.4, 'normal'), false);
  assert.equal(meetsAA(3.1, 'large'), true);
  assert.equal(meetsAA(2.9, 'large'), false);
  assert.equal(meetsAA(3.1, 'nontext'), true);
  assert.equal(meetsAA(2.9, 'nontext'), false);
});
