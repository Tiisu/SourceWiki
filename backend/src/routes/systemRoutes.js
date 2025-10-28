import express from 'express';
import SystemController from '../controllers/systemController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All system routes require admin access
router.use(protect);
router.use(authorize('admin'));

router.get('/health', SystemController.getSystemHealth);
router.get('/logs', SystemController.getSystemLogs);
router.get('/stats', SystemController.getSystemStats);
router.post('/maintenance', SystemController.maintainDatabase);
router.post('/backup', SystemController.backupDatabase);

export default router;