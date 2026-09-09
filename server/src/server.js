const cors = require('cors');
const express = require('express');
const { config } = require('./config');
const { authRoutes } = require('./routes/auth.routes');
const { usersRoutes } = require('./routes/users.routes');
const { transactionsRoutes } = require('./routes/transactions.routes');
const { budgetsRoutes } = require('./routes/budgets.routes');
const { reportsRoutes } = require('./routes/reports.routes');

const app = express();
app.use(cors());
app.use(express.json());
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/budgets', budgetsRoutes);
app.use('/api/reports', reportsRoutes);

app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
});