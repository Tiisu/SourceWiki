import { Op, fn, col } from 'sequelize';
import User from '../models/User.js';
import Submission from '../models/Submission.js';
import CountryStats from '../models/CountryStats.js';
import { countWhen, countBy, dayKey, verificationSpeed } from '../models/queries.js';
import AppError from '../utils/AppError.js';
import { ErrorCodes } from '../utils/errorCodes.js';

const DAY_MS = 24 * 60 * 60 * 1000;

const dateRange = (query) => ({
  startDate: query.startDate ? new Date(query.startDate) : new Date(Date.now() - 30 * DAY_MS),
  endDate: query.endDate ? new Date(query.endDate) : new Date()
});

const approvalRate = (approved, total) => (total ? Math.round((approved / total) * 100) : 0);

/** Counts by status for a filter: { total, approved, rejected, pending }. */
const statusCounts = async (where) => {
  const rows = await countBy(Submission, 'status', { where, order: false });
  const byStatus = Object.fromEntries(rows.map(({ _id, count }) => [_id, count]));
  return {
    total: rows.reduce((sum, { count }) => sum + count, 0),
    approved: byStatus.approved || 0,
    rejected: byStatus.rejected || 0,
    pending: byStatus.pending || 0
  };
};

/** Submissions per day: [{ _id: { date }, count }], oldest first. */
const timeline = async (where) => {
  const rows = await Submission.findAll({ where, attributes: ['createdAt'], raw: true });
  const perDay = new Map();
  for (const { createdAt } of rows) {
    const date = dayKey(createdAt);
    perDay.set(date, (perDay.get(date) || 0) + 1);
  }
  return [...perDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ _id: { date }, count }));
};

class ReportsController {
  // ============================================================================
  // REPORTS GENERATION
  // ============================================================================

  static async getOverviewReport(req, res, next) {
    try {
      const { startDate, endDate } = dateRange(req.query);
      const country = req.query.country;

      const submissionWhere = { createdAt: { [Op.between]: [startDate, endDate] } };
      const userWhere = { createdAt: { [Op.between]: [startDate, endDate] } };
      if (country) {
        submissionWhere.country = country;
        userWhere.country = country;
      }

      const [
        counts,
        newUsers,
        byCountry,
        submissionsByCategory,
        contributorRows,
        reviewed
      ] = await Promise.all([
        statusCounts(submissionWhere),
        User.count({ where: userWhere }),
        Submission.findAll({
          where: submissionWhere,
          attributes: ['country', [fn('COUNT', col('id')), 'submissions'], countWhen('status', 'approved')],
          group: ['country'],
          raw: true
        }),
        countBy(Submission, 'category', { where: submissionWhere, order: false }),
        Submission.findAll({
          where: submissionWhere,
          attributes: ['submitter', [fn('COUNT', col('id')), 'submissions'], countWhen('status', 'approved')],
          group: ['submitter'],
          raw: true
        }),
        Submission.findAll({
          where: { ...submissionWhere, status: ['approved', 'rejected'], verifiedAt: { [Op.ne]: null } },
          attributes: ['status', 'createdAt', 'verifiedAt'],
          raw: true
        })
      ]);

      const bySubmissionsDesc = (a, b) => b.submissions - a.submissions;

      const topCountries = byCountry
        .map((row) => ({ _id: row.country, submissions: Number(row.submissions), approved: Number(row.approved) || 0 }))
        .sort(bySubmissionsDesc)
        .slice(0, 10);

      const topContributorStats = contributorRows
        .map((row) => ({ _id: row.submitter, submissions: Number(row.submissions), approved: Number(row.approved) || 0 }))
        .sort(bySubmissionsDesc)
        .slice(0, 10);

      const contributorUsers = topContributorStats.length
        ? await User.findAll({
            where: { id: topContributorStats.map((c) => c._id) },
            attributes: ['id', 'username', 'country']
          })
        : [];
      const usersById = new Map(contributorUsers.map((user) => [String(user.id), user]));

      const topContributors = topContributorStats.map((c) => {
        const user = usersById.get(String(c._id));
        return { ...c, username: user?.username, country: user?.country };
      });

      const speed = verificationSpeed(reviewed);

      res.json({
        period: {
          startDate,
          endDate,
          country: country || 'all'
        },
        summary: {
          totalSubmissions: counts.total,
          approvedSubmissions: counts.approved,
          rejectedSubmissions: counts.rejected,
          pendingSubmissions: counts.pending,
          newUsers,
          activeCountries: byCountry.length,
          approvalRate: approvalRate(counts.approved, counts.total)
        },
        breakdown: {
          byCategory: submissionsByCategory,
          byCountry: topCountries,
          topContributors,
          verificationSpeed: speed
            ? { _id: null, avgDays: speed.avgDays, minDays: speed.minDays, maxDays: speed.maxDays, totalProcessed: speed.total }
            : { avgDays: 0, minDays: 0, maxDays: 0, totalProcessed: 0 }
        },
        generated: new Date()
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCountryReport(req, res, next) {
    try {
      const countryCode = req.params.country?.toUpperCase();
      const { startDate, endDate } = dateRange(req.query);

      if (!countryCode) {
        return next(new AppError('Country code is required', 400, ErrorCodes.INVALID_INPUT));
      }

      const where = {
        country: countryCode,
        createdAt: { [Op.between]: [startDate, endDate] }
      };

      const [countryStats, counts, contributors, verifiers, byCategory, timelineData] = await Promise.all([
        CountryStats.findOne({ where: { countryCode } }),
        statusCounts(where),
        User.count({ where: { country: countryCode, role: 'contributor', isActive: true } }),
        User.count({ where: { country: countryCode, role: 'verifier', isActive: true } }),
        countBy(Submission, 'category', { where, order: false }),
        timeline(where)
      ]);

      if (!countryStats) {
        return next(new AppError('Country statistics not found', 404, ErrorCodes.RESOURCE_NOT_FOUND));
      }

      res.json({
        country: {
          code: countryCode,
          name: countryStats.countryName
        },
        period: {
          startDate,
          endDate
        },
        summary: {
          totalSubmissions: counts.total,
          approvedSubmissions: counts.approved,
          rejectedSubmissions: counts.rejected,
          pendingSubmissions: counts.pending,
          contributors,
          verifiers,
          approvalRate: approvalRate(counts.approved, counts.total)
        },
        breakdown: {
          byCategory,
          timeline: timelineData
        },
        currentStats: countryStats.statistics,
        generated: new Date()
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUserReport(req, res, next) {
    try {
      const { userId } = req.params;
      const { startDate, endDate } = dateRange(req.query);

      const user = await User.findByPk(userId);
      if (!user) {
        return next(new AppError('User not found', 404, ErrorCodes.RESOURCE_NOT_FOUND));
      }

      const where = {
        submitter: user.id,
        createdAt: { [Op.between]: [startDate, endDate] }
      };

      const [counts, byCategory, timelineData] = await Promise.all([
        statusCounts(where),
        countBy(Submission, 'category', { where, order: false }),
        timeline(where)
      ]);

      res.json({
        user: {
          id: user.id,
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
          totalSubmissions: counts.total,
          approvedSubmissions: counts.approved,
          rejectedSubmissions: counts.rejected,
          pendingSubmissions: counts.pending,
          approvalRate: approvalRate(counts.approved, counts.total)
        },
        breakdown: {
          byCategory,
          timeline: timelineData
        },
        generated: new Date()
      });
    } catch (error) {
      next(error);
    }
  }
}

export default ReportsController;
