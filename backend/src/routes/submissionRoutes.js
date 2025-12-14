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

/**
 * @swagger
 * /api/submissions:
 *   get:
 *     summary: Get all submissions
 *     tags: [Submissions]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, verified, rejected]
 *         description: Filter by status
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: Filter by country code
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of submissions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Submission'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: number
 *                     limit:
 *                       type: number
 *                     total:
 *                       type: number
 */
router.route('/')
  .get(getSubmissions);

/**
 * @swagger
 * /api/submissions:
 *   post:
 *     summary: Create a new submission
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - url
 *               - country
 *             properties:
 *               title:
 *                 type: string
 *                 example: Artificial Intelligence
 *               url:
 *                 type: string
 *                 format: uri
 *                 example: https://en.wikipedia.org/wiki/Artificial_intelligence
 *               country:
 *                 type: string
 *                 example: US
 *     responses:
 *       201:
 *         description: Submission created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Submission'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.route('/')
  .post(protect, submissionValidation, validate, createSubmission);

/**
 * @swagger
 * /api/submissions/stats:
 *   get:
 *     summary: Get submission statistics
 *     tags: [Submissions]
 *     responses:
 *       200:
 *         description: Submission statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     pending:
 *                       type: number
 *                     verified:
 *                       type: number
 *                     rejected:
 *                       type: number
 */
router.get('/stats', getSubmissionStats);

/**
 * @swagger
 * /api/submissions/my/submissions:
 *   get:
 *     summary: Get current user's submissions
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, verified, rejected]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: User's submissions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Submission'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/my/submissions', protect, getMySubmissions);

/**
 * @swagger
 * /api/submissions/pending/country:
 *   get:
 *     summary: Get pending submissions for verifier's country
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Pending submissions for country
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Submission'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/pending/country', protect, authorize('verifier', 'admin'), getPendingSubmissionsForCountry);

/**
 * @swagger
 * /api/submissions/{id}:
 *   get:
 *     summary: Get a single submission by ID
 *     tags: [Submissions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Submission ID
 *     responses:
 *       200:
 *         description: Submission details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Submission'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.route('/:id')
  .get(getSubmission);

/**
 * @swagger
 * /api/submissions/{id}:
 *   put:
 *     summary: Update a submission
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Submission ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               url:
 *                 type: string
 *                 format: uri
 *               country:
 *                 type: string
 *     responses:
 *       200:
 *         description: Submission updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Submission'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized to update this submission
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.route('/:id')
  .put(protect, updateSubmission);

/**
 * @swagger
 * /api/submissions/{id}:
 *   delete:
 *     summary: Delete a submission
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Submission ID
 *     responses:
 *       200:
 *         description: Submission deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Submission deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized to delete this submission
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.route('/:id')
  .delete(protect, deleteSubmission);

/**
 * @swagger
 * /api/submissions/{id}/verify:
 *   put:
 *     summary: Verify or reject a submission
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Submission ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [verified, rejected]
 *                 example: verified
 *               verificationNotes:
 *                 type: string
 *                 example: Source verified and accurate
 *     responses:
 *       200:
 *         description: Submission verified/rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Submission'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/:id/verify', protect, authorize('verifier', 'admin'), verificationValidation, validate, verifySubmission);

export default router;
