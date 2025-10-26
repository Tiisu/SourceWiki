const { User, Submission, CountryStats } = require('../models');

class AdminController {
  // ============================================================================
  // DASHBOARD & ANALYTICS
  // ============================================================================

  static async getDashboard(req, res) {
    try {
      // Global statistics
      const [
        totalUsers,
        totalSubmissions,
        usersByRole,
        submissionsByStatus,
        submissionsByCountry,
        recentSubmissions,
        topCountries
      ] = await Promise.all([
        User.countDocuments(),
        Submission.countDocuments(),
        User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
        Submission.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
        Submission.aggregate([
          { $group: { _id: '$country', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ]),
        Submission.find()
          .populate('submitterId', 'username country')
          .populate('verifierId', 'username country')
          .sort({ submittedDate: -1 })
          .limit(50),
        CountryStats.find()
          .sort({ 'statistics.verifiedSources': -1 })
          .limit(10)
      ]);

      const dashboard = {
        globalStats: {
          totalUsers,
          totalSubmissions,
          usersByRole: usersByRole.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
          submissionsByStatus: submissionsByStatus.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
        },
        charts: {
          submissionsByCountry,
          topCountries: topCountries.map(country => ({
            country: country.countryName,
            code: country.countryCode,
            verified: country.statistics.verifiedSources,
            total: country.statistics.totalSubmissions
          }))
        },
        recentActivity: recentSubmissions
      };

      res.json(dashboard);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'Failed to fetch dashboard data' 
      });
    }
  }

  static async getAnalytics(req, res) {
    try {
      const period = req.query.period || '30d';
      const country = req.query.country;
      
      // Calculate date range
      const days = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }[period];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      // Build match filters
      const matchFilter = { submittedDate: { $gte: startDate } };
      if (country) matchFilter.country = country;
      
      const [submissionTrends, verificationSpeed] = await Promise.all([
        // Time series data for submissions
        Submission.aggregate([
          { $match: matchFilter },
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
        
        // Verification speed analytics
        Submission.aggregate([
          {
            $match: {
              ...matchFilter,
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
              },
              country: 1,
              status: 1
            }
          },
          {
            $group: {
              _id: '$country',
              avgDays: { $avg: '$daysToVerify' },
              minDays: { $min: '$daysToVerify' },
              maxDays: { $max: '$daysToVerify' },
              totalReviewed: { $sum: 1 }
            }
          }
        ])
      ]);
      
      res.json({
        period,
        country,
        trends: submissionTrends,
        verificationSpeed,
        generated: new Date()
      });
    } catch (error) {
      console.error('Analytics fetch error:', error);
      res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'Failed to fetch analytics' 
      });
    }
  }

  // ============================================================================
  // USER MANAGEMENT
  // ============================================================================

  static async getUsers(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;
      
      // Build filter
      const filter = {};
      if (req.query.role) filter.role = req.query.role;
      if (req.query.country) filter.country = req.query.country;
      if (req.query.status) filter.isActive = req.query.status === 'active';
      if (req.query.search) {
        filter.$or = [
          { username: { $regex: req.query.search, $options: 'i' } },
          { email: { $regex: req.query.search, $options: 'i' } }
        ];
      }
      
      const [users, total] = await Promise.all([
        User.find(filter)
          .select('-password')
          .sort({ joinDate: -1 })
          .skip(skip)
          .limit(limit),
        User.countDocuments(filter)
      ]);
      
      // Get submission stats for each user
      const userIds = users.map(user => user._id);
      const submissionStats = await Submission.aggregate([
        { $match: { submitterId: { $in: userIds } } },
        {
          $group: {
            _id: '$submitterId',
            total: { $sum: 1 },
            verified: { $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] } },
            pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
            rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } }
          }
        }
      ]);
      
      // Merge stats with users
      const usersWithStats = users.map(user => {
        const stats = submissionStats.find(stat => stat._id.toString() === user._id.toString());
        return {
          ...user.toObject(),
          submissionStats: stats || { total: 0, verified: 0, pending: 0, rejected: 0 }
        };
      });
      
      res.json({
        users: usersWithStats,
        pagination: { 
          current: page, 
          pages: Math.ceil(total / limit), 
          total, 
          limit 
        }
      });
    } catch (error) {
      console.error('Users fetch error:', error);
      res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'Failed to fetch users' 
      });
    }
  }

  static async updateUser(req, res) {
    try {
      const userId = req.params.id;
      
      // Prevent self-modification
      if (userId === req.user._id.toString()) {
        return res.status(400).json({ 
          error: 'Bad Request',
          message: 'Cannot modify your own account' 
        });
      }
      
      // Build updates object
      const updates = {};
      if (req.body.role !== undefined) updates.role = req.body.role;
      if (req.body.isActive !== undefined) updates.isActive = req.body.isActive;
      if (req.body.country !== undefined) updates.country = req.body.country;
      if (req.body.points !== undefined) updates.points = req.body.points;
      if (req.body.badges !== undefined) updates.badges = req.body.badges;
      
      const user = await User.findByIdAndUpdate(
        userId, 
        updates, 
        { new: true, runValidators: true }
      ).select('-password');
      
      if (!user) {
        return res.status(404).json({ 
          error: 'Not Found',
          message: 'User not found' 
        });
      }
      
      // If role changed to country_verifier, update CountryStats
      if (updates.role === 'country_verifier') {
        const countryStats = await CountryStats.getOrCreate(user.country, '');
        if (!countryStats.verifiers.find(v => v.userId.toString() === userId)) {
          countryStats.verifiers.push({ userId: user._id });
          await countryStats.save();
        }
      }
      
      res.json({ 
        message: 'User updated successfully', 
        user 
      });
    } catch (error) {
      console.error('User update error:', error);
      res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'Failed to update user' 
      });
    }
  }

  static async deleteUser(req, res) {
    try {
      const userId = req.params.id;
      
      if (userId === req.user._id.toString()) {
        return res.status(400).json({ 
          error: 'Bad Request',
          message: 'Cannot delete your own account' 
        });
      }
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ 
          error: 'Not Found',
          message: 'User not found' 
        });
      }

      // Soft delete
      const deletedUser = await User.findByIdAndUpdate(
        userId,
        { 
          isActive: false, 
          email: `deleted_${Date.now()}_${user.email}` 
        },
        { new: true }
      ).select('-password');
      
      res.json({ 
        message: 'User deleted successfully', 
        user: deletedUser 
      });
    } catch (error) {
      console.error('User deletion error:', error);
      res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'Failed to delete user' 
      });
    }
  }

  // ============================================================================
  // SUBMISSION MANAGEMENT
  // ============================================================================

  static async getSubmissions(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;
      
      // Build filter
      const filter = {};
      if (req.query.status) filter.status = req.query.status;
      if (req.query.category) filter.category = req.query.category;
      if (req.query.country) filter.country = req.query.country;
      if (req.query.reliability) filter.reliability = req.query.reliability;
      if (req.query.flagged === 'true') filter.priority = 'high';
      if (req.query.search) {
        filter.$or = [
          { title: { $regex: req.query.search, $options: 'i' } },
          { publisher: { $regex: req.query.search, $options: 'i' } },
          { url: { $regex: req.query.search, $options: 'i' } }
        ];
      }
      
      const [submissions, total] = await Promise.all([
        Submission.find(filter)
          .populate('submitterId', 'username email country')
          .populate('verifierId', 'username email country')
          .sort({ submittedDate: -1 })
          .skip(skip)
          .limit(limit),
        Submission.countDocuments(filter)
      ]);
      
      res.json({
        submissions,
        pagination: { 
          current: page, 
          pages: Math.ceil(total / limit), 
          total, 
          limit 
        }
      });
    } catch (error) {
      console.error('Admin submissions fetch error:', error);
      res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'Failed to fetch submissions' 
      });
    }
  }

  static async overrideSubmission(req, res) {
    try {
      const submissionId = req.params.id;
      const { status, reliability, adminNotes, reason } = req.body;
      
      const submission = await Submission.findById(submissionId);
      if (!submission) {
        return res.status(404).json({ 
          error: 'Not Found',
          message: 'Submission not found' 
        });
      }
      
      // Store original values for audit
      const originalStatus = submission.status;
      const originalReliability = submission.reliability;
      const originalVerifier = submission.verifierId;
      
      // Update submission
      submission.status = status;
      if (reliability) submission.reliability = reliability;
      submission.verifierId = req.user._id;
      submission.verifiedDate = new Date();
      submission.verifierNotes = adminNotes;
      
      // Add admin override to review history
      submission.reviewHistory.push({
        reviewerId: req.user._id,
        action: 'admin_override',
        notes: `Admin override: ${reason}. Original: ${originalStatus}/${originalReliability} by ${originalVerifier}`,
        date: new Date()
      });
      
      await submission.save();
      
      res.json({ 
        message: 'Submission override successful', 
        submission 
      });
    } catch (error) {
      console.error('Submission override error:', error);
      res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'Failed to override submission' 
      });
    }
  }

  static async flagSubmission(req, res) {
    try {
      const submissionId = req.params.id;
      const { reason, priority = 'high' } = req.body;
      
      const submission = await Submission.findByIdAndUpdate(
        submissionId,
        {
          priority,
          $push: {
            reviewHistory: {
              reviewerId: req.user._id,
              action: 'flagged',
              notes: `Flagged by admin: ${reason}`,
              date: new Date()
            }
          }
        },
        { new: true }
      );
      
      if (!submission) {
        return res.status(404).json({ 
          error: 'Not Found',
          message: 'Submission not found' 
        });
      }
      
      res.json({ 
        message: 'Submission flagged successfully', 
        submission 
      });
    } catch (error) {
      console.error('Submission flag error:', error);
      res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'Failed to flag submission' 
      });
    }
  }

  static async deleteSubmission(req, res) {
    try {
      const submissionId = req.params.id;
      const { reason } = req.body;
      
      const submission = await Submission.findById(submissionId);
      if (!submission) {
        return res.status(404).json({ 
          error: 'Not Found',
          message: 'Submission not found' 
        });
      }
      
      // Add deletion record to review history before deleting
      submission.reviewHistory.push({
        reviewerId: req.user._id,
        action: 'deleted',
        notes: `Deleted by admin: ${reason}`,
        date: new Date()
      });
      
      await submission.save();
      await Submission.findByIdAndDelete(submissionId);
      
      res.json({ message: 'Submission deleted successfully' });
    } catch (error) {
      console.error('Submission deletion error:', error);
      res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'Failed to delete submission' 
      });
    }
  }
}

module.exports = AdminController;