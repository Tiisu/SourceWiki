import User from '../models/User.js';
import Submission from '../models/Submission.js';
import { paginate, searchAny } from '../models/helpers.js';
import { STATUS_COUNT_ATTRIBUTES, toStatusCounts } from '../models/queries.js';
import AppError from '../utils/AppError.js';
import { ErrorCodes } from '../utils/errorCodes.js';

const notFound = (next) => next(new AppError('User not found', 404, ErrorCodes.RESOURCE_NOT_FOUND));

// @desc    Get user profile
// @route   GET /api/users/:id
// @access  Public
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) return notFound(next);

    // Get user's submission stats
    const [row] = await Submission.findAll({
      where: { submitter: user.id },
      attributes: STATUS_COUNT_ATTRIBUTES,
      raw: true
    });

    res.status(200).json({
      success: true,
      user: user.getPublicProfile(),
      stats: toStatusCounts(row)
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
    const { country } = req.query;
    const limit = parseInt(req.query.limit, 10) || 20;

    const where = { isActive: true };
    if (country) where.country = country;

    const users = await User.findAll({
      where,
      attributes: ['id', 'username', 'country', 'role', 'points', 'badges', 'createdAt'],
      order: [['points', 'DESC']],
      limit
    });

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

    const user = await User.findByPk(req.params.id);

    if (!user) return notFound(next);

    // Check if badge already exists
    if (user.badges.some((badge) => badge.name === name)) {
      return next(new AppError('User already has this badge', 400, ErrorCodes.RESOURCE_ALREADY_EXISTS));
    }

    user.badges = [...user.badges, { name, icon }];
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
      return next(new AppError('Invalid role', 400, ErrorCodes.INVALID_INPUT));
    }

    const user = await User.findByPk(req.params.id);

    if (!user) return notFound(next);

    await user.update({ role });

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
    const { role, country, search } = req.query;
    const { page, limit, offset } = paginate(req.query);

    const where = {};
    if (role) where.role = role;
    if (country) where.country = country;
    if (search) Object.assign(where, searchAny(['username', 'email'], search));

    const { rows: users, count: total } = await User.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      offset,
      limit
    });

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      users
    });
  } catch (error) {
    next(error);
  }
};

const setActive = (isActive, message) => async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) return notFound(next);

    await user.update({ isActive });

    res.status(200).json({
      success: true,
      message,
      user: user.getPublicProfile()
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Deactivate user (admin only)
// @route   PUT /api/users/:id/deactivate
// @access  Private (admin)
export const deactivateUser = setActive(false, 'User deactivated successfully');

// @desc    Activate user (admin only)
// @route   PUT /api/users/:id/activate
// @access  Private (admin)
export const activateUser = setActive(true, 'User activated successfully');
