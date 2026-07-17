import express from 'express';
import { getAuditLogs } from '../controllers/auditController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Protect route and allow only admin
router.get('/', protect, authorize('admin'), getAuditLogs);

export default router;
