const { User, Submission, CountryStats } = require('../models');
const { validationResult } = require('express-validator');

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
        submittedDate: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
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
        lastLogin: { $gt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
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
        filter.submittedDate = dateFilter;
      }

      const recentActivities = await Submission.find(filter)
        .populate('submitterId', 'username email country')
        .populate('verifierId', 'username email country')
        .select('title status submittedDate verifiedDate reviewHistory country')
        .sort({ submittedDate: -1 })
        .skip(skip)
        .limit(limit);

      // Transform to log format
      const logs = recentActivities.map(submission => ({
        timestamp: submission.submittedDate,
        level: 'info',
        category: 'submission',
        action: 'created',
        message: `Submission created: "${submission.title}" by ${submission.submitterId?.username}`,
        details: {
          submissionId: submission._id,
          country: submission.country,
          status: submission.status
        }
      }));

      res.json({
        logs,
        pagination: { current: page, limit, total: logs.length }
      });
    } catch (error) {
      console.error('Logs fetch error:', error);
      res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'Failed to fetch logs' 
      });
    }
  }

  static async runMaintenance(req, res) {
    try {
      const { tasks } = req.body;
      const results = {};

      for (const task of tasks) {
        try {
          switch (task) {
            case 'refresh_stats':
              // Refresh all country statistics
              const countries = await CountryStats.find();
              for (const country of countries) {
                await country.updateStats();
              }
              results[task] = { success: true, message: `Updated ${countries.length} countries` };
              break;

            case 'cleanup_inactive':
              // Deactivate users who haven't logged in for 6 months
              const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);
              const inactiveUsers = await User.updateMany(
                {
                  lastLogin: { $lt: sixMonthsAgo },
                  isActive: true,
                  role: { $ne: 'admin' }
                },
                { isActive: false }
              );
              results[task] = { success: true, message: `Deactivated ${inactiveUsers.modifiedCount} inactive users` };
              break;

            case 'validate_data':
              // Check for data inconsistencies
              const issues = [];
              
              // Check for submissions without valid submitters
              const orphanedSubmissions = await Submission.countDocuments({
                submitterId: { $exists: false }
              });
              if (orphanedSubmissions > 0) {
                issues.push(`${orphanedSubmissions} submissions without valid submitters`);
              }

              // Check for verifiers in countries that don't exist
              const allCountries = await CountryStats.distinct('countryCode');
              const usersInInvalidCountries = await User.countDocuments({
                country: { $nin: allCountries },
                role: 'country_verifier'
              });
              if (usersInInvalidCountries > 0) {
                issues.push(`${usersInInvalidCountries} verifiers in invalid countries`);
              }

              results[task] = { 
                success: true, 
                message: issues.length === 0 ? 'No data issues found' : 'Issues detected',
                issues 
              };
              break;

            default:
              results[task] = { success: false, message: 'Task not implemented' };
          }
        } catch (taskError) {
          results[task] = { success: false, message: taskError.message };
        }
      }

      res.json({ message: 'Maintenance tasks completed', results });
    } catch (error) {
      console.error('Maintenance error:', error);
      res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'Failed to run maintenance tasks' 
      });
    }
  }
}

module.exports = SystemController;