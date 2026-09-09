const jwt = require('jsonwebtoken');
const { config } = require('../config');

const rolePermissions = {
  Owner: ['users:view', 'users:create', 'users:update', 'users:delete'],
  Admin: ['users:view', 'users:create', 'users:update', 'users:delete'],
  Member: ['users:view'],
};

function requireAuth(req, res, next) {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null;

  if (!token) {
    res.status(401).json({ message: 'Authentication is required.' });
    return;
  }

  try {
    req.user = jwt.verify(token, config.jwtSecret);
    next();
  } catch {
    res.status(401).json({ message: 'Your session has expired. Please sign in again.' });
  }
}

function requirePermission(permission) {
  return (req, res, next) => {
    const permissions = rolePermissions[req.user?.role] ?? [];
    if (!permissions.includes(permission)) {
      res.status(403).json({ message: 'You do not have permission to perform this action.' });
      return;
    }
    next();
  };
}

module.exports = { requireAuth, requirePermission, rolePermissions };