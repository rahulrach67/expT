const { pool } = require('../db');

async function getTransactions(req, res) {
  try {
    const result = await pool.query(
      `SELECT id, user_id, title, amount::float, type, category, 
              TO_CHAR(date, 'YYYY-MM-DD') as date, notes, created_at 
       FROM transactions 
       ORDER BY date DESC, id DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Unable to load transactions right now.' });
  }
}

async function createTransaction(req, res) {
  const { title, amount, type = 'Expense', category, date, notes } = req.body;
  const userId = req.user?.sub ?? null;

  if (!title || !amount || !category) {
    res.status(400).json({ message: 'Title, amount, and category are required.' });
    return;
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    res.status(400).json({ message: 'Amount must be a positive number.' });
    return;
  }

  try {
    const txDate = date ? new Date(date) : new Date();
    const result = await pool.query(
      `INSERT INTO transactions (user_id, title, amount, type, category, date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, user_id, title, amount::float, type, category, 
                 TO_CHAR(date, 'YYYY-MM-DD') as date, notes, created_at`,
      [userId, title.trim(), parsedAmount, type, category.trim(), txDate, notes ? notes.trim() : '']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ message: 'Unable to create transaction right now.' });
  }
}

async function deleteTransaction(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM transactions WHERE id = $1 RETURNING id', [id]);
    if (result.rowCount === 0) {
      res.status(404).json({ message: 'Transaction not found.' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ message: 'Unable to delete transaction right now.' });
  }
}

module.exports = { createTransaction, deleteTransaction, getTransactions };
