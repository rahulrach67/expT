const { Router } = require('express');
const { login, register } = require('../controllers/auth.controller');

const authRoutes = Router();
console.log("77777777777777777777777777777777777");

authRoutes.post('/login', login);
authRoutes.post('/register', register);

module.exports = { authRoutes };