import express from 'express';
import ReportsController from '../controllers/reportsController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All reports routes require admin or verifier access
router.use(protect);
router.use(authorize('admin', 'verifier'));

router.get('/overview', ReportsController.getOverviewReport);
router.get('/country/:country', ReportsController.getCountryReport);
router.get('/user/:userId', ReportsController.getUserReport);

export default router;