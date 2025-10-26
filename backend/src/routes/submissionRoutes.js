import express from 'express';
import {
  createSubmission,
  getSubmissions,
  getSubmission,
  getMySubmissions,
  updateSubmission,
  deleteSubmission,
  verifySubmission,
  getPendingSubmissionsForCountry,
  getSubmissionStats
} from '../controllers/submissionController.js';
import { protect, authorize } from '../middleware/auth.js';
import { submissionValidation, verificationValidation, validate } from '../middleware/validator.js';

const router = express.Router();

router.route('/')
  .get(getSubmissions)
  .post(protect, submissionValidation, validate, createSubmission);

router.get('/stats', getSubmissionStats);
router.get('/my/submissions', protect, getMySubmissions);
router.get('/pending/country', protect, authorize('verifier', 'admin'), getPendingSubmissionsForCountry);

router.route('/:id')
  .get(getSubmission)
  .put(protect, updateSubmission)
  .delete(protect, deleteSubmission);

router.put('/:id/verify', protect, authorize('verifier', 'admin'), verificationValidation, validate, verifySubmission);

export default router;
