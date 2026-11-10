import User from '../models/User.js';
import Submission, { includeSubmitter, includeVerifier } from '../models/Submission.js';
import CountryStats from '../models/CountryStats.js';
import { paginate, searchAny } from '../models/helpers.js';
import AppError from '../utils/AppError.js';
import { ErrorCodes } from '../utils/errorCodes.js';

const SORT_OPTIONS = {
  name: [['countryName', 'ASC']],
  submissions: [['totalSubmissions', 'DESC']],
  verifiers: [['activeVerifiers', 'DESC']],
  activity: [['lastUpdated', 'DESC']]
};

const notFound = (next) => next(new AppError('Country not found', 404, ErrorCodes.RESOURCE_NOT_FOUND));

/**
 * JSON for countries with `userId` inside the given array fields replaced by
 * { _id, id, username, email }, like Mongoose `.populate('verifiers.userId')`.
 * Unknown users become null, as populate did.
 */
const withPopulatedUsers = async (countries, fields) => {
  const list = Array.isArray(countries) ? countries : [countries];
  const json = list.map((country) => country.toJSON());

  const ids = new Set();
  for (const country of json) {
    for (const field of fields) {
      for (const entry of country[field]) if (entry.userId) ids.add(String(entry.userId));
    }
  }

  const users = ids.size
    ? await User.findAll({ where: { id: [...ids] }, attributes: ['id', 'username', 'email'] })
    : [];
  const byId = new Map(users.map((user) => [String(user.id), user.toJSON()]));

  for (const country of json) {
    for (const field of fields) {
      country[field] = country[field].map((entry) => ({
        ...entry,
        userId: entry.userId ? byId.get(String(entry.userId)) ?? null : null
      }));
    }
  }

  return Array.isArray(countries) ? json : json[0];
};

class CountryController {
  // ============================================================================
  // COUNTRY MANAGEMENT
  // ============================================================================

  static async getCountries(req, res, next) {
    try {
      const { page, limit, offset } = paginate(req.query);
      const sortBy = req.query.sortBy || 'submissions';

      const where = req.query.search ? searchAny(['countryName', 'countryCode'], req.query.search) : {};

      const { rows, count: total } = await CountryStats.findAndCountAll({
        where,
        order: SORT_OPTIONS[sortBy] || SORT_OPTIONS.submissions,
        offset,
        limit
      });

      res.json({
        countries: await withPopulatedUsers(rows, ['verifiers']),
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

  static async createCountry(req, res, next) {
    try {
      const { countryCode, countryName } = req.body;

      const existing = await CountryStats.findOne({
        where: { countryCode: String(countryCode || '').toUpperCase() }
      });

      if (existing) {
        return next(new AppError('Country already exists', 400, ErrorCodes.RESOURCE_ALREADY_EXISTS));
      }

      const country = await CountryStats.create({ countryCode, countryName });

      res.status(201).json({
        message: 'Country created successfully',
        country
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateCountry(req, res, next) {
    try {
      const country = await CountryStats.findOne({
        where: { countryCode: req.params.code.toUpperCase() }
      });

      if (!country) return notFound(next);

      if (req.body.countryName) {
        await country.update({ countryName: req.body.countryName });
      }

      res.json({
        message: 'Country updated successfully',
        country
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteCountry(req, res, next) {
    try {
      const countryCode = req.params.code.toUpperCase();

      const submissionCount = await Submission.count({ where: { country: countryCode } });
      if (submissionCount > 0) {
        return next(new AppError('Cannot delete country with existing submissions', 400, ErrorCodes.OPERATION_NOT_ALLOWED));
      }

      const deleted = await CountryStats.destroy({ where: { countryCode } });

      if (!deleted) return notFound(next);

      res.json({ message: 'Country deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async getCountryStats(req, res, next) {
    try {
      const country = await CountryStats.findOne({
        where: { countryCode: req.params.code.toUpperCase() }
      });

      if (!country) return notFound(next);

      res.json(await withPopulatedUsers(country, ['verifiers', 'topContributors', 'topVerifiers']));
    } catch (error) {
      next(error);
    }
  }

  static async getCountrySubmissions(req, res, next) {
    try {
      const countryCode = req.params.code.toUpperCase();
      const { status, category } = req.query;
      const { page, limit, offset } = paginate(req.query);

      const where = { country: countryCode };
      if (status) where.status = status;
      if (category) where.category = category;

      const { rows: submissions, count: total } = await Submission.findAndCountAll({
        where,
        include: [includeSubmitter(['username', 'country']), includeVerifier(['username', 'country'])],
        order: [['createdAt', 'DESC']],
        offset,
        limit,
        distinct: true
      });

      res.json({
        success: true,
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

  static async updateCountryStats(req, res, next) {
    try {
      const country = await CountryStats.findOne({
        where: { countryCode: req.params.code.toUpperCase() }
      });

      if (!country) return notFound(next);

      await country.updateStats();

      res.json({
        message: 'Country statistics updated successfully',
        country
      });
    } catch (error) {
      next(error);
    }
  }

  static async assignVerifier(req, res, next) {
    try {
      const countryCode = req.params.code.toUpperCase();
      const { userId, specializations = [] } = req.body;

      const [country, user] = await Promise.all([
        CountryStats.findOne({ where: { countryCode } }),
        userId ? User.findByPk(userId) : null
      ]);

      if (!country) return notFound(next);

      if (!user) {
        return next(new AppError('User not found', 404, ErrorCodes.RESOURCE_NOT_FOUND));
      }

      if (country.verifiers.find((v) => String(v.userId) === String(userId))) {
        return next(new AppError('User is already a verifier for this country', 400, ErrorCodes.RESOURCE_ALREADY_EXISTS));
      }

      country.verifiers = [
        ...country.verifiers,
        { userId: user.id, specializations, assignedDate: new Date().toISOString(), isActive: true }
      ];

      // Update user role if needed
      if (user.role !== 'verifier' && user.role !== 'admin') {
        await user.update({ role: 'verifier' });
      }

      await country.save();
      await country.updateStats();

      res.json({
        message: 'Verifier assigned successfully',
        country
      });
    } catch (error) {
      next(error);
    }
  }

  static async removeVerifier(req, res, next) {
    try {
      const { userId } = req.body;

      const country = await CountryStats.findOne({
        where: { countryCode: req.params.code.toUpperCase() }
      });

      if (!country) return notFound(next);

      country.verifiers = country.verifiers.filter((v) => String(v.userId) !== String(userId));

      await country.save();
      await country.updateStats();

      res.json({
        message: 'Verifier removed successfully',
        country
      });
    } catch (error) {
      next(error);
    }
  }
}

export default CountryController;
