const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { User, Submission, CountryStats } = require('../models');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// ============================================================================
// SYSTEM MONITORING & MAINTENANCE
// ============================================================================

// GET /api/admin/system/health - System health check
router.get('/system/health', async (req, res) => {
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
});

// GET /api/admin/system/logs - System activity logs
router.get('/system/logs', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('level').optional().isIn(['info', 'warning', 'error']),
  query('category').optional().isIn(['auth', 'submission', 'user', 'system']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], async (req, res) => {
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
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// POST /api/admin/system/maintenance - Trigger maintenance tasks
router.post('/system/maintenance', [
  body('tasks').isArray().withMessage('Tasks must be an array'),
  body('tasks.*').isIn(['refresh_stats', 'cleanup_inactive', 'reindex_search', 'validate_data'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

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
    res.status(500).json({ error: 'Failed to run maintenance tasks' });
  }
});

// ============================================================================
// REPORTS GENERATION
// ============================================================================

// GET /api/admin/reports/overview - Generate platform overview report
router.get('/reports/overview', [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('country').optional().isLength({ min: 2, max: 2 })
], async (req, res) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
    const country = req.query.country;

    // Build filters
    const submissionFilter = {
      submittedDate: { $gte: startDate, $lte: endDate }
    };
    const userFilter = {
      joinDate: { $gte: startDate, $lte: endDate }
    };

    if (country) {
      submissionFilter.country = country;
      userFilter.country = country;
    }

    // Generate report data
    const report = {
      period: { startDate, endDate, country },
      generated: new Date(),
      summary: {
        totalSubmissions: await Submission.countDocuments(submissionFilter),
        verifiedSubmissions: await Submission.countDocuments({ ...submissionFilter, status: 'verified' }),
        rejectedSubmissions: await Submission.countDocuments({ ...submissionFilter, status: 'rejected' }),
        pendingSubmissions: await Submission.countDocuments({ ...submissionFilter, status: 'pending' }),
        newUsers: await User.countDocuments(userFilter),
        activeCountries: await Submission.distinct('country', submissionFilter).then(arr => arr.length)
      }
    };

    // Submissions by category
    report.submissionsByCategory = await Submission.aggregate([
      { $match: submissionFilter },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    // Top contributing countries
    report.topCountries = await Submission.aggregate([
      { $match: submissionFilter },
      { $group: { _id: '$country', submissions: { $sum: 1 }, verified: { $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] } } } },
      { $sort: { submissions: -1 } },
      { $limit: 10 }
    ]);

    // Top contributors
    report.topContributors = await Submission.aggregate([
      { $match: submissionFilter },
      {
        $group: {
          _id: '$submitterId',
          submissions: { $sum: 1 },
          verified: { $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] } }
        }
      },
      { $sort: { submissions: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $project: {
          username: { $arrayElemAt: ['$user.username', 0] },
          country: { $arrayElemAt: ['$user.country', 0] },
          submissions: 1,
          verified: 1
        }
      }
    ]);

    // Verification speed analysis
    report.verificationSpeed = await Submission.aggregate([
      {
        $match: {
          ...submissionFilter,
          status: { $in: ['verified', 'rejected'] },
          verifiedDate: { $exists: true }
        }
      },
      {
        $project: {
          daysToVerify: {
            $divide: [
              { $subtract: ['$verifiedDate', '$submittedDate'] },
              1000 * 60 * 60 * 24
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgDays: { $avg: '$daysToVerify' },
          minDays: { $min: '$daysToVerify' },
          maxDays: { $max: '$daysToVerify' },
          totalReviewed: { $sum: 1 }
        }
      }
    ]);

    res.json(report);
  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// GET /api/admin/reports/country/:code - Generate country-specific report
router.get('/reports/country/:code', [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], async (req, res) => {
  try {
    const countryCode = req.params.code.toUpperCase();
    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();

    // Get country stats
    const countryStats = await CountryStats.findOne({ countryCode });
    if (!countryStats) {
      return res.status(404).json({ error: 'Country not found' });
    }

    // Build filter
    const filter = {
      country: countryCode,
      submittedDate: { $gte: startDate, $lte: endDate }
    };

    const report = {
      country: { code: countryCode, name: countryStats.countryName },
      period: { startDate, endDate },
      generated: new Date(),
      statistics: countryStats.statistics,
      verifiers: countryStats.verifiers.length,
      activeVerifiers: countryStats.verifiers.filter(v => v.isActive).length
    };

    // Submissions timeline
    report.submissionsTimeline = await Submission.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$submittedDate' } },
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Category breakdown
    report.categoryBreakdown = await Submission.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$category',
          total: { $sum: 1 },
          verified: { $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] } },
          credible: { $sum: { $cond: [{ $eq: ['$reliability', 'credible'] }, 1, 0] } }
        }
      }
    ]);

    // Top publishers
    report.topPublishers = await Submission.aggregate([
      { $match: { ...filter, status: 'verified' } },
      { $group: { _id: '$publisher', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json(report);
  } catch (error) {
    console.error('Country report error:', error);
    res.status(500).json({ error: 'Failed to generate country report' });
  }
});

// POST /api/admin/reports/export - Export data to CSV/JSON
router.post('/reports/export', [
  body('type').isIn(['submissions', 'users', 'countries']).withMessage('Invalid export type'),
  body('format').isIn(['json', 'csv']).withMessage('Invalid format'),
  body('filters').optional().isObject().withMessage('Filters must be object'),
  body('fields').optional().isArray().withMessage('Fields must be array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { type, format, filters = {}, fields } = req.body;

    let data = [];
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    switch (type) {
      case 'submissions':
        data = await Submission.find(filters)
          .populate('submitterId', 'username email country')
          .populate('verifierId', 'username email country')
          .lean();
        break;

      case 'users':
        data = await User.find(filters)
          .select('-password')
          .lean();
        break;

      case 'countries':
        data = await CountryStats.find(filters).lean();
        break;
    }

    // Filter fields if specified
    if (fields && fields.length > 0) {
      data = data.map(item => {
        const filtered = {};
        fields.forEach(field => {
          if (item[field] !== undefined) filtered[field] = item[field];
        });
        return filtered;
      });
    }

    const filename = `${type}_export_${timestamp}.${format}`;

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.json(data);
    } else {
      // For CSV, you'd typically use a library like csv-writer
      // This is a simplified response
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(501).json({ error: 'CSV export not implemented yet' });
    }
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

module.exports = router;