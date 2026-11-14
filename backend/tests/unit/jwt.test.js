import assert from 'node:assert/strict';
import test from 'node:test';
import jwt from 'jsonwebtoken';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} from '../../src/utils/jwt.js';

process.env.JWT_SECRET = 'unit-test-access-secret';
process.env.JWT_REFRESH_SECRET = 'unit-test-refresh-secret';
process.env.JWT_EXPIRE = '15m';
process.env.JWT_REFRESH_EXPIRE = '7d';

const userId = 'user-123';

test('generateAccessToken creates a token for the user with an expiry', () => {
  const token = generateAccessToken(userId);
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  assert.equal(decoded.id, userId);
  assert.equal(typeof decoded.exp, 'number');
  assert.ok(decoded.exp > Math.floor(Date.now() / 1000));
});

test('generateRefreshToken creates a token for the user with an expiry', () => {
  const token = generateRefreshToken(userId);
  const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

  assert.equal(decoded.id, userId);
  assert.equal(typeof decoded.exp, 'number');
  assert.ok(decoded.exp > Math.floor(Date.now() / 1000));
});

test('verifyRefreshToken accepts a valid token', () => {
  const token = generateRefreshToken(userId);

  assert.equal(verifyRefreshToken(token).id, userId);
});

test('verifyRefreshToken rejects a tampered token', () => {
  const token = generateRefreshToken(userId);
  const parts = token.split('.');
  parts[2] = `${parts[2][0] === 'a' ? 'b' : 'a'}${parts[2].slice(1)}`;

  assert.equal(verifyRefreshToken(parts.join('.')), null);
});

test('verifyRefreshToken rejects an expired token', () => {
  const token = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: -1
  });

  assert.equal(verifyRefreshToken(token), null);
});
