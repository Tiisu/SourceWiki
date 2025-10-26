import express from 'express';
import {
  getUserProfile,
  getLeaderboard,
  awardBadge,
  updateUserRole,
  getUsers,
  deactivateUser,
  activateUser
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/leaderboard', getLeaderboard);
router.get('/', protect, authorize('admin'), getUsers);
router.get('/:id', getUserProfile);

router.post('/:id/badge', protect, authorize('admin'), awardBadge);
router.put('/:id/role', protect, authorize('admin'), updateUserRole);
router.put('/:id/deactivate', protect, authorize('admin'), deactivateUser);
router.put('/:id/activate', protect, authorize('admin'), activateUser);

export default router;
