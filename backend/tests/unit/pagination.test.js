import assert from 'node:assert/strict';
import test from 'node:test';
import { getPagination } from '../../src/utils/pagination.js';

test('pagination uses defaults for missing and invalid values', () => {
  assert.deepEqual(getPagination(undefined, undefined), {
    page: 1,
    limit: 20,
    skip: 0
  });
  assert.deepEqual(getPagination('-2', 'not-a-number'), {
    page: 1,
    limit: 20,
    skip: 0
  });
});

test('pagination clamps the limit and calculates the offset', () => {
  assert.deepEqual(getPagination('3', '1000000'), {
    page: 3,
    limit: 100,
    skip: 200
  });
});

test('pagination rejects non-integer and unsafe page values', () => {
  assert.deepEqual(getPagination('2.5', '10'), {
    page: 1,
    limit: 10,
    skip: 0
  });
  assert.deepEqual(getPagination('9007199254740991', '100'), {
    page: 1,
    limit: 100,
    skip: 0
  });
});
