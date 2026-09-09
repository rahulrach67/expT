const { Router } = require('express');
const { addUser, deleteUser, editUser, getUsers } = require('../controllers/users.controller');
const { requireAuth, requirePermission } = require('../middleware/auth.middleware');

const usersRoutes = Router();
usersRoutes.use(requireAuth);
usersRoutes.get('/', requirePermission('users:view'), getUsers);
usersRoutes.post('/', requirePermission('users:create'), addUser);
usersRoutes.put('/:id', requirePermission('users:update'), editUser);
usersRoutes.delete('/:id', requirePermission('users:delete'), deleteUser);

module.exports = { usersRoutes };