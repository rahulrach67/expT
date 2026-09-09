const { pool } = require('../db');

async function getBudgets(req, res) {
  try {
    const result = await pool.query(`
      SELECT 
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
        ON LOWER(t.category) = LOWER(b.category)
      GROUP BY b.id, b.category, b.monthly_limit
      ORDER BY percentage DESC, b.category ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching budgets:', error);
    res.status(500).json({ message: 'Unable to load budgets right now.' });
  }
}

async function createOrUpdateBudget(req, res) {
  const { category, monthly_limit } = req.body;
  const userId = req.user?.sub ?? null;

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
    // Check if budget for category already exists
    const existing = await pool.query(
      'SELECT id FROM budgets WHERE LOWER(category) = LOWER($1) LIMIT 1',
      [category.trim()]
    );

    let result;
    if (existing.rows.length > 0) {
      result = await pool.query(
        'UPDATE budgets SET monthly_limit = $1 WHERE id = $2 RETURNING id, category, monthly_limit::float',
        [limit, existing.rows[0].id]
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
  try {
    const result = await pool.query('DELETE FROM budgets WHERE id = $1 RETURNING id', [id]);
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
