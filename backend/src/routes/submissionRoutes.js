import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
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
import { uploadPDF, handleUploadError } from '../middleware/upload.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

router.route('/')
  .get(getSubmissions)
  .post(
    protect,
    uploadPDF, // Multer middleware - will only process if file is present
    handleUploadError, // Handle multer errors
    submissionValidation,
    validate,
    createSubmission
  );

router.get('/stats', getSubmissionStats);
router.get('/my/submissions', protect, getMySubmissions);
router.get('/pending/country', protect, authorize('verifier', 'admin'), getPendingSubmissionsForCountry);

router.route('/:id')
  .get(getSubmission)
  .put(protect, updateSubmission)
  .delete(protect, deleteSubmission);

router.put('/:id/verify', protect, authorize('verifier', 'admin'), verificationValidation, validate, verifySubmission);

// Route to serve uploaded PDF files
router.get('/uploads/:filename', (req, res, next) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../../uploads', filename);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      message: 'File not found'
    });
  }

  // Set appropriate headers for PDF
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

  // Stream the file
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);

  fileStream.on('error', (err) => {
    next(err);
  });
});

export default router;
