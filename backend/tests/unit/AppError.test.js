import assert from 'node:assert/strict';
import test from 'node:test';
import AppError from '../../src/utils/AppError.js';
import ERROR_CODES from '../../src/utils/errorCodes.js';

test('AppError stores its status, message, and error code', () => {
  const error = new AppError(
    'The requested resource was not found',
    404,
    ERROR_CODES.NOT_FOUND
  );

  assert.equal(error.statusCode, 404);
  assert.equal(error.message, 'The requested resource was not found');
  assert.equal(error.errorCode, ERROR_CODES.NOT_FOUND);
});

test('AppError is operational by default', () => {
  const error = new AppError('Invalid request', 400, ERROR_CODES.BAD_REQUEST);

  assert.equal(error.isOperational, true);
});
