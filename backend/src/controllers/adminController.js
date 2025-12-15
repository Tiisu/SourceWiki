
import User from '../models/User.js';
import Submission from '../models/Submission.js';
import CountryStats from '../models/CountryStats.js';

import ExportUtils from '../utils/exportUtils.js';

import AppError from '../utils/AppError.js';
import { ErrorCodes } from '../utils/errorCodes.j

class AdminController {
  // ============================================================================
  // DASHBOARD & ANALYTICS
  // ============================================================================


  static async getDashboard(req, res, next) {
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
          .populate('submitter', 'username country')
          .populate('verifier', 'username country')
          .sort({ createdAt: -1 })
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
      next(error);
    }
  }

  static async getAnalytics(req, res, next) {
    try {
      const period = req.query.period || '30d';
      const country = req.query.country;
      
      // Calculate date range
      const days = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }[period];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      // Build match filters
      const matchFilter = { createdAt: { $gte: startDate } };
      if (country) matchFilter.country = country;
      
      const [submissionTrends, verificationSpeed] = await Promise.all([
        // Time series data for submissions
        Submission.aggregate([
          { $match: matchFilter },
          {
            $group: {
              _id: {
                date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
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
              status: { $in: ['approved', 'rejected'] },
              verifiedAt: { $exists: true }
            }
          },
          {
            $project: {
              daysToVerify: {
                $divide: [
                  { $subtract: ['$verifiedAt', '$createdAt'] },
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
      next(error);
    }
  }

  // ============================================================================
  // USER MANAGEMENT
  // ============================================================================

  static async getUsers(req, res, next) {
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
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        User.countDocuments(filter)
      ]);
      
      // Get submission stats for each user
      const userIds = users.map(user => user._id);
      const submissionStats = await Submission.aggregate([
        { $match: { submitter: { $in: userIds } } },
        {
          $group: {
            _id: '$submitter',
            total: { $sum: 1 },
            approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
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
          submissionStats: stats || { total: 0, approved: 0, pending: 0, rejected: 0 }
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
      next(error);
    }
  }

  static async updateUser(req, res, next) {
    try {
      const userId = req.params.id;
      
      // Prevent self-modification
      if (userId === req.user._id.toString()) {
        return next(new AppError('Cannot modify your own account', 400, ErrorCodes.INVALID_INPUT));
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
        return next(new AppError('User not found', 404, ErrorCodes.RESOURCE_NOT_FOUND));
      }
      
      // If role changed to verifier, update CountryStats
      if (updates.role === 'verifier') {
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
      next(error);
    }
  }

  static async deleteUser(req, res, next) {
    try {
      const userId = req.params.id;
      
      if (userId === req.user._id.toString()) {
        return next(new AppError('Cannot delete your own account', 400, ErrorCodes.INVALID_INPUT));
      }
      
      const user = await User.findById(userId);
      if (!user) {
        return next(new AppError('User not found', 404, ErrorCodes.RESOURCE_NOT_FOUND));
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
      next(error);
    }
  }

  // ============================================================================
  // SUBMISSION MANAGEMENT
  // ============================================================================

  static async getSubmissions(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;
      
      // Build filter
      const filter = {};
      if (req.query.status) filter.status = req.query.status;
      if (req.query.category) filter.category = req.query.category;
      if (req.query.country) filter.country = req.query.country;
      if (req.query.search) {
        filter.$or = [
          { title: { $regex: req.query.search, $options: 'i' } },
          { publisher: { $regex: req.query.search, $options: 'i' } },
          { url: { $regex: req.query.search, $options: 'i' } }
        ];
      }
      
      const [submissions, total] = await Promise.all([
        Submission.find(filter)
          .populate('submitter', 'username email country')
          .populate('verifier', 'username email country')
          .sort({ createdAt: -1 })
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
      next(error);
    }
  }

  static async overrideSubmission(req, res, next) {
    try {
      const submissionId = req.params.id;
      const { status, adminNotes, reason } = req.body;
      
      const submission = await Submission.findById(submissionId);
      if (!submission) {
        return next(new AppError('Submission not found', 404, ErrorCodes.RESOURCE_NOT_FOUND));
      }
      
      // Store original values for audit
      const originalStatus = submission.status;
      const originalVerifier = submission.verifier;
      
      // Update submission
      submission.status = status;
      submission.verifier = req.user._id;
      submission.verifiedAt = new Date();
      submission.verifierNotes = adminNotes;
      
      await submission.save();
      
      res.json({ 
        message: 'Submission override successful', 
        submission 
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteSubmission(req, res, next) {
    try {
      const submissionId = req.params.id;
      const { reason } = req.body;
      
      const submission = await Submission.findById(submissionId);
      if (!submission) {
        return next(new AppError('Submission not found', 404, ErrorCodes.RESOURCE_NOT_FOUND));
      }
      
      await Submission.findByIdAndDelete(submissionId);
      
      res.json({ message: 'Submission deleted successfully' });

    } catch (error) {
      next(error);
    }
  }

  // ============================================================================
  // EXPORT FUNCTIONALITY
  // ============================================================================

  static async exportSubmissions(req, res) {
    try {
      const { format = 'csv', ...filters } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10000; // Large limit for exports
      const skip = (page - 1) * limit;

      // Build filter query
      const filterQuery = ExportUtils.buildFilterQuery(filters);

      // Get submissions with populated data
      const submissions = await Submission.find(filterQuery)
        .populate('submitter', 'username email country')
        .populate('verifier', 'username email country')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      // Transform data for export
      const transformedData = ExportUtils.transformSubmissionData(submissions);

      // Get export statistics
      const stats = await ExportUtils.getExportStats(filters);

      // Set response headers
      const filename = `submissions_export_${new Date().toISOString().split('T')[0]}`;
      
      if (format.toLowerCase() === 'csv') {
        const csv = await ExportUtils.convertToCSV(transformedData);
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
        res.send(csv);
      } else if (format.toLowerCase() === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
        res.json({
          data: transformedData,
          metadata: {
            totalRecords: submissions.length,
            filters: filters,
            exportDate: new Date().toISOString(),
            stats: stats
          }
        });
      } else {
        res.status(400).json({ 
          error: 'Bad Request',
          message: 'Invalid format. Use "csv" or "json"' 
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'Failed to export submissions' 
      });
    }
  }

  static async getExportFilters(req, res) {
    try {
      const [countries, submitters, verifiers] = await Promise.all([
        ExportUtils.getAvailableCountries(),
        ExportUtils.getAvailableSubmitters(),
        ExportUtils.getAvailableVerifiers()
      ]);

      res.json({
        countries,
        submitters,
        verifiers,
        statusOptions: ['pending', 'approved', 'rejected'],
        categoryOptions: ['primary', 'secondary', 'unreliable'],
        formatOptions: ['csv', 'json']
      });
    } catch (error) {
      console.error('Export filters fetch error:', error);
      res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'Failed to fetch export filters' 
      });
    }
  }

  // ============================================================================
  // BATCH OPERATIONS
  // ============================================================================

  static async batchApproveSubmissions(req, res) {
    try {
      const { submissionIds, verifierNotes } = req.body;
      
      // Validate input
      ExportUtils.validateBatchOperation(submissionIds, 'approve');
      await ExportUtils.logBatchOperation(req.user._id, 'approve', submissionIds, { verifierNotes });

      // Update submissions
      const result = await Submission.updateMany(
        { _id: { $in: submissionIds }, status: 'pending' },
        {
          status: 'approved',
          verifier: req.user._id,
          verifiedAt: new Date(),
          verifierNotes: verifierNotes || 'Batch approved by admin'
        }
      );

      res.json({ 
        message: 'Submissions approved successfully',
        modifiedCount: result.modifiedCount
      });
    } catch (error) {
      console.error('Batch approve error:', error);
      res.status(500).json({ 
        error: 'Internal Server Error',
        message: error.message || 'Failed to approve submissions' 
      });
    }
  }

  static async batchRejectSubmissions(req, res) {
    try {
      const { submissionIds, verifierNotes } = req.body;
      
      // Validate input
      ExportUtils.validateBatchOperation(submissionIds, 'reject');
      await ExportUtils.logBatchOperation(req.user._id, 'reject', submissionIds, { verifierNotes });

      // Update submissions
      const result = await Submission.updateMany(
        { _id: { $in: submissionIds }, status: 'pending' },
        {
          status: 'rejected',
          verifier: req.user._id,
          verifiedAt: new Date(),
          verifierNotes: verifierNotes || 'Batch rejected by admin'
        }
      );

      res.json({ 
        message: 'Submissions rejected successfully',
        modifiedCount: result.modifiedCount
      });
    } catch (error) {
      console.error('Batch reject error:', error);
      res.status(500).json({ 
        error: 'Internal Server Error',
        message: error.message || 'Failed to reject submissions' 
      });
    }
  }

  static async batchDeleteSubmissions(req, res) {
    try {
      const { submissionIds } = req.body;
      
      // Validate input
      ExportUtils.validateBatchOperation(submissionIds, 'delete');
      await ExportUtils.logBatchOperation(req.user._id, 'delete', submissionIds);

      // Delete submissions
      const result = await Submission.deleteMany({
        _id: { $in: submissionIds }
      });

      res.json({ 
        message: 'Submissions deleted successfully',
        deletedCount: result.deletedCount
      });
    } catch (error) {
      console.error('Batch delete error:', error);
      res.status(500).json({ 
        error: 'Internal Server Error',
        message: error.message || 'Failed to delete submissions' 
      });
    }
  }

  static async batchUpdateStatus(req, res) {
    try {
      const { submissionIds, status, verifierNotes } = req.body;
      
      // Validate input
      ExportUtils.validateBatchOperation(submissionIds, 'updateStatus');
      
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Status must be either "approved" or "rejected"'
        });
      }

      await ExportUtils.logBatchOperation(req.user._id, 'updateStatus', submissionIds, { 
        newStatus: status, 
        verifierNotes 
      });

      // Update submissions
      const result = await Submission.updateMany(
        { _id: { $in: submissionIds }, status: 'pending' },
        {
          status: status,
          verifier: req.user._id,
          verifiedAt: new Date(),
          verifierNotes: verifierNotes || `Batch ${status} by admin`
        }
      );

      res.json({ 
        message: `Submissions ${status} successfully`,
        modifiedCount: result.modifiedCount
      });
    } catch (error) {
      console.error('Batch update status error:', error);
      res.status(500).json({ 
        error: 'Internal Server Error',
        message: error.message || 'Failed to update submission status' 
      });
    }
  }

  static async getBatchOperationPreview(req, res) {
    try {
      const { submissionIds } = req.body;
      
      if (!Array.isArray(submissionIds) || submissionIds.length === 0) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Submission IDs array is required'
        });
      }

      if (submissionIds.length > 1000) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Cannot preview more than 1000 submissions'
        });
      }

      // Get submission details
      const submissions = await Submission.find({ _id: { $in: submissionIds } })
        .populate('submitter', 'username email country')
        .populate('verifier', 'username email country')
        .select('title publisher country status category createdAt')
        .lean();

      // Group by status for preview
      const statusGroups = submissions.reduce((groups, submission) => {
        const status = submission.status;
        if (!groups[status]) groups[status] = [];
        groups[status].push(submission);
        return groups;
      }, {});

      res.json({
        totalCount: submissions.length,
        statusGroups,
        submissions: submissions.map(sub => ({
          id: sub._id,
          title: sub.title,
          publisher: sub.publisher,
          country: sub.country,
          status: sub.status,
          category: sub.category,
          submitter: sub.submitter?.username || 'N/A',
          createdAt: sub.createdAt
        }))
      });
    } catch (error) {
      console.error('Batch preview error:', error);
      res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'Failed to generate batch operation preview' 
      });
    }
  }
}

export default AdminController;