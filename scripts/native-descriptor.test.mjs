import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateDescriptor, ELEMENT_FIELDS } from './native-descriptor.mjs';
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
  for (const f of ELEMENT_FIELDS) assert.ok(props.includes(f), `schema missing element field ${f}`);
});
