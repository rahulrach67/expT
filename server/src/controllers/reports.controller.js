const { pool } = require('../db');

async function getReportsSummary(req, res) {
  try {
    // 1. Overall totals
    const totalsRes = await pool.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'Income' THEN amount ELSE 0 END), 0)::float AS total_income,
        COALESCE(SUM(CASE WHEN type = 'Expense' THEN amount ELSE 0 END), 0)::float AS total_expenses,
        COUNT(*)::int AS total_transactions
      FROM transactions
    `);

    const totalIncome = totalsRes.rows[0].total_income;
    const totalExpenses = totalsRes.rows[0].total_expenses;
    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 1000) / 10 : 0;

    // 2. Category spending breakdown
    const categoryRes = await pool.query(`
      SELECT 
        category,
        SUM(amount)::float AS total,
        COUNT(*)::int AS count
      FROM transactions
      WHERE type = 'Expense'
      GROUP BY category
      ORDER BY total DESC
    `);

    const categoryBreakdown = categoryRes.rows.map(row => ({
      category: row.category,
      total: row.total,
      count: row.count,
      percentage: totalExpenses > 0 ? Math.round((row.total / totalExpenses) * 1000) / 10 : 0
    }));

    // 3. Monthly trends (payments vs receipts across months)
    const trendsRes = await pool.query(`
      SELECT 
        TO_CHAR(date_trunc('month', date), 'Mon') AS month,
        DATE_TRUNC('month', date) as sort_month,
        COALESCE(SUM(CASE WHEN type = 'Expense' THEN amount ELSE 0 END), 0)::float AS payments,
        COALESCE(SUM(CASE WHEN type = 'Income' THEN amount ELSE 0 END), 0)::float AS receipts
      FROM transactions
      GROUP BY date_trunc('month', date)
      ORDER BY sort_month ASC
      LIMIT 6
    `);

    // 4. Recent transactions
    const recentRes = await pool.query(`
      SELECT id, title, amount::float, type, category, TO_CHAR(date, 'YYYY-MM-DD') as date
      FROM transactions
      ORDER BY date DESC, id DESC
      LIMIT 5
    `);

    res.json({
      summary: {
        totalIncome,
        totalExpenses,
        netSavings,
        savingsRate,
        totalTransactions: totalsRes.rows[0].total_transactions
      },
      categoryBreakdown,
      monthlyTrends: trendsRes.rows,
      recentTransactions: recentRes.rows
    });
  } catch (error) {
    console.error('Error fetching reports summary:', error);
    res.status(500).json({ message: 'Unable to load reports summary.' });
  }
}

module.exports = { getReportsSummary };
