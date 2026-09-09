const { Router } = require('express');
const { createOrUpdateBudget, deleteBudget, getBudgets } = require('../controllers/budgets.controller');
const { requireAuth } = require('../middleware/auth.middleware');

const budgetsRoutes = Router();
budgetsRoutes.use(requireAuth);
budgetsRoutes.get('/', getBudgets);
budgetsRoutes.post('/', createOrUpdateBudget);
budgetsRoutes.delete('/:id', deleteBudget);

module.exports = { budgetsRoutes };
