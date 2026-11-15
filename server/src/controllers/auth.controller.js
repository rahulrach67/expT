const bcrypt = require('bcryptjs');
const { createUser, findUserByUsername } = require('../models/user.model');
const { generateToken, verifyToken, extractToken } = require('../utils/jwt');

/**
 * Handles user login authentication.
 * Verifies username and password against the database, then issues a signed JWT token.
 *
 * @param {import('express').Request} req - Express request containing { username, password }.
 * @param {import('express').Response} res - Express response with { token, user }.
 * @returns {Promise<void>}
 */
async function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ message: 'Username and password are required.' });
    return;
  }

  try {
    const user = await findUserByUsername(username.trim());
    const passwordMatches = user ? await bcrypt.compare(password, user.password_hash) : false;

    if (!user || !passwordMatches) {
      res.status(401).json({ message: 'Invalid username or password.' });
      return;
    }

    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role,
      email: user.email,
    });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Unable to sign in right now.' });
  }
}

/**
 * Handles user account registration.
 * Hashes the password using bcrypt, persists the user in PostgreSQL,
 * and issues a signed JWT token.
 *
 * @param {import('express').Request} req - Express request containing { username, email, password }.
 * @param {import('express').Response} res - Express response with { token, user } (201 Created).
 * @returns {Promise<void>}
 */
async function register(req, res) {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    res.status(400).json({ message: 'Username, email, and password are required.' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ message: 'Password must be at least 6 characters.' });
    return;
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await createUser({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role: 'Member',
    });

    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role,
      email: user.email,
    });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email,
      },
    });
  } catch (error) {
    if (error.code === '23505') {
      res.status(409).json({ message: 'That username or email already exists.' });
      return;
    }
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Unable to create account right now.' });
  }
}

/**
 * Returns the currently authenticated user's profile and token metadata.
 * Requires requireAuth middleware.
 *
 * @param {import('express').Request} req - Express request with decoded req.user.
 * @param {import('express').Response} res - Express response containing user profile.
 * @returns {Promise<void>}
 */
async function getMe(req, res) {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication is required.' });
      return;
    }

    res.json({
      user: {
        id: req.user.id || req.user.sub,
        username: req.user.username,
        role: req.user.role || 'Member',
        email: req.user.email,
      },
      tokenMeta: {
        issuedAt: req.user.iat ? new Date(req.user.iat * 1000).toISOString() : null,
        expiresAt: req.user.exp ? new Date(req.user.exp * 1000).toISOString() : null,
      },
    });
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ message: 'Unable to load profile right now.' });
  }
}

/**
 * Verifies a JWT token provided in the Authorization header or request body.
 * Returns verification status, decoded claims, and validity details.
 *
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response with { valid, decoded }.
 * @returns {void}
 */
function verifySession(req, res) {
  const token = req.body?.token || extractToken(req);

  if (!token) {
    res.status(400).json({
      valid: false,
      message: 'Token is required for verification.',
      code: 'TOKEN_REQUIRED',
    });
    return;
  }

  try {
    const decoded = verifyToken(token);
    res.json({
      valid: true,
      user: {
        id: decoded.id || decoded.sub,
        username: decoded.username,
        role: decoded.role,
        email: decoded.email,
      },
      expiresAt: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : null,
    });
  } catch (err) {
    res.status(401).json({
      valid: false,
      message: err.name === 'TokenExpiredError' ? 'Token has expired.' : 'Invalid token.',
      code: err.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
      error: err.message,
    });
  }
}

module.exports = {
  login,
  register,
  getMe,
  verifySession,
};