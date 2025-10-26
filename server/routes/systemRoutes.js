const express = require('express');
const SystemController = require('../controllers/systemController');
const ReportsController = require('../controllers/reportsController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { systemValidation } = require('../tours/systemValidation');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// ============================================================================
// SYSTEM MONITORING ROUTES
// ============================================================================

/**
 * @route   GET /api/admin/system/health
 * @desc    System health monitoring
 * @access  Admin
 */
router.get('/system/health', SystemController.getSystemHealth);

/**
 * @route   GET /api/admin/system/logs
 * @desc    System activity logs
 * @access  Admin
 * @query   page, limit, level, category, startDate, endDate
 */
router.get('/system/logs',
  systemValidation.getSystemLogs,
  SystemController.getSystemLogs
);

/**
 * @route   POST /api/admin/system/maintenance
 * @desc    Trigger maintenance tasks
 * @access  Admin
 */
router.post('/system/maintenance',
  systemValidation.runMaintenance,
  SystemController.runMaintenance
);

// ============================================================================
// REPORTS ROUTES
// ============================================================================

/**
 * @route   GET /api/admin/reports/overview
 * @desc    Generate platform overview report
 * @access  Admin
 * @query   startDate, endDate, country
 */
router.get('/reports/overview',
  systemValidation.getOverviewReport,
  ReportsController.getOverviewReport
);

/**
 * @route   GET /api/admin/reports/country/:code
 * @desc    Country-specific detailed report
 * @access  Admin
 * @query   startDate, endDate
 */
router.get('/reports/country/:code',
  systemValidation.getCountryReport,
  ReportsController.getCountryReport
);

/**
 * @route   POST /api/admin/reports/export
 * @desc    Export data to JSON/CSV
 * @access  Admin
 */
router.post('/reports/export',
  systemValidation.exportData,
  ReportsController.exportData
);

module.exports = router;