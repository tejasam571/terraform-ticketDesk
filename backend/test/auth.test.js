'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const TEST_SECRET = 'test-secret-for-unit-tests-only';

test('JWT: sign and verify round-trip preserves the payload', () => {
  const payload = { id: 'user-123', role: 'admin' };
  const token = jwt.sign(payload, TEST_SECRET, { expiresIn: '1h' });

  const decoded = jwt.verify(token, TEST_SECRET);

  assert.equal(decoded.id, payload.id);
  assert.equal(decoded.role, payload.role);
});

test('JWT: verify rejects a token signed with the wrong secret', () => {
  const token = jwt.sign({ id: 'user-123' }, TEST_SECRET);

  assert.throws(() => {
    jwt.verify(token, 'a-completely-different-secret');
  }, /invalid signature/);
});

test('bcrypt: a hashed password verifies against the original plaintext', () => {
  const plaintext = 'Sup3rSecretPassword!';
  const hash = bcrypt.hashSync(plaintext, 10);

  assert.equal(bcrypt.compareSync(plaintext, hash), true);
});

test('bcrypt: a hashed password does not verify against the wrong plaintext', () => {
  const plaintext = 'Sup3rSecretPassword!';
  const hash = bcrypt.hashSync(plaintext, 10);

  assert.equal(bcrypt.compareSync('WrongPassword', hash), false);
});