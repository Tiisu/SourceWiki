const { body, query, param } = require('express-validator');

const adminValidation = {
  // ============================================================================
  // ANALYTICS VALIDATION
  // ============================================================================
  
  getAnalytics: [
    query('period')
      .optional()
      .isIn(['7d', '30d', '90d', '1y'])
      .withMessage('Period must be one of: 7d, 30d, 90d, 1y'),
    query('country')
      .optional()
      .isLength({ min: 2, max: 2 })
      .withMessage('Country code must be 2 characters')
      .isAlpha()
      .withMessage('Country code must contain only letters')
  ],

  // ============================================================================
  // USER MANAGEMENT VALIDATION
  // ============================================================================
  
  getUsers: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('role')
      .optional()
      .isIn(['admin', 'country_verifier', 'contributor'])
      .withMessage('Invalid role'),
    query('country')
      .optional()
      .isLength({ min: 2, max: 2 })
      .withMessage('Country code must be 2 characters'),
    query('status')
      .optional()
      .isIn(['active', 'inactive'])
      .withMessage('Status must be active or inactive'),
    query('search')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Search term must be between 1 and 100 characters')
      .trim()
  ],

  updateUser: [
    param('id')
      .isMongoId()
      .withMessage('Invalid user ID'),
    body('role')
      .optional()
      .isIn(['admin', 'country_verifier', 'contributor'])
      .withMessage('Invalid role'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
    body('country')
      .optional()
      .isLength({ min: 2, max: 2 })
      .withMessage('Country code must be 2 characters')
      .isAlpha()
      .withMessage('Country code must contain only letters'),
    body('points')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Points must be a non-negative integer'),
    body('badges')
      .optional()
      .isArray()
      .withMessage('Badges must be an array'),
    body('badges.*')
      .optional()
      .isIn([
        'first-submission', 
        'reliable-hunter', 
        'country-expert', 
        'wikimedia-contributor', 
        'source-guardian', 
        'quality-verifier', 
        'citation-champion'
      ])
      .withMessage('Invalid badge type')
  ],

  // ============================================================================
  // SUBMISSION MANAGEMENT VALIDATION
  // ============================================================================
  
  getSubmissions: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('status')
      .optional()
      .isIn(['pending', 'verified', 'rejected'])
      .withMessage('Invalid status'),
    query('category')
      .optional()
      .isIn(['primary', 'secondary', 'not_reliable'])
      .withMessage('Invalid category'),
    query('country')
      .optional()
      .isLength({ min: 2, max: 2 })
      .withMessage('Country code must be 2 characters'),
    query('reliability')
      .optional()
      .isIn(['credible', 'unreliable', 'needs_review'])
      .withMessage('Invalid reliability'),
    query('flagged')
      .optional()
      .isBoolean()
      .withMessage('Flagged must be a boolean'),
    query('search')
      .optional()
      .isLength({ min: 1, max: 200 })
      .withMessage('Search term must be between 1 and 200 characters')
      .trim()
  ],

  overrideSubmission: [
    param('id')
      .isMongoId()
      .withMessage('Invalid submission ID'),
    body('status')
      .isIn(['verified', 'rejected'])
      .withMessage('Status must be verified or rejected'),
    body('reliability')
      .optional()
      .isIn(['credible', 'unreliable', 'needs_review'])
      .withMessage('Invalid reliability'),
    body('adminNotes')
      .notEmpty()
      .withMessage('Admin notes are required for override')
      .isLength({ min: 10, max: 1000 })
      .withMessage('Admin notes must be between 10 and 1000 characters')
      .trim(),
    body('reason')
      .notEmpty()
      .withMessage('Override reason is required')
      .isLength({ min: 10, max: 500 })
      .withMessage('Reason must be between 10 and 500 characters')
      .trim()
  ],

  flagSubmission: [
    param('id')
      .isMongoId()
      .withMessage('Invalid submission ID'),
    body('reason')
      .notEmpty()
      .withMessage('Flag reason is required')
      .isLength({ min: 10, max: 1000 })
      .withMessage('Reason must be between 10 and 1000 characters')
      .trim(),
    body('priority')
      .optional()
      .isIn(['low', 'normal', 'high'])
      .withMessage('Priority must be low, normal, or high')
  ],

  deleteSubmission: [
    param('id')
      .isMongoId()
      .withMessage('Invalid submission ID'),
    body('reason')
      .notEmpty()
      .withMessage('Deletion reason is required')
      .isLength({ min: 10, max: 1000 })
      .withMessage('Reason must be between 10 and 1000 characters')
      .trim()
  ]
};

module.exports = { adminValidation };