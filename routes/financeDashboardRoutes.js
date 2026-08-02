const express             = require('express');
const router              = express.Router();
const financeDashboardController = require('../controllers/financeDashboardController');

// ── DASHBOARD ──────────────────────────────────────────────────────────────
router.get('/', financeDashboardController.getFinanceDashboard);

module.exports = router;
