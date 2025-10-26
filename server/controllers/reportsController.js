const { User, Submission, CountryStats } = require('../models');
const { validationResult } = require('express-validator');

class ReportsController {
  // ============================================================================
  // REPORTS GENERATION
  // ============================================================================

  static async getOverviewReport(req, res) {
    try {
      const startDate = req.query.startDate ? 
        new Date(req.query.startDate) : 
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
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

      // Generate report data in parallel
      const [
        totalSubmissions,
        verifiedSubmissions,
        rejectedSubmissions,
        pendingSubmissions,
        newUsers,
        activeCountriesCount,
        submissionsByCategory,
        topCountries,
        topContributors,
        verificationSpeed
      ] = await Promise.all([
        Submission.countDocuments(submissionFilter),
        Submission.countDocuments({ ...submissionFilter, status: 'verified' }),
        Submission.countDocuments({ ...submissionFilter, status: 'rejected' }),
        Submission.countDocuments({ ...submissionFilter, status: 'pending' }),
        User.countDocuments(userFilter),
        Submission.distinct('country', submissionFilter).then(arr => arr.length),
        
        // Submissions by category
        Submission.aggregate([
          { $match: submissionFilter },
          { $group: { _id: '$category', count: { $sum: 1 } } }
        ]),
        
        // Top contributing countries
        Submission.aggregate([
          { $match: submissionFilter },
          { 
            $group: { 
              _id: '$country', 
              submissions: { $sum: 1 }, 
              verified: { $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] } } 
            } 
          },
          { $sort: { submissions: -1 } },
          { $limit: 10 }
        ]),
        
        // Top contributors
        Submission.aggregate([
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
        ]),
        
        // Verification speed analysis
        Submission.aggregate([
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
        ])
      ]);

      const report = {
        period: { startDate, endDate, country },
        generated: new Date(),
        summary: {
          totalSubmissions,
          verifiedSubmissions,
          rejectedSubmissions,
          pendingSubmissions,
          newUsers,
          activeCountries: activeCountriesCount
        },
        submissionsByCategory,
        topCountries,
        topContributors,
        verificationSpeed
      };

      res.json(report);
    } catch (error) {
      console.error('Report generation error:', error);
      res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'Failed to generate report' 
      });
    }
  }

  static async getCountryReport(req, res) {
    try {
      const countryCode = req.params.code.toUpperCase();
      const startDate = req.query.startDate ? 
        new Date(req.query.startDate) : 
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();

      // Get country stats
      const countryStats = await CountryStats.findOne({ countryCode });
      if (!countryStats) {
        return res.status(404).json({ 
          error: 'Not Found',
          message: 'Country not found' 
        });
      }

      // Build filter
      const filter = {
        country: countryCode,
        submittedDate: { $gte: startDate, $lte: endDate }
      };

      const [submissionsTimeline, categoryBreakdown, topPublishers] = await Promise.all([
        // Submissions timeline
        Submission.aggregate([
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
        ]),
        
        // Category breakdown
        Submission.aggregate([
          { $match: filter },
          {
            $group: {
              _id: '$category',
              total: { $sum: 1 },
              verified: { $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] } },
              credible: { $sum: { $cond: [{ $eq: ['$reliability', 'credible'] }, 1, 0] } }
            }
          }
        ]),
        
        // Top publishers
        Submission.aggregate([
          { $match: { ...filter, status: 'verified' } },
          { $group: { _id: '$publisher', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ])
      ]);

      const report = {
        country: { code: countryCode, name: countryStats.countryName },
        period: { startDate, endDate },
        generated: new Date(),
        statistics: countryStats.statistics,
        verifiers: countryStats.verifiers.length,
        activeVerifiers: countryStats.verifiers.filter(v => v.isActive).length,
        submissionsTimeline,
        categoryBreakdown,
        topPublishers
      };

      res.json(report);
    } catch (error) {
      console.error('Country report error:', error);
      res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'Failed to generate country report' 
      });
    }
  }

  static async exportData(req, res) {
    try {
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

        default:
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Invalid export type'
          });
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
      } else if (format === 'csv') {
        // For production, implement CSV conversion
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.status(501).json({ 
          error: 'Not Implemented',
          message: 'CSV export not implemented yet' 
        });
      } else {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid format. Use json or csv'
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'Failed to export data' 
      });
    }
  }
}

module.exports = ReportsController;