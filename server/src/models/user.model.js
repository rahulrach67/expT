const { pool } = require('../db');

async function findUserByUsername(username) {
  const result = await pool.query(
    'SELECT id, username, email, role, password_hash, created_at FROM users WHERE username = $1 LIMIT 1',
    [username],
  );
  return result.rows[0];
}

async function listUsers() {
  const result = await pool.query(
    'SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC',
  );
  return result.rows;
}

async function createUser({ username, email, passwordHash, role }) {
  const result = await pool.query(
    'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role, created_at',
    [username, email, passwordHash, role],
  );
  return result.rows[0];
}

async function updateUser(id, { username, email, passwordHash, role }) {
  const result = await pool.query(
    `UPDATE users
     SET username = $1, email = $2, role = $3, password_hash = COALESCE($4, password_hash)
     WHERE id = $5
     RETURNING id, username, email, role, created_at`,
    [username, email, role, passwordHash, id],
  );
  return result.rows[0];
}

async function deleteUser(id) {
  const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
  return result.rows[0];
}

module.exports = { createUser, deleteUser, findUserByUsername, listUsers, updateUser };