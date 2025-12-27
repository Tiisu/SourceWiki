import express from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';
import {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  getSettings,
  updateSettings,
  listAuditLogs,
} from '../controllers/adminController';

const router = express.Router();

router.use(requireAuth);
router.use(requireAdmin);

// Users
router.get('/users', listUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Settings
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

// Audit logs
router.get('/audit-logs', listAuditLogs);

export default router;