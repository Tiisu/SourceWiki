import express from 'express';
import AdminController from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// Dashboard & Analytics
router.get('/dashboard', AdminController.getDashboard);
router.get('/analytics', AdminController.getAnalytics);

// User Management
router.get('/users', AdminController.getUsers);
router.put('/users/:id', AdminController.updateUser);
router.delete('/users/:id', AdminController.deleteUser);

// Submission Management
router.get('/submissions', AdminController.getSubmissions);
router.put('/submissions/:id/override', AdminController.overrideSubmission);
router.delete('/submissions/:id', AdminController.deleteSubmission);

export default router;