const express = require('express');
const CountryController = require('../controllers/countryController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { countryValidation } = require('../tours/countryValidation');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// ============================================================================
// COUNTRY MANAGEMENT ROUTES
// ============================================================================

/**
 * @route   GET /api/admin/countries
 * @desc    List all countries with statistics
 * @access  Admin
 * @query   page, limit, sortBy, search
 */
router.get('/countries',
  countryValidation.getCountries,
  CountryController.getCountries
);

/**
 * @route   POST /api/admin/countries
 * @desc    Create new country entry
 * @access  Admin
 */
router.post('/countries',
  countryValidation.createCountry,
  CountryController.createCountry
);

/**
 * @route   PUT /api/admin/countries/:code
 * @desc    Update country details
 * @access  Admin
 */
router.put('/countries/:code',
  countryValidation.updateCountry,
  CountryController.updateCountry
);

/**
 * @route   POST /api/admin/countries/:code/refresh-stats
 * @desc    Manually refresh country statistics
 * @access  Admin
 */
router.post('/countries/:code/refresh-stats', 
  CountryController.refreshCountryStats
);

// ============================================================================
// VERIFIER MANAGEMENT ROUTES
// ============================================================================

/**
 * @route   GET /api/admin/verifiers
 * @desc    List all verifiers across countries
 * @access  Admin
 * @query   page, limit, country, active, search
 */
router.get('/verifiers',
  countryValidation.getVerifiers,
  CountryController.getVerifiers
);

/**
 * @route   POST /api/admin/countries/:code/verifiers
 * @desc    Assign verifier to country
 * @access  Admin
 */
router.post('/countries/:code/verifiers',
  countryValidation.assignVerifier,
  CountryController.assignVerifier
);

/**
 * @route   PUT /api/admin/countries/:code/verifiers/:userId
 * @desc    Update verifier specializations or status
 * @access  Admin
 */
router.put('/countries/:code/verifiers/:userId',
  countryValidation.updateVerifier,
  CountryController.updateVerifier
);

/**
 * @route   DELETE /api/admin/countries/:code/verifiers/:userId
 * @desc    Remove verifier from country
 * @access  Admin
 */
router.delete('/countries/:code/verifiers/:userId',
  CountryController.removeVerifier
);

module.exports = router;