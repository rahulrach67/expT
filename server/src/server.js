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

app.get('/', (req, res) => {
  res.send('Backend is running successfully!');
});
console.log("are you listening............................");

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/budgets', budgetsRoutes);
app.use('/api/reports', reportsRoutes);

app.listen(config.port, '0.0.0.0', () => {
  console.log(`API listening on port ${config.port}`);
});

module.exports = app;