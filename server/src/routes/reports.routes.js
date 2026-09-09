const { Router } = require('express');
const { getReportsSummary } = require('../controllers/reports.controller');
const { requireAuth } = require('../middleware/auth.middleware');

const reportsRoutes = Router();
reportsRoutes.use(requireAuth);
reportsRoutes.get('/summary', getReportsSummary);

module.exports = { reportsRoutes };
