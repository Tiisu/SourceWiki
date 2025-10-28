import User from '../models/User.js';
import Submission from '../models/Submission.js';
import CountryStats from '../models/CountryStats.js';

class SystemController {
  // ============================================================================
  // SYSTEM MONITORING & MAINTENANCE
  // ============================================================================

  static async getSystemHealth(req, res) {
    try {
      const healthData = {
        timestamp: new Date(),
        status: 'healthy',
        database: 'connected',
        issues: []
      };

      // Check database connectivity
      try {
        await User.findOne().limit(1);
      } catch (error) {
        healthData.status = 'unhealthy';
        healthData.database = 'disconnected';
        healthData.issues.push('Database connection failed');
      }

      // Check for pending submissions older than 30 days
      const oldPendingCount = await Submission.countDocuments({
        status: 'pending',
        createdAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      });

      if (oldPendingCount > 0) {
        healthData.issues.push(`${oldPendingCount} submissions pending for over 30 days`);
      }

      // Check for countries without verifiers
      const countriesWithoutVerifiers = await CountryStats.countDocuments({
        'statistics.activeVerifiers': 0,
        'statistics.totalSubmissions': { $gt: 0 }
      });

      if (countriesWithoutVerifiers > 0) {
        healthData.issues.push(`${countriesWithoutVerifiers} countries with submissions but no verifiers`);
      }

      // Check for inactive admins
      const activeAdmins = await User.countDocuments({
        role: 'admin',
        isActive: true,
        updatedAt: { $gt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      });

      if (activeAdmins === 0) {
        healthData.issues.push('No active admins in the last 30 days');
      }

      if (healthData.issues.length > 0) {
        healthData.status = 'warning';
      }

      res.json(healthData);
    } catch (error) {
      console.error('Health check error:', error);
      res.status(500).json({
        status: 'unhealthy',
        timestamp: new Date(),
        error: 'Health check failed'
      });
    }
  }

  static async getSystemLogs(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const skip = (page - 1) * limit;

      // Build date filter
      const dateFilter = {};
      if (req.query.startDate) dateFilter.$gte = new Date(req.query.startDate);
      if (req.query.endDate) dateFilter.$lte = new Date(req.query.endDate);

      // Get recent activities from submissions (as example logs)
      const filter = {};
      if (Object.keys(dateFilter).length > 0) {
        filter.createdAt = dateFilter;
      }

      const recentActivities = await Submission.find(filter)
        .populate('submitter', 'username email country')
        .populate('verifier', 'username email country')
        .select('title status createdAt verifiedAt country')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      // Transform to log format
      const logs = recentActivities.map(submission => ({
        timestamp: submission.createdAt,
        level: 'info',
        action: 'submission_created',
        details: {
          submissionId: submission._id,
          title: submission.title,
          country: submission.country,
          status: submission.status,
          submitter: submission.submitter?.username,
          verifier: submission.verifier?.username,
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
      console.error('System logs fetch error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch system logs'
      });
    }
  }

  static async getSystemStats(req, res) {
    try {
      const [
        totalUsers,
        activeUsers,
        totalSubmissions,
        pendingSubmissions,
        totalCountries,
        activeCountries
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ isActive: true }),
        Submission.countDocuments(),
        Submission.countDocuments({ status: 'pending' }),
        CountryStats.countDocuments(),
        CountryStats.countDocuments({ 'statistics.totalSubmissions': { $gt: 0 } })
      ]);

      const stats = {
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
      };

      res.json(stats);
    } catch (error) {
      console.error('System stats fetch error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch system statistics'
      });
    }
  }

  static async maintainDatabase(req, res) {
    try {
      const results = {
        timestamp: new Date(),
        operations: []
      };

      // Update all country statistics
      const countries = await CountryStats.find();
      for (const country of countries) {
        await country.updateStats();
        results.operations.push(`Updated stats for ${country.countryName}`);
      }

      // Clean up old refresh tokens
      const tokenCleanup = await User.updateMany(
        {},
        {
          $pull: {
            refreshTokens: {
              createdAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            }
          }
        }
      );

      if (tokenCleanup.modifiedCount > 0) {
        results.operations.push(`Cleaned up refresh tokens for ${tokenCleanup.modifiedCount} users`);
      }

      res.json({
        message: 'Database maintenance completed',
        results
      });
    } catch (error) {
      console.error('Database maintenance error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to perform database maintenance'
      });
    }
  }

  static async backupDatabase(req, res) {
    try {
      // This would typically trigger a backup process
      // For now, we'll just return a mock response
      const backupInfo = {
        timestamp: new Date(),
        status: 'initiated',
        message: 'Database backup process started',
        backupId: `backup_${Date.now()}`
      };

      res.json(backupInfo);
    } catch (error) {
      console.error('Database backup error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to initiate database backup'
      });
    }
  }
}

export default SystemController;