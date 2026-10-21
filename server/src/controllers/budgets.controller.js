const { pool } = require('../db');

function resolveUserId(req) {
  return req.headers['x-user-id'] || req.headers['user-id'] || req.user?.sub || req.user?.id || req.user?.user_id;
}

async function getBudgets(req, res) {
  const userId = resolveUserId(req);
  if (!userId) {
    res.status(401).json({ message: 'Authentication is required.' });
    return;
  }

  try {
    const result = await pool.query(
      `SELECT 
        b.id,
        b.category,
        b.monthly_limit::float,
        COALESCE(SUM(CASE 
          WHEN t.type = 'Expense' 
               AND date_trunc('month', t.date) = date_trunc('month', CURRENT_DATE) 
          THEN t.amount 
          ELSE 0 
        END), 0)::float AS spent,
        (b.monthly_limit - COALESCE(SUM(CASE 
          WHEN t.type = 'Expense' 
               AND date_trunc('month', t.date) = date_trunc('month', CURRENT_DATE) 
          THEN t.amount 
          ELSE 0 
        END), 0))::float AS remaining,
        CASE 
          WHEN b.monthly_limit > 0 THEN 
            ROUND((COALESCE(SUM(CASE 
              WHEN t.type = 'Expense' 
                   AND date_trunc('month', t.date) = date_trunc('month', CURRENT_DATE) 
              THEN t.amount 
              ELSE 0 
            END), 0) / b.monthly_limit * 100)::numeric, 1)::float
          ELSE 0 
        END AS percentage
      FROM budgets b
      LEFT JOIN transactions t 
        ON LOWER(t.category) = LOWER(b.category) AND t.user_id = b.user_id
      WHERE b.user_id = $1
      GROUP BY b.id, b.category, b.monthly_limit
      ORDER BY percentage DESC, b.category ASC`,
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching budgets:', error);
    res.status(500).json({ message: 'Unable to load budgets right now.' });
  }
}

async function createOrUpdateBudget(req, res) {
  const { category, monthly_limit } = req.body;
  const userId = resolveUserId(req);

  if (!userId) {
    res.status(401).json({ message: 'Authentication is required.' });
    return;
  }

  if (!category || !monthly_limit) {
    res.status(400).json({ message: 'Category and monthly limit are required.' });
    return;
  }

  const limit = parseFloat(monthly_limit);
  if (isNaN(limit) || limit <= 0) {
    res.status(400).json({ message: 'Monthly limit must be a positive number.' });
    return;
  }

  try {
    // Check if budget for category already exists for THIS user
    const existing = await pool.query(
      'SELECT id FROM budgets WHERE LOWER(category) = LOWER($1) AND user_id = $2 LIMIT 1',
      [category.trim(), userId]
    );

    let result;
    if (existing.rows.length > 0) {
      result = await pool.query(
        'UPDATE budgets SET monthly_limit = $1 WHERE id = $2 AND user_id = $3 RETURNING id, category, monthly_limit::float',
        [limit, existing.rows[0].id, userId]
      );
    } else {
      result = await pool.query(
        'INSERT INTO budgets (user_id, category, monthly_limit) VALUES ($1, $2, $3) RETURNING id, category, monthly_limit::float',
        [userId, category.trim(), limit]
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error setting budget:', error);
    res.status(500).json({ message: 'Unable to save budget right now.' });
  }
}

async function deleteBudget(req, res) {
  const { id } = req.params;
  const userId = resolveUserId(req);

  if (!userId) {
    res.status(401).json({ message: 'Authentication is required.' });
    return;
  }

  try {
    const result = await pool.query(
      'DELETE FROM budgets WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    if (result.rowCount === 0) {
      res.status(404).json({ message: 'Budget not found.' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting budget:', error);
    res.status(500).json({ message: 'Unable to delete budget right now.' });
  }
}

module.exports = { createOrUpdateBudget, deleteBudget, getBudgets };
