const { Router } = require('express');
const { getMe, login, register, verifySession } = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth.middleware');

/**
 * Authentication router handling sign-in, account creation,
 * session verification, and current user profile retrieval.
 */
const authRoutes = Router();

/**
 * @route POST /api/auth/login
 * @desc Authenticate with username and password, returns JWT token
 * @access Public
 */
authRoutes.post('/login', login);

/**
 * @route POST /api/auth/register
 * @desc Register a new user account, returns JWT token
 * @access Public
 */
authRoutes.post('/register', register);

/**
 * @route GET /api/auth/me
 * @desc Retrieve current authenticated user profile and token metadata
 * @access Protected (JWT Bearer token required)
 */
authRoutes.get('/me', requireAuth, getMe);

/**
 * @route POST /api/auth/verify
 * @desc Verify validity and decode claims of a JWT token
 * @access Public / Token-bearer
 */
authRoutes.post('/verify', verifySession);

module.exports = { authRoutes };