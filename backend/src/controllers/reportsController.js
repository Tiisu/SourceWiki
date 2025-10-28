import User from '../models/User.js';
import Submission from '../models/Submission.js';
import CountryStats from '../models/CountryStats.js';

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
        createdAt: { $gte: startDate, $lte: endDate }
      };
      const userFilter = {
        createdAt: { $gte: startDate, $lte: endDate }
      };

      if (country) {
        submissionFilter.country = country;
        userFilter.country = country;
      }

      // Generate report data in parallel
      const [
        totalSubmissions,
        approvedSubmissions,
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
        Submission.countDocuments({ ...submissionFilter, status: 'approved' }),
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
              approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } } 
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
              _id: '$submitter',
              submissions: { $sum: 1 },
              approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } }
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
              approved: 1
            }
          }
        ]),
        
        // Verification speed analysis
        Submission.aggregate([
          {
            $match: {
              ...submissionFilter,
              status: { $in: ['approved', 'rejected'] },
              verifiedAt: { $exists: true }
            }
          },
          {
            $project: {
              country: 1,
              status: 1,
              daysToVerify: {
                $divide: [
                  { $subtract: ['$verifiedAt', '$createdAt'] },
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
              totalProcessed: { $sum: 1 }
            }
          }
        ])
      ]);

      const report = {
        period: {
          startDate,
          endDate,
          country: country || 'all'
        },
        summary: {
          totalSubmissions,
          approvedSubmissions,
          rejectedSubmissions,
          pendingSubmissions,
          newUsers,
          activeCountries: activeCountriesCount,
          approvalRate: totalSubmissions ? Math.round((approvedSubmissions / totalSubmissions) * 100) : 0
        },
        breakdown: {
          byCategory: submissionsByCategory,
          byCountry: topCountries,
          topContributors,
          verificationSpeed: verificationSpeed[0] || {
            avgDays: 0,
            minDays: 0,
            maxDays: 0,
            totalProcessed: 0
          }
        },
        generated: new Date()
      };

      res.json(report);
    } catch (error) {
      console.error('Overview report error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to generate overview report'
      });
    }
  }

  static async getCountryReport(req, res) {
    try {
      const countryCode = req.params.country?.toUpperCase();
      const startDate = req.query.startDate ? 
        new Date(req.query.startDate) : 
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();

      if (!countryCode) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Country code is required'
        });
      }

      const filter = {
        country: countryCode,
        createdAt: { $gte: startDate, $lte: endDate }
      };

      const [
        countryStats,
        totalSubmissions,
        approvedSubmissions,
        rejectedSubmissions,
        pendingSubmissions,
        contributors,
        verifiers,
        categoryBreakdown,
        timelineData
      ] = await Promise.all([
        CountryStats.findOne({ countryCode }),
        
        Submission.countDocuments(filter),
        Submission.countDocuments({ ...filter, status: 'approved' }),
        Submission.countDocuments({ ...filter, status: 'rejected' }),
        Submission.countDocuments({ ...filter, status: 'pending' }),
        
        // Active contributors
        User.countDocuments({
          country: countryCode,
          role: 'contributor',
          isActive: true
        }),
        
        // Active verifiers
        User.countDocuments({
          country: countryCode,
          role: 'verifier',
          isActive: true
        }),
        
        // Category breakdown
        Submission.aggregate([
          { $match: filter },
          { $group: { _id: '$category', count: { $sum: 1 } } }
        ]),
        
        // Timeline data (submissions per day)
        Submission.aggregate([
          { $match: filter },
          {
            $group: {
              _id: {
                date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
              },
              count: { $sum: 1 }
            }
          },
          { $sort: { '_id.date': 1 } }
        ])
      ]);

      if (!countryStats) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Country statistics not found'
        });
      }

      const report = {
        country: {
          code: countryCode,
          name: countryStats.countryName
        },
        period: {
          startDate,
          endDate
        },
        summary: {
          totalSubmissions,
          approvedSubmissions,
          rejectedSubmissions,
          pendingSubmissions,
          contributors,
          verifiers,
          approvalRate: totalSubmissions ? Math.round((approvedSubmissions / totalSubmissions) * 100) : 0
        },
        breakdown: {
          byCategory: categoryBreakdown,
          timeline: timelineData
        },
        currentStats: countryStats.statistics,
        generated: new Date()
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

  static async getUserReport(req, res) {
    try {
      const userId = req.params.userId;
      const startDate = req.query.startDate ? 
        new Date(req.query.startDate) : 
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();

      const user = await User.findById(userId).select('-password');
      if (!user) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'User not found'
        });
      }

      const filter = {
        submitter: userId,
        createdAt: { $gte: startDate, $lte: endDate }
      };

      const [
        totalSubmissions,
        approvedSubmissions,
        rejectedSubmissions,
        pendingSubmissions,
        categoryBreakdown,
        timelineData
      ] = await Promise.all([
        Submission.countDocuments(filter),
        Submission.countDocuments({ ...filter, status: 'approved' }),
        Submission.countDocuments({ ...filter, status: 'rejected' }),
        Submission.countDocuments({ ...filter, status: 'pending' }),
        
        // Category breakdown
        Submission.aggregate([
          { $match: filter },
          { $group: { _id: '$category', count: { $sum: 1 } } }
        ]),
        
        // Timeline data
        Submission.aggregate([
          { $match: filter },
          {
            $group: {
              _id: {
                date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
              },
              count: { $sum: 1 }
            }
          },
          { $sort: { '_id.date': 1 } }
        ])
      ]);

      const report = {
        user: {
          id: user._id,
          username: user.username,
          country: user.country,
          role: user.role,
          joinDate: user.createdAt,
          points: user.points,
          badges: user.badges
        },
        period: {
          startDate,
          endDate
        },
        summary: {
          totalSubmissions,
          approvedSubmissions,
          rejectedSubmissions,
          pendingSubmissions,
          approvalRate: totalSubmissions ? Math.round((approvedSubmissions / totalSubmissions) * 100) : 0
        },
        breakdown: {
          byCategory: categoryBreakdown,
          timeline: timelineData
        },
        generated: new Date()
      };

      res.json(report);
    } catch (error) {
      console.error('User report error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to generate user report'
      });
    }
  }
}

export default ReportsController;