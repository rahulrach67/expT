const jwt = require('jsonwebtoken');
const { config } = require('../config');

/**
 * @typedef {Object} JwtUserPayload
 * @property {string|number} sub - Subject identifier (User ID)
 * @property {string|number} id - User ID
 * @property {string|number} user_id - User ID alias
 * @property {string} username - User account username
 * @property {string} [role] - User role ('Owner' | 'Admin' | 'Member')
 * @property {string} [email] - User email address
 * @property {number} [iat] - Issued-at timestamp (seconds)
 * @property {number} [exp] - Expiration timestamp (seconds)
 */

/**
 * Generates a signed JSON Web Token (JWT) for a given user or payload.
 *
 * @param {Object} userOrPayload - User object or payload containing id/username/role.
 * @param {number|string} userOrPayload.id - User ID.
 * @param {string} userOrPayload.username - Username.
 * @param {string} [userOrPayload.role='Member'] - User role (Owner, Admin, Member).
 * @param {string} [userOrPayload.email] - Optional email address.
 * @param {jwt.SignOptions} [options={}] - jsonwebtoken sign options (e.g. expiresIn, audience).
 * @returns {string} Signed JWT token string.
 *
 * @example
 * const token = generateToken({ id: 1, username: 'alice', role: 'Admin' });
 * const customToken = generateToken({ id: 2, username: 'bob' }, { expiresIn: '2h' });
 */
function generateToken(userOrPayload, options = {}) {
  const userId = userOrPayload.id ?? userOrPayload.sub ?? userOrPayload.user_id;

  const payload = {
    sub: userId,
    id: userId,
    user_id: userId,
    username: userOrPayload.username,
    role: userOrPayload.role || 'Member',
    ...(userOrPayload.email ? { email: userOrPayload.email } : {}),
  };

  const signOptions = {
    expiresIn: options.expiresIn || config.jwtExpiresIn || '8h',
    ...options,
  };

  return jwt.sign(payload, config.jwtSecret, signOptions);
}

/**
 * Verifies a JWT token signature, expiration, and format.
 *
 * @param {string} token - The raw JWT token string.
 * @param {jwt.VerifyOptions} [options={}] - Optional jsonwebtoken verification options.
 * @returns {JwtUserPayload} The decoded payload if verification succeeds.
 * @throws {jwt.TokenExpiredError} When the token has passed its expiration time.
 * @throws {jwt.JsonWebTokenError} When the signature is invalid or token is malformed.
 *
 * @example
 * try {
 *   const decoded = verifyToken(token);
 *   console.log('User ID:', decoded.id);
 * } catch (error) {
 *   console.error('Invalid token:', error.message);
 * }
 */
function verifyToken(token, options = {}) {
  if (!token || typeof token !== 'string') {
    const error = new Error('JWT token is required for verification.');
    error.name = 'JsonWebTokenError';
    throw error;
  }

  return jwt.verify(token, config.jwtSecret, options);
}

/**
 * Decodes a JWT token without verifying the cryptographic signature.
 * Useful for inspecting payload headers or expired tokens for user info.
 *
 * @param {string} token - The raw JWT token string.
 * @param {jwt.DecodeOptions} [options={}] - jsonwebtoken decode options.
 * @returns {JwtUserPayload|null} Decoded payload or null if decoding fails.
 *
 * @example
 * const claims = decodeToken(token);
 * console.log('Token expires at:', new Date(claims.exp * 1000));
 */
function decodeToken(token, options = {}) {
  try {
    if (!token || typeof token !== 'string') return null;
    return jwt.decode(token, options);
  } catch {
    return null;
  }
}

/**
 * Extracts a Bearer token string from an HTTP Authorization header value.
 *
 * @param {string} [headerValue] - The 'Authorization' header string (e.g. 'Bearer eyJ...').
 * @returns {string|null} The token string if found, or null otherwise.
 *
 * @example
 * const token = extractTokenFromHeader(req.headers.authorization);
 */
function extractTokenFromHeader(headerValue) {
  if (!headerValue || typeof headerValue !== 'string') return null;
  const parts = headerValue.trim().split(' ');
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    return parts[1];
  }
  return null;
}

/**
 * Extracts a JWT token from an Express request object from multiple potential sources:
 * 1. Authorization header (Bearer <token>)
 * 2. x-access-token header
 * 3. Query string token parameter (?token=<token>)
 *
 * @param {import('express').Request} req - Express request object.
 * @returns {string|null} The raw JWT token string if found, or null.
 *
 * @example
 * const token = extractToken(req);
 */
function extractToken(req) {
  if (!req) return null;

  // 1. Authorization Bearer header
  const authHeader = req.headers?.authorization;
  const tokenFromAuth = extractTokenFromHeader(authHeader);
  if (tokenFromAuth) return tokenFromAuth;

  // 2. x-access-token header fallback
  const customHeader = req.headers?.['x-access-token'];
  if (typeof customHeader === 'string' && customHeader.trim()) {
    return customHeader.trim();
  }

  // 3. Query string (?token=...)
  if (req.query && typeof req.query.token === 'string' && req.query.token.trim()) {
    return req.query.token.trim();
  }

  return null;
}

/**
 * Resolves the authenticated user object from the request.
 * Populated by requireAuth middleware or decoded token.
 *
 * @param {import('express').Request} req - Express request object.
 * @returns {JwtUserPayload|null} The authenticated user payload or null.
 *
 * @example
 * const user = resolveUser(req);
 * if (user) console.log('Authenticated username:', user.username);
 */
function resolveUser(req) {
  return req?.user || null;
}

/**
 * Resolves the authenticated user ID from the request.
 * Prioritizes req.user claims from verified JWT token, with backward-compatible
 * fallback to x-user-id or user-id HTTP headers.
 *
 * @param {import('express').Request} req - Express request object.
 * @returns {string|number|null} The user ID, or null if unauthenticated.
 *
 * @example
 * const userId = resolveUserId(req);
 * if (!userId) {
 *   return res.status(401).json({ message: 'Authentication required' });
 * }
 */
function resolveUserId(req) {
  if (!req) return null;

  // Primary: verified JWT payload attached by auth middleware
  if (req.user) {
    const id = req.user.id ?? req.user.sub ?? req.user.user_id;
    if (id !== undefined && id !== null && id !== '') return id;
  }

  // Backward-compatible fallback for development/proxy headers
  const headerId = req.headers?.['x-user-id'] || req.headers?.['user-id'];
  if (headerId) return headerId;

  return null;
}

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
  extractTokenFromHeader,
  extractToken,
  resolveUser,
  resolveUserId,
};
