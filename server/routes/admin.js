const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { User, Submission, CountryStats } = require('../models');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// ============================================================================
// DASHBOARD & ANALYTICS
// ============================================================================

// GET /api/admin/dashboard - Global platform overview
router.get('/dashboard', async (req, res) => {
  try {
    // Global statistics
    const totalUsers = await User.countDocuments();
    const totalSubmissions = await Submission.countDocuments();
    
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    
    const submissionsByStatus = await Submission.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    const submissionsByCountry = await Submission.aggregate([
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Recent activity (last 50 submissions)
    const recentSubmissions = await Submission.find()
      .populate('submitterId', 'username country')
      .populate('verifierId', 'username country')
      .sort({ submittedDate: -1 })
      .limit(50);
    
    // Top performing countries
    const topCountries = await CountryStats.find()
      .sort({ 'statistics.verifiedSources': -1 })
      .limit(10);
    
    res.json({
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
    });
  } catch (error) {
    console.error('Dashboard fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// GET /api/admin/analytics - Detailed analytics
router.get('/analytics', [
  query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period'),
  query('country').optional().isLength({ min: 2, max: 2 }).withMessage('Invalid country code')
], async (req, res) => {
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
    
    // Time series data for submissions
    const submissionTrends = await Submission.aggregate([
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
    ]);
    
    // Verification speed analytics
    const verificationSpeed = await Submission.aggregate([
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
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// ============================================================================
// USER MANAGEMENT
// ============================================================================

// GET /api/admin/users - List all users with advanced filtering
router.get('/users', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  query('role').optional().isIn(['admin', 'country_verifier', 'contributor']).withMessage('Invalid role'),
  query('country').optional().isLength({ min: 2, max: 2 }).withMessage('Invalid country code'),
  query('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
  query('search').optional().isLength({ min: 1 }).withMessage('Search term required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }
    
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
    
    const users = await User.find(filter)
      .select('-password')
      .sort({ joinDate: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await User.countDocuments(filter);
    
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
      pagination: { current: page, pages: Math.ceil(total / limit), total, limit }
    });
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// PUT /api/admin/users/:id - Update user (role, status, etc.)
router.put('/users/:id', [
  body('role').optional().isIn(['admin', 'country_verifier', 'contributor']).withMessage('Invalid role'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
  body('country').optional().isLength({ min: 2, max: 2 }).withMessage('Invalid country code'),
  body('points').optional().isInt({ min: 0 }).withMessage('Points must be non-negative'),
  body('badges').optional().isArray().withMessage('Badges must be array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }
    
    const userId = req.params.id;
    const updates = {};
    
    // Prevent self-modification
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot modify your own account' });
    }
    
    // Build updates object
    if (req.body.role !== undefined) updates.role = req.body.role;
    if (req.body.isActive !== undefined) updates.isActive = req.body.isActive;
    if (req.body.country !== undefined) updates.country = req.body.country;
    if (req.body.points !== undefined) updates.points = req.body.points;
    if (req.body.badges !== undefined) updates.badges = req.body.badges;
    
    const user = await User.findByIdAndUpdate(userId, updates, { new: true, runValidators: true })
      .select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // If role changed to country_verifier, update CountryStats
    if (updates.role === 'country_verifier') {
      const countryStats = await CountryStats.getOrCreate(user.country, ''); // Country name would need to be provided
      if (!countryStats.verifiers.find(v => v.userId.toString() === userId)) {
        countryStats.verifiers.push({ userId: user._id });
        await countryStats.save();
      }
    }
    
    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    console.error('User update error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE /api/admin/users/:id - Delete user (soft delete)
router.delete('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: false, email: `deleted_${Date.now()}_${user.email}` },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully', user });
  } catch (error) {
    console.error('User deletion error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ============================================================================
// SUBMISSION MANAGEMENT
// ============================================================================

// GET /api/admin/submissions - Advanced submission management
router.get('/submissions', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['pending', 'verified', 'rejected']),
  query('category').optional().isIn(['primary', 'secondary', 'not_reliable']),
  query('country').optional().isLength({ min: 2, max: 2 }),
  query('reliability').optional().isIn(['credible', 'unreliable', 'needs_review']),
  query('flagged').optional().isBoolean(),
  query('search').optional().isLength({ min: 1 })
], async (req, res) => {
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
    
    const submissions = await Submission.find(filter)
      .populate('submitterId', 'username email country')
      .populate('verifierId', 'username email country')
      .sort({ submittedDate: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Submission.countDocuments(filter);
    
    res.json({
      submissions,
      pagination: { current: page, pages: Math.ceil(total / limit), total, limit }
    });
  } catch (error) {
    console.error('Admin submissions fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// PUT /api/admin/submissions/:id/override - Override verification decision
router.put('/submissions/:id/override', [
  body('status').isIn(['verified', 'rejected']).withMessage('Status must be verified or rejected'),
  body('reliability').optional().isIn(['credible', 'unreliable', 'needs_review']),
  body('adminNotes').notEmpty().withMessage('Admin notes required for override'),
  body('reason').notEmpty().withMessage('Override reason required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }
    
    const submissionId = req.params.id;
    const { status, reliability, adminNotes, reason } = req.body;
    
    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    // Store original values for audit
    const originalStatus = submission.status;
    const originalReliability = submission.reliability;
    const originalVerifier = submission.verifierId;
    
    // Update submission
    submission.status = status;
    if (reliability) submission.reliability = reliability;
    submission.verifierId = req.user._id; // Admin becomes the verifier
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
    
    res.json({ message: 'Submission override successful', submission });
  } catch (error) {
    console.error('Submission override error:', error);
    res.status(500).json({ error: 'Failed to override submission' });
  }
});

// PUT /api/admin/submissions/:id/flag - Flag submission for review
router.put('/submissions/:id/flag', [
  body('reason').notEmpty().withMessage('Flag reason required'),
  body('priority').optional().isIn(['low', 'normal', 'high']).withMessage('Invalid priority')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }
    
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
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    res.json({ message: 'Submission flagged successfully', submission });
  } catch (error) {
    console.error('Submission flag error:', error);
    res.status(500).json({ error: 'Failed to flag submission' });
  }
});

// DELETE /api/admin/submissions/:id - Delete submission (with reason)
router.delete('/submissions/:id', [
  body('reason').notEmpty().withMessage('Deletion reason required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }
    
    const submissionId = req.params.id;
    const { reason } = req.body;
    
    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
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
    res.status(500).json({ error: 'Failed to delete submission' });
  }
});

module.exports = router;