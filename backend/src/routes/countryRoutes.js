import express from 'express';
import CountryController from '../controllers/countryController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/list', CountryController.getCountriesList); // Simple list for dropdowns
router.get('/', CountryController.getCountries);
router.get('/:code/stats', CountryController.getCountryStats);

// Protected routes (admin only)
router.use(protect);
router.use(authorize('admin'));

router.post('/', CountryController.createCountry);
router.put('/:code', CountryController.updateCountry);
router.delete('/:code', CountryController.deleteCountry);
router.post('/:code/update-stats', CountryController.updateCountryStats);
router.post('/:code/assign-verifier', CountryController.assignVerifier);
router.post('/:code/remove-verifier', CountryController.removeVerifier);

export default router;