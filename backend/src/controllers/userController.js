import User from '../models/User.js';
import Submission from '../models/Submission.js';

// @desc    Get user profile
// @route   GET /api/users/:id
// @access  Public
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's submission stats
    const submissionStats = await Submission.aggregate([
      { $match: { submitter: user._id } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          approved: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
          },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          rejected: {
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
          }
        }
      }
    ]);

    const stats = submissionStats[0] || {
      total: 0,
      approved: 0,
      pending: 0,
      rejected: 0
    };

    res.status(200).json({
      success: true,
      user: user.getPublicProfile(),
      stats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get leaderboard
// @route   GET /api/users/leaderboard
// @access  Public
export const getLeaderboard = async (req, res, next) => {
  try {
    const { country, limit = 20 } = req.query;

    const query = { isActive: true };
    if (country) query.country = country;

    const users = await User.find(query)
      .select('username country role points badges createdAt')
      .sort({ points: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Award badge to user (admin only)
// @route   POST /api/users/:id/badge
// @access  Private (admin)
export const awardBadge = async (req, res, next) => {
  try {
    const { name, icon } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if badge already exists
    const badgeExists = user.badges.some(badge => badge.name === name);
    if (badgeExists) {
      return res.status(400).json({
        success: false,
        message: 'User already has this badge'
      });
    }

    user.badges.push({ name, icon });
    await user.save();

    res.status(200).json({
      success: true,
      user: user.getPublicProfile()
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role (admin only)
// @route   PUT /api/users/:id/role
// @access  Private (admin)
export const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!['contributor', 'verifier', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user: user.getPublicProfile()
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private (admin)
export const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, country, search } = req.query;

    const query = {};
    if (role) query.role = role;
    if (country) query.country = country;
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Deactivate user (admin only)
// @route   PUT /api/users/:id/deactivate
// @access  Private (admin)
export const deactivateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully',
      user: user.getPublicProfile()
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Activate user (admin only)
// @route   PUT /api/users/:id/activate
// @access  Private (admin)
export const activateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User activated successfully',
      user: user.getPublicProfile()
    });
  } catch (error) {
    next(error);
  }
};
