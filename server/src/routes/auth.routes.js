const { Router } = require('express');
const { login, register } = require('../controllers/auth.controller');

const authRoutes = Router();
authRoutes.post('/login', login);
authRoutes.post('/register', register);

module.exports = { authRoutes };