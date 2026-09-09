const bcrypt = require('bcryptjs');
const { createUser, deleteUser: removeUser, listUsers, updateUser } = require('../models/user.model');

async function getUsers(_req, res) {
  try {
    const users = await listUsers();
    res.json(users);
  } catch (error) {
    console.error('Error listing users:', error);
    res.status(500).json({ message: 'Unable to load users right now.' });
  }
}

async function addUser(req, res) {
  const { username, email, password, role = 'Member' } = req.body;

  if (!username || !email || !password) {
    res.status(400).json({ message: 'Username, email, and password are required.' });
    return;
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await createUser({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role,
    });
    res.status(201).json(user);
  } catch (error) {
    if (error.code === '23505') {
      res.status(409).json({ message: 'That username or email already exists.' });
      return;
    }
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Unable to create user right now.' });
  }
}

async function editUser(req, res) {
  const { username, email, password, role = 'Member' } = req.body;

  if (!username || !email) {
    res.status(400).json({ message: 'Username and email are required.' });
    return;
  }

  try {
    const passwordHash = password ? await bcrypt.hash(password, 12) : null;
    const user = await updateUser(req.params.id, {
      username: username.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role,
    });

    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }
    res.json(user);
  } catch (error) {
    if (error.code === '23505') {
      res.status(409).json({ message: 'That username or email already exists.' });
      return;
    }
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Unable to update user right now.' });
  }
}

async function deleteUser(req, res) {
  try {
    const user = await removeUser(req.params.id);
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Unable to delete user right now.' });
  }
}

module.exports = { addUser, deleteUser, editUser, getUsers };