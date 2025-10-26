const { body, query, param } = require('express-validator');

const systemValidation = {
  // ============================================================================
  // SYSTEM MONITORING VALIDATION
  // ============================================================================
  
  getSystemLogs: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('level')
      .optional()
      .isIn(['info', 'warning', 'error'])
      .withMessage('Level must be one of: info, warning, error'),
    query('category')
      .optional()
      .isIn(['auth', 'submission', 'user', 'system'])
      .withMessage('Category must be one of: auth, submission, user, system'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date')
  ],

  runMaintenance: [
    body('tasks')
      .isArray({ min: 1 })
      .withMessage('Tasks must be a non-empty array'),
    body('tasks.*')
      .isIn(['refresh_stats', 'cleanup_inactive', 'reindex_search', 'validate_data'])
      .withMessage('Invalid maintenance task')
  ],

  // ============================================================================
  // REPORTS VALIDATION
  // ============================================================================
  
  getOverviewReport: [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date'),
    query('country')
      .optional()
      .isLength({ min: 2, max: 2 })
      .withMessage('Country code must be 2 characters')
      .isAlpha()
      .withMessage('Country code must contain only letters')
  ],

  getCountryReport: [
    param('code')
      .isLength({ min: 2, max: 2 })
      .withMessage('Country code must be 2 characters')
      .isAlpha()
      .withMessage('Country code must contain only letters'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date')
  ],

  exportData: [
    body('type')
      .notEmpty()
      .withMessage('Export type is required')
      .isIn(['submissions', 'users', 'countries'])
      .withMessage('Type must be one of: submissions, users, countries'),
    body('format')
      .notEmpty()
      .withMessage('Export format is required')
      .isIn(['json', 'csv'])
      .withMessage('Format must be json or csv'),
    body('filters')
      .optional()
      .isObject()
      .withMessage('Filters must be an object'),
    body('fields')
      .optional()
      .isArray()
      .withMessage('Fields must be an array'),
    body('fields.*')
      .optional()
      .isString()
      .withMessage('Each field must be a string')
      .isLength({ min: 1, max: 50 })
      .withMessage('Field names must be between 1 and 50 characters')
  ]
};

module.exports = { systemValidation };