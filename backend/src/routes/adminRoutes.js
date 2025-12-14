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

// Export Functionality
router.get('/export/submissions', AdminController.exportSubmissions);
router.get('/export/filters', AdminController.getExportFilters);

// Batch Operations
router.post('/batch/approve', AdminController.batchApproveSubmissions);
router.post('/batch/reject', AdminController.batchRejectSubmissions);
router.post('/batch/delete', AdminController.batchDeleteSubmissions);
router.post('/batch/update-status', AdminController.batchUpdateStatus);
router.post('/batch/preview', AdminController.getBatchOperationPreview);

export default router;