
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SOURCES } from '../sources.js';

test('news sources are configured', () => {
  assert.ok(SOURCES.length > 0);
});

test('source IDs are unique', () => {
  const ids = SOURCES.map(source => source.id);
  assert.equal(new Set(ids).size, ids.length);
});
