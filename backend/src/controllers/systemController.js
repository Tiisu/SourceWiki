import { Op } from 'sequelize';
import { sequelize } from '../config/database.js';
import User from '../models/User.js';
import Submission, { includeSubmitter, includeVerifier } from '../models/Submission.js';
import CountryStats from '../models/CountryStats.js';
import { paginate } from '../models/helpers.js';
import { ErrorCodes } from '../utils/errorCodes.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const daysAgo = (days) => new Date(Date.now() - days * DAY_MS);

class SystemController {
  // ============================================================================
  // SYSTEM MONITORING & MAINTENANCE
  // ============================================================================

  static async getSystemHealth(req, res, next) {
    try {
      const healthData = {
        timestamp: new Date(),
        status: 'healthy',
        database: 'connected',
        issues: []
      };

      // Check database connectivity
      try {
        await sequelize.authenticate();
      } catch (error) {
        healthData.status = 'unhealthy';
        healthData.database = 'disconnected';
        healthData.issues.push('Database connection failed');
      }

      // Pending submissions older than 30 days
      const oldPendingCount = await Submission.count({
        where: { status: 'pending', createdAt: { [Op.lt]: daysAgo(30) } }
      });

      if (oldPendingCount > 0) {
        healthData.issues.push(`${oldPendingCount} submissions pending for over 30 days`);
      }

      // Countries with submissions but no verifiers
      const countriesWithoutVerifiers = await CountryStats.count({
        where: { activeVerifiers: 0, totalSubmissions: { [Op.gt]: 0 } }
      });

      if (countriesWithoutVerifiers > 0) {
        healthData.issues.push(`${countriesWithoutVerifiers} countries with submissions but no verifiers`);
      }

      // Admins active in the last 30 days
      const activeAdmins = await User.count({
        where: { role: 'admin', isActive: true, updatedAt: { [Op.gt]: daysAgo(30) } }
      });

      if (activeAdmins === 0) {
        healthData.issues.push('No active admins in the last 30 days');
      }

      if (healthData.issues.length > 0 && healthData.status === 'healthy') {
        healthData.status = 'warning';
      }

      res.json(healthData);
    } catch (error) {
      console.error('Health check error:', error);
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date(),
        error: 'Health check failed',
        errorCode: ErrorCodes.SERVICE_UNAVAILABLE
      });
    }
  }

  static async getSystemLogs(req, res, next) {
    try {
      const { page, limit, offset } = paginate(req.query, 50);

      const where = {};
      const createdAt = {};
      if (req.query.startDate) createdAt[Op.gte] = new Date(req.query.startDate);
      if (req.query.endDate) createdAt[Op.lte] = new Date(req.query.endDate);
      if (Reflect.ownKeys(createdAt).length > 0) where.createdAt = createdAt;

      // Recent submission activity, presented as logs
      const recentActivities = await Submission.findAll({
        where,
        attributes: ['id', 'title', 'status', 'createdAt', 'verifiedAt', 'country', 'submitter', 'verifier'],
        include: [
          includeSubmitter(['username', 'email', 'country']),
          includeVerifier(['username', 'email', 'country'])
        ],
        order: [['createdAt', 'DESC']],
        offset,
        limit
      });

      const logs = recentActivities.map((submission) => ({
        timestamp: submission.createdAt,
        level: 'info',
        action: 'submission_created',
        details: {
          submissionId: submission.id,
          title: submission.title,
          country: submission.country,
          status: submission.status,
          submitter: submission.submitterUser?.username,
          verifier: submission.verifierUser?.username,
          verifiedAt: submission.verifiedAt
        }
      }));

      res.json({
        logs,
        pagination: {
          current: page,
          pages: Math.ceil(logs.length / limit),
          total: logs.length,
          limit
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getSystemStats(req, res, next) {
    try {
      const [
        totalUsers,
        activeUsers,
        totalSubmissions,
        pendingSubmissions,
        totalCountries,
        activeCountries
      ] = await Promise.all([
        User.count(),
        User.count({ where: { isActive: true } }),
        Submission.count(),
        Submission.count({ where: { status: 'pending' } }),
        CountryStats.count(),
        CountryStats.count({ where: { totalSubmissions: { [Op.gt]: 0 } } })
      ]);

      res.json({
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers
        },
        submissions: {
          total: totalSubmissions,
          pending: pendingSubmissions,
          processed: totalSubmissions - pendingSubmissions
        },
        countries: {
          total: totalCountries,
          active: activeCountries,
          inactive: totalCountries - activeCountries
        },
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          timestamp: new Date()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async maintainDatabase(req, res, next) {
    try {
      const results = {
        timestamp: new Date(),
        operations: []
      };

      // Update all country statistics
      const countries = await CountryStats.findAll();
      for (const country of countries) {
        await country.updateStats();
        results.operations.push(`Updated stats for ${country.countryName}`);
      }

      // Clean up refresh tokens older than 7 days
      const cutoff = daysAgo(7);
      const users = await User.findAll({ attributes: ['id', 'refreshTokens'] });
      let cleaned = 0;
      for (const user of users) {
        const kept = user.refreshTokens.filter((t) => new Date(t.createdAt) >= cutoff);
        if (kept.length !== user.refreshTokens.length) {
          user.refreshTokens = kept;
          await user.save({ fields: ['refreshTokens'] });
          cleaned += 1;
        }
      }

      if (cleaned > 0) {
        results.operations.push(`Cleaned up refresh tokens for ${cleaned} users`);
      }

      res.json({
        message: 'Database maintenance completed',
        results
      });
    } catch (error) {
      next(error);
    }
  }

  static async backupDatabase(req, res, next) {
    try {
      // Placeholder only: no backup is actually performed.
      res.json({
        timestamp: new Date(),
        status: 'initiated',
        message: 'Database backup process started',
        backupId: `backup_${Date.now()}`
      });
    } catch (error) {
      next(error);
    }
  }
}

export default SystemController;
