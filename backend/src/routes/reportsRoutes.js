import express from 'express';
import ReportsController from '../controllers/reportsController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All reports routes require admin or verifier access
router.use(protect);
router.use(authorize('admin', 'verifier'));

/**
 * @swagger
 * /api/reports/overview:
 *   get:
 *     summary: Get overview report (Admin/Verifier only)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for report
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for report
 *     responses:
 *       200:
 *         description: Overview report data
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
 *                     totalSubmissions:
 *                       type: number
 *                     verifiedSubmissions:
 *                       type: number
 *                     pendingSubmissions:
 *                       type: number
 *                     topContributors:
 *                       type: array
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/overview', ReportsController.getOverviewReport);

/**
 * @swagger
 * /api/reports/country/{country}:
 *   get:
 *     summary: Get country-specific report (Admin/Verifier only)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: country
 *         required: true
 *         schema:
 *           type: string
 *         description: Country code
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Country report data
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
 *                     country:
 *                       type: string
 *                     submissions:
 *                       type: object
 *                     contributors:
 *                       type: array
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/country/:country', ReportsController.getCountryReport);

/**
 * @swagger
 * /api/reports/user/{userId}:
 *   get:
 *     summary: Get user-specific report (Admin/Verifier only)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: User report data
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
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     submissions:
 *                       type: object
 *                     contributions:
 *                       type: array
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/user/:userId', ReportsController.getUserReport);

export default router;