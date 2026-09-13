const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { config } = require('../config');
const { createUser, findUserByUsername } = require('../models/user.model');

async function login(req, res) {
  const { username, password } = req.body;
  console.log('Login request received with username:', username);

  if (!username || !password) {
    res.status(400).json({ message: 'Username and password are required.' });
    return;
  }

  try {
    console.log("000000000000000000000000000000000000000000000000");

    const user = await findUserByUsername(username.trim());
    const passwordMatches = user ? await bcrypt.compare(password, user.password_hash) : false;

    if (!user || !passwordMatches) {
      res.status(401).json({ message: 'Invalid username or password.' });
      return;
    }

    const token = jwt.sign({ sub: user.id, username: user.username, role: user.role }, config.jwtSecret, { expiresIn: '8h' });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch {
    res.status(500).json({ message: 'Unable to sign in right now.' });
  }
}

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

    const token = jwt.sign(
      { sub: user.id, username: user.username, role: user.role },
      config.jwtSecret,
      { expiresIn: '8h' },
    );
    res.status(201).json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (error) {
    if (error.code === '23505') {
      res.status(409).json({ message: 'That username or email already exists.' });
      return;
    }
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Unable to create account right now.' });
  }
}

module.exports = { login, register };