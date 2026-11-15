const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

const {
  generateToken,
  verifyToken,
  decodeToken,
  extractTokenFromHeader,
  extractToken,
  resolveUser,
  resolveUserId,
} = require('../src/utils/jwt');
const { config } = require('../src/config');

test('JWT Utilities Suite', async (t) => {
  await t.test('generateToken and verifyToken roundtrip', () => {
    const user = {
      id: 42,
      username: 'testuser',
      role: 'Admin',
      email: 'test@example.com',
    };

    const token = generateToken(user);
    assert.ok(typeof token === 'string');
    assert.strictEqual(token.split('.').length, 3);

    const decoded = verifyToken(token);
    assert.strictEqual(decoded.id, 42);
    assert.strictEqual(decoded.sub, 42);
    assert.strictEqual(decoded.username, 'testuser');
    assert.strictEqual(decoded.role, 'Admin');
    assert.strictEqual(decoded.email, 'test@example.com');
    assert.ok(decoded.exp > decoded.iat);
  });

  await t.test('generateToken defaults role to Member', () => {
    const token = generateToken({ id: 99, username: 'guest' });
    const decoded = verifyToken(token);
    assert.strictEqual(decoded.role, 'Member');
  });

  await t.test('verifyToken throws on expired token', () => {
    const expiredToken = jwt.sign(
      { sub: 1, id: 1, username: 'old' },
      config.jwtSecret,
      { expiresIn: '-1s' }
    );

    assert.throws(
      () => verifyToken(expiredToken),
      (err) => err.name === 'TokenExpiredError'
    );
  });

  await t.test('verifyToken throws on invalid signature or malformed token', () => {
    const fakeToken = jwt.sign({ id: 1 }, 'different-secret');

    assert.throws(
      () => verifyToken(fakeToken),
      (err) => err.name === 'JsonWebTokenError'
    );

    assert.throws(
      () => verifyToken('not.a.valid.token'),
      (err) => err.name === 'JsonWebTokenError'
    );

    assert.throws(
      () => verifyToken(null),
      (err) => err.name === 'JsonWebTokenError'
    );
  });

  await t.test('decodeToken decodes payload without signature check', () => {
    const token = jwt.sign({ custom: 'value', id: 5 }, 'some-random-secret');
    const decoded = decodeToken(token);

    assert.ok(decoded);
    assert.strictEqual(decoded.custom, 'value');
    assert.strictEqual(decoded.id, 5);

    assert.strictEqual(decodeToken('invalid-token'), null);
    assert.strictEqual(decodeToken(''), null);
  });

  await t.test('extractTokenFromHeader parses Bearer format correctly', () => {
    assert.strictEqual(
      extractTokenFromHeader('Bearer my-secret-token'),
      'my-secret-token'
    );
    assert.strictEqual(
      extractTokenFromHeader('bearer my-secret-token'),
      'my-secret-token'
    );
    assert.strictEqual(extractTokenFromHeader('Basic xyz'), null);
    assert.strictEqual(extractTokenFromHeader(''), null);
    assert.strictEqual(extractTokenFromHeader(undefined), null);
  });

  await t.test('extractToken inspects auth header, custom header, and query parameter', () => {
    // 1. Authorization header
    assert.strictEqual(
      extractToken({ headers: { authorization: 'Bearer token-1' } }),
      'token-1'
    );

    // 2. x-access-token header
    assert.strictEqual(
      extractToken({ headers: { 'x-access-token': 'token-2' } }),
      'token-2'
    );

    // 3. Query string parameter
    assert.strictEqual(
      extractToken({ headers: {}, query: { token: 'token-3' } }),
      'token-3'
    );

    // 4. No token provided
    assert.strictEqual(extractToken({ headers: {} }), null);
    assert.strictEqual(extractToken(null), null);
  });

  await t.test('resolveUserId prioritizes req.user over headers with fallback', () => {
    // Verified user in req.user
    const reqWithUser = {
      user: { id: 123, sub: 123, username: 'rahul' },
      headers: { 'x-user-id': '999' },
    };
    assert.strictEqual(resolveUserId(reqWithUser), 123);

    // Sub id in req.user
    const reqWithSub = {
      user: { sub: 'usr_abc' },
      headers: {},
    };
    assert.strictEqual(resolveUserId(reqWithSub), 'usr_abc');

    // Fallback header when unauthenticated directly
    const reqWithHeaderOnly = {
      headers: { 'x-user-id': '456' },
    };
    assert.strictEqual(resolveUserId(reqWithHeaderOnly), '456');

    // No user or header
    assert.strictEqual(resolveUserId({ headers: {} }), null);
  });

  await t.test('resolveUser returns req.user', () => {
    const user = { id: 1, username: 'test' };
    assert.strictEqual(resolveUser({ user }), user);
    assert.strictEqual(resolveUser({}), null);
    assert.strictEqual(resolveUser(null), null);
  });
});
