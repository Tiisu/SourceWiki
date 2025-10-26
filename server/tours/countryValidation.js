const { body, query, param } = require('express-validator');

const countryValidation = {
  // ============================================================================
  // COUNTRY MANAGEMENT VALIDATION
  // ============================================================================
  
  getCountries: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('sortBy')
      .optional()
      .isIn(['name', 'submissions', 'verifiers', 'activity'])
      .withMessage('SortBy must be one of: name, submissions, verifiers, activity'),
    query('search')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Search term must be between 1 and 100 characters')
      .trim()
  ],

  createCountry: [
    body('countryCode')
      .notEmpty()
      .withMessage('Country code is required')
      .isLength({ min: 2, max: 2 })
      .withMessage('Country code must be exactly 2 characters')
      .isAlpha()
      .withMessage('Country code must contain only letters')
      .toUpperCase(),
    body('countryName')
      .notEmpty()
      .withMessage('Country name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Country name must be between 2 and 100 characters')
      .trim()
      .escape()
  ],

  updateCountry: [
    param('code')
      .isLength({ min: 2, max: 2 })
      .withMessage('Country code must be 2 characters')
      .isAlpha()
      .withMessage('Country code must contain only letters'),
    body('countryName')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Country name must be between 2 and 100 characters')
      .trim()
      .escape()
  ],

  // ============================================================================
  // VERIFIER MANAGEMENT VALIDATION
  // ============================================================================
  
  getVerifiers: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('country')
      .optional()
      .isLength({ min: 2, max: 2 })
      .withMessage('Country code must be 2 characters')
      .isAlpha()
      .withMessage('Country code must contain only letters'),
    query('active')
      .optional()
      .isBoolean()
      .withMessage('Active must be a boolean'),
    query('search')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Search term must be between 1 and 100 characters')
      .trim()
  ],

  assignVerifier: [
    param('code')
      .isLength({ min: 2, max: 2 })
      .withMessage('Country code must be 2 characters')
      .isAlpha()
      .withMessage('Country code must contain only letters'),
    body('userId')
      .notEmpty()
      .withMessage('User ID is required')
      .isMongoId()
      .withMessage('Invalid user ID format'),
    body('specializations')
      .optional()
      .isArray()
      .withMessage('Specializations must be an array'),
    body('specializations.*')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Each specialization must be between 2 and 100 characters')
      .trim()
      .escape()
  ],

  updateVerifier: [
    param('code')
      .isLength({ min: 2, max: 2 })
      .withMessage('Country code must be 2 characters')
      .isAlpha()
      .withMessage('Country code must contain only letters'),
    param('userId')
      .isMongoId()
      .withMessage('Invalid user ID format'),
    body('specializations')
      .optional()
      .isArray()
      .withMessage('Specializations must be an array'),
    body('specializations.*')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Each specialization must be between 2 and 100 characters')
      .trim()
      .escape(),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean')
  ]
};

module.exports = { countryValidation };