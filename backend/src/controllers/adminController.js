import { Op } from 'sequelize';
import User from '../models/User.js';
import Submission, { includeSubmitter, includeVerifier } from '../models/Submission.js';
import CountryStats from '../models/CountryStats.js';
import { paginate, searchAny } from '../models/helpers.js';
import { STATUS_COUNT_ATTRIBUTES, toStatusCounts, countBy, dayKey, verificationSpeed } from '../models/queries.js';
import AppError from '../utils/AppError.js';
import { ErrorCodes } from '../utils/errorCodes.js';

const PERIOD_DAYS = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };

// [{ _id: 'admin', count: 2 }] -> { admin: 2 }
const toObject = (rows) => Object.fromEntries(rows.map(({ _id, count }) => [_id, count]));

const pagination = (page, limit, total) => ({
  current: page,
  pages: Math.ceil(total / limit),
  total,
  limit
});

class AdminController {
  // ============================================================================
  // DASHBOARD & ANALYTICS
  // ============================================================================

  static async getDashboard(req, res, next) {
    try {
      const [
        totalUsers,
        totalSubmissions,
        usersByRole,
        submissionsByStatus,
        submissionsByCountry,
        recentSubmissions,
        topCountries
      ] = await Promise.all([
        User.count(),
        Submission.count(),
        countBy(User, 'role', { order: false }),
        countBy(Submission, 'status', { order: false }),
        countBy(Submission, 'country', { limit: 10 }),
        Submission.findAll({
          include: [includeSubmitter(['username', 'country']), includeVerifier(['username', 'country'])],
          order: [['createdAt', 'DESC']],
          limit: 50
        }),
        CountryStats.findAll({
          order: [['verifiedSources', 'DESC']],
          limit: 10
        })
      ]);

      const dashboard = {
        globalStats: {
          totalUsers,
          totalSubmissions,
          usersByRole: toObject(usersByRole),
          submissionsByStatus: toObject(submissionsByStatus),
        },
        charts: {
          submissionsByCountry,
          topCountries: topCountries.map((country) => ({
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

      const days = PERIOD_DAYS[period] ?? PERIOD_DAYS['30d'];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const where = { createdAt: { [Op.gte]: startDate } };
      if (country) where.country = country;

      const submissions = await Submission.findAll({
        where,
        attributes: ['status', 'country', 'createdAt', 'verifiedAt'],
        raw: true
      });

      // Time series: submissions per day and status
      const trendCounts = new Map();
      for (const s of submissions) {
        const key = `${dayKey(s.createdAt)}|${s.status}`;
        trendCounts.set(key, (trendCounts.get(key) || 0) + 1);
      }
      const trends = [...trendCounts.entries()]
        .map(([key, count]) => {
          const [date, status] = key.split('|');
          return { _id: { date, status }, count };
        })
        .sort((a, b) => a._id.date.localeCompare(b._id.date));

      // Verification speed per country
      const byCountry = new Map();
      for (const s of submissions) {
        if (!byCountry.has(s.country)) byCountry.set(s.country, []);
        byCountry.get(s.country).push(s);
      }
      const speed = [...byCountry.entries()]
        .map(([name, rows]) => {
          const summary = verificationSpeed(rows);
          return summary && {
            _id: name,
            avgDays: summary.avgDays,
            minDays: summary.minDays,
            maxDays: summary.maxDays,
            totalReviewed: summary.total
          };
        })
        .filter(Boolean);

      res.json({
        period,
        country,
        trends,
        verificationSpeed: speed,
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
      const { page, limit, offset } = paginate(req.query);

      const where = {};
      if (req.query.role) where.role = req.query.role;
      if (req.query.country) where.country = req.query.country;
      if (req.query.status) where.isActive = req.query.status === 'active';
      if (req.query.search) Object.assign(where, searchAny(['username', 'email'], req.query.search));

      const { rows: users, count: total } = await User.findAndCountAll({
        where,
        order: [['createdAt', 'DESC']],
        offset,
        limit
      });

      // Submission stats for each user on this page
      const stats = users.length
        ? await Submission.findAll({
            where: { submitter: users.map((user) => user.id) },
            attributes: ['submitter', ...STATUS_COUNT_ATTRIBUTES],
            group: ['submitter'],
            raw: true
          })
        : [];

      const usersWithStats = users.map((user) => {
        const row = stats.find((stat) => String(stat.submitter) === String(user.id));
        return {
          ...user.toJSON(),
          submissionStats: toStatusCounts(row)
        };
      });

      res.json({
        users: usersWithStats,
        pagination: pagination(page, limit, total)
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateUser(req, res, next) {
    try {
      const userId = req.params.id;

      // Prevent self-modification
      if (userId === String(req.user.id)) {
        return next(new AppError('Cannot modify your own account', 400, ErrorCodes.INVALID_INPUT));
      }

      const updates = {};
      if (req.body.role !== undefined) updates.role = req.body.role;
      if (req.body.isActive !== undefined) updates.isActive = req.body.isActive;
      if (req.body.country !== undefined) updates.country = req.body.country;
      if (req.body.points !== undefined) updates.points = req.body.points;
      if (req.body.badges !== undefined) updates.badges = req.body.badges;

      const user = await User.findByPk(userId);

      if (!user) {
        return next(new AppError('User not found', 404, ErrorCodes.RESOURCE_NOT_FOUND));
      }

      await user.update(updates);

      // If role changed to verifier, record them on the country's stats
      if (updates.role === 'verifier') {
        const countryStats = await CountryStats.getOrCreate(user.country, '');
        if (!countryStats.verifiers.find((v) => String(v.userId) === String(user.id))) {
          countryStats.verifiers = [
            ...countryStats.verifiers,
            { userId: user.id, assignedDate: new Date().toISOString(), specializations: [], isActive: true }
          ];
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

      if (userId === String(req.user.id)) {
        return next(new AppError('Cannot delete your own account', 400, ErrorCodes.INVALID_INPUT));
      }

      const user = await User.findByPk(userId);
      if (!user) {
        return next(new AppError('User not found', 404, ErrorCodes.RESOURCE_NOT_FOUND));
      }

      // Soft delete; free up the email for reuse
      await user.update({
        isActive: false,
        email: `deleted_${Date.now()}_${user.email}`
      });

      res.json({
        message: 'User deleted successfully',
        user
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
      const { page, limit, offset } = paginate(req.query);

      const where = {};
      if (req.query.status) where.status = req.query.status;
      if (req.query.category) where.category = req.query.category;
      if (req.query.country) where.country = req.query.country;
      if (req.query.search) Object.assign(where, searchAny(['title', 'publisher', 'url'], req.query.search));

      const { rows: submissions, count: total } = await Submission.findAndCountAll({
        where,
        include: [
          includeSubmitter(['username', 'email', 'country']),
          includeVerifier(['username', 'email', 'country'])
        ],
        order: [['createdAt', 'DESC']],
        offset,
        limit,
        distinct: true
      });

      res.json({
        submissions,
        pagination: pagination(page, limit, total)
      });
    } catch (error) {
      next(error);
    }
  }

  static async overrideSubmission(req, res, next) {
    try {
      const { status, credibility, adminNotes } = req.body;

      const submission = await Submission.findByPk(req.params.id);
      if (!submission) {
        return next(new AppError('Submission not found', 404, ErrorCodes.RESOURCE_NOT_FOUND));
      }

      if (status === 'approved' && !credibility) {
        return next(new AppError('Credibility rating is required for approved submissions', 400, ErrorCodes.INVALID_INPUT));
      }

      submission.status = status;
      // Credibility only applies to approved submissions
      submission.credibility = status === 'approved' ? credibility : null;
      submission.verifier = req.user.id;
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
      const submission = await Submission.findByPk(req.params.id);
      if (!submission) {
        return next(new AppError('Submission not found', 404, ErrorCodes.RESOURCE_NOT_FOUND));
      }

      await submission.destroy();

      res.json({ message: 'Submission deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export default AdminController;
