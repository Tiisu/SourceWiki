const express = require('express');
const AdminController = require('../controllers/adminController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { adminValidation } = require('../tours/adminValidation');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// ============================================================================
// DASHBOARD & ANALYTICS ROUTES
// ============================================================================

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get admin dashboard overview with global statistics
 * @access  Admin
 */
router.get('/dashboard', AdminController.getDashboard);

/**
 * @route   GET /api/admin/analytics
 * @desc    Get detailed analytics with time periods and trends
 * @access  Admin
 * @query   period - 7d, 30d, 90d, 1y
 * @query   country - 2-letter country code
 */
router.get('/analytics', 
  adminValidation.getAnalytics,
  AdminController.getAnalytics
);

// ============================================================================
// USER MANAGEMENT ROUTES
// ============================================================================

/**
 * @route   GET /api/admin/users
 * @desc    List all users with advanced filtering
 * @access  Admin
 * @query   page, limit, role, country, status, search
 */
router.get('/users',
  adminValidation.getUsers,
  AdminController.getUsers
);

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Update user role, status, points, badges
 * @access  Admin
 */
router.put('/users/:id',
  adminValidation.updateUser,
  AdminController.updateUser
);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Soft delete user (deactivate account)
 * @access  Admin
 */
router.delete('/users/:id', AdminController.deleteUser);

// ============================================================================
// SUBMISSION MANAGEMENT ROUTES
// ============================================================================

/**
 * @route   GET /api/admin/submissions
 * @desc    Advanced submission management with filtering
 * @access  Admin
 * @query   page, limit, status, category, country, reliability, flagged, search
 */
router.get('/submissions',
  adminValidation.getSubmissions,
  AdminController.getSubmissions
);

/**
 * @route   PUT /api/admin/submissions/:id/override
 * @desc    Admin override of verification decisions
 * @access  Admin
 */
router.put('/submissions/:id/override',
  adminValidation.overrideSubmission,
  AdminController.overrideSubmission
);

/**
 * @route   PUT /api/admin/submissions/:id/flag
 * @desc    Flag submission for review
 * @access  Admin
 */
router.put('/submissions/:id/flag',
  adminValidation.flagSubmission,
  AdminController.flagSubmission
);

/**
 * @route   DELETE /api/admin/submissions/:id
 * @desc    Delete submission with reason
 * @access  Admin
 */
router.delete('/submissions/:id',
  adminValidation.deleteSubmission,
  AdminController.deleteSubmission
);

module.exports = router;