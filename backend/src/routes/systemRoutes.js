import express from 'express';
import SystemController from '../controllers/systemController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All system routes require admin access
router.use(protect);
router.use(authorize('admin'));

/**
 * @swagger
 * /api/system/health:
 *   get:
 *     summary: Get system health status (Admin only)
 *     tags: [System]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: System health information
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
 *                     status:
 *                       type: string
 *                       example: healthy
 *                     database:
 *                       type: string
 *                       example: connected
 *                     uptime:
 *                       type: number
 *                     memory:
 *                       type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/health', SystemController.getSystemHealth);

/**
 * @swagger
 * /api/system/logs:
 *   get:
 *     summary: Get system logs (Admin only)
 *     tags: [System]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [info, warning, error]
 *         description: Filter by log level
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Number of logs to return
 *     responses:
 *       200:
 *         description: System logs
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
 *                     type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/logs', SystemController.getSystemLogs);

/**
 * @swagger
 * /api/system/stats:
 *   get:
 *     summary: Get system statistics (Admin only)
 *     tags: [System]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: System statistics
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
 *                     totalUsers:
 *                       type: number
 *                     totalSubmissions:
 *                       type: number
 *                     databaseSize:
 *                       type: number
 *                     serverUptime:
 *                       type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/stats', SystemController.getSystemStats);

/**
 * @swagger
 * /api/system/maintenance:
 *   post:
 *     summary: Run database maintenance (Admin only)
 *     tags: [System]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               optimize:
 *                 type: boolean
 *                 example: true
 *               cleanup:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Maintenance completed successfully
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
 *                   example: Database maintenance completed
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/maintenance', SystemController.maintainDatabase);

/**
 * @swagger
 * /api/system/backup:
 *   post:
 *     summary: Create database backup (Admin only)
 *     tags: [System]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Backup created successfully
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
 *                   example: Backup created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     backupId:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/backup', SystemController.backupDatabase);

export default router;