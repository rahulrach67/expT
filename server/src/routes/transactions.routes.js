const { Router } = require('express');
const { createTransaction, deleteTransaction, getTransactions } = require('../controllers/transactions.controller');
const { requireAuth } = require('../middleware/auth.middleware');

const transactionsRoutes = Router();
transactionsRoutes.use(requireAuth);
transactionsRoutes.get('/', getTransactions);
transactionsRoutes.post('/', createTransaction);
transactionsRoutes.delete('/:id', deleteTransaction);

module.exports = { transactionsRoutes };
