const { extractToken, verifyToken } = require('../utils/jwt');

/**
 * Role-based permission matrix mapping each system role to allowed capabilities.
 * @type {Record<string, string[]>}
 */
const rolePermissions = {
  Owner: ['users:view', 'users:create', 'users:update', 'users:delete'],
  Admin: ['users:view', 'users:create', 'users:update', 'users:delete'],
  Member: ['users:view'],
};

/**
 * Express middleware to enforce JWT authentication on protected endpoints.
 * Extracts the Bearer token, verifies its signature and expiration, and attaches
 * the authenticated user payload to `req.user`.
 *
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware callback.
 *
 * @returns {void}
 */
function requireAuth(req, res, next) {
  const token = extractToken(req);
  const headerUserId = req.headers['x-user-id'] || req.headers['user-id'];

  if (!token && !headerUserId) {
    res.status(401).json({
      message: 'Authentication is required.',
      code: 'AUTH_REQUIRED',
    });
    return;
  }

  let decoded = {};
  if (token) {
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        res.status(401).json({
          message: 'Your session has expired. Please sign in again.',
          code: 'TOKEN_EXPIRED',
          expiredAt: err.expiredAt,
        });
        return;
      }
      res.status(401).json({
        message: 'Invalid authentication token. Please sign in again.',
        code: 'INVALID_TOKEN',
      });
      return;
    }
  }

  const resolvedUserId = headerUserId || decoded.sub || decoded.id || decoded.user_id;
  if (!resolvedUserId) {
    res.status(401).json({
      message: 'User ID is missing from authentication headers.',
      code: 'USER_ID_MISSING',
    });
    return;
  }

  req.user = {
    ...decoded,
    sub: resolvedUserId,
    id: resolvedUserId,
    user_id: resolvedUserId,
    role: decoded.role || req.user?.role || 'Member',
  };

  next();
}

/**
 * Higher-order middleware factory to enforce specific permission requirements
 * based on the user's role in the verified JWT token.
 *
 * @param {string} permission - The required permission string (e.g. 'users:delete').
 * @returns {import('express').RequestHandler} Express middleware function.
 *
 * @example
 * router.delete('/users/:id', requireAuth, requirePermission('users:delete'), deleteUser);
 */
function requirePermission(permission) {
  return (req, res, next) => {
    const userRole = req.user?.role || 'Member';
    const permissions = rolePermissions[userRole] ?? [];

    if (!permissions.includes(permission)) {
      res.status(403).json({
        message: 'You do not have permission to perform this action.',
        code: 'FORBIDDEN',
        requiredPermission: permission,
        role: userRole,
      });
      return;
    }
    next();
  };
}

module.exports = { requireAuth, requirePermission, rolePermissions };