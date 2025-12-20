import User from '../models/User.js';
import Submission from '../models/Submission.js';
import CountryStats from '../models/CountryStats.js';
import AppError from '../utils/AppError.js';
import { ErrorCodes } from '../utils/errorCodes.js';

class CountryController {
  // ============================================================================
  // COUNTRY MANAGEMENT
  // ============================================================================


  static async getCountries(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;
      const sortBy = req.query.sortBy || 'submissions';
      
      // Build filter
      const filter = {};
      if (req.query.search) {
        filter.$or = [
          { countryName: { $regex: req.query.search, $options: 'i' } },
          { countryCode: { $regex: req.query.search, $options: 'i' } }
        ];
      }
      
      // Build sort
      const sortOptions = {
        name: { countryName: 1 },
        submissions: { 'statistics.totalSubmissions': -1 },
        verifiers: { 'statistics.activeVerifiers': -1 },
        activity: { lastUpdated: -1 }
      };
      
      const [countries, total] = await Promise.all([
        CountryStats.find(filter)
          .populate('verifiers.userId', 'username email')
          .sort(sortOptions[sortBy])
          .skip(skip)
          .limit(limit),
        CountryStats.countDocuments(filter)
      ]);
      
      res.json({
        countries,
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
      
      // Check if country already exists
      const existing = await CountryStats.findOne({ 
        countryCode: countryCode.toUpperCase() 
      });
      
      if (existing) {
        return next(new AppError('Country already exists', 400, ErrorCodes.RESOURCE_ALREADY_EXISTS));
      }
      
      const country = new CountryStats({
        countryCode: countryCode.toUpperCase(),
        countryName
      });
      
      await country.save();
      
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
      const countryCode = req.params.code.toUpperCase();
      const updates = {};
      
      if (req.body.countryName) updates.countryName = req.body.countryName;
      
      const country = await CountryStats.findOneAndUpdate(
        { countryCode },
        updates,
        { new: true, runValidators: true }
      );
      
      if (!country) {
        return next(new AppError('Country not found', 404, ErrorCodes.RESOURCE_NOT_FOUND));
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
      
      // Check if country has submissions
      const submissionCount = await Submission.countDocuments({ country: countryCode });
      if (submissionCount > 0) {
        return next(new AppError('Cannot delete country with existing submissions', 400, ErrorCodes.OPERATION_NOT_ALLOWED));
      }
      
      const country = await CountryStats.findOneAndDelete({ countryCode });
      
      if (!country) {
        return next(new AppError('Country not found', 404, ErrorCodes.RESOURCE_NOT_FOUND));
      }
      
      res.json({ message: 'Country deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async getCountryStats(req, res, next) {
    try {
      const countryCode = req.params.code.toUpperCase();
      
      const country = await CountryStats.findOne({ countryCode })
        .populate('verifiers.userId', 'username email')
        .populate('topContributors.userId', 'username email')
        .populate('topVerifiers.userId', 'username email');
      
      if (!country) {
        return next(new AppError('Country not found', 404, ErrorCodes.RESOURCE_NOT_FOUND));
      }
      
      res.json(country);
    } catch (error) {
      next(error);
    }
  }

  static async getCountrySubmissions(req, res, next) {
    try {
      const countryCode = req.params.code.toUpperCase();
      const { page = 1, limit = 20, status, category } = req.query;
      
      const query = { country: countryCode };
      if (status) query.status = status;
      if (category) query.category = category;
      
      const skip = (page - 1) * limit;
      
      const [submissions, total] = await Promise.all([
        Submission.find(query)
          .populate('submitter', 'username country')
          .populate('verifier', 'username country')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        Submission.countDocuments(query)
      ]);
      
      res.json({
        success: true,
        submissions,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateCountryStats(req, res, next) {
    try {
      const countryCode = req.params.code.toUpperCase();
      
      const country = await CountryStats.findOne({ countryCode });
      
      if (!country) {
        return next(new AppError('Country not found', 404, ErrorCodes.RESOURCE_NOT_FOUND));
      }
      
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
        CountryStats.findOne({ countryCode }),
        User.findById(userId)
      ]);
      
      if (!country) {
        return next(new AppError('Country not found', 404, ErrorCodes.RESOURCE_NOT_FOUND));
      }
      
      if (!user) {
        return next(new AppError('User not found', 404, ErrorCodes.RESOURCE_NOT_FOUND));
      }
      
      // Check if user is already a verifier for this country
      const existingVerifier = country.verifiers.find(
        v => v.userId.toString() === userId
      );
      
      if (existingVerifier) {
        return next(new AppError('User is already a verifier for this country', 400, ErrorCodes.RESOURCE_ALREADY_EXISTS));
      }
      
      // Add verifier
      country.verifiers.push({
        userId,
        specializations,
        assignedDate: new Date(),
        isActive: true
      });
      
      // Update user role if needed
      if (user.role !== 'verifier' && user.role !== 'admin') {
        user.role = 'verifier';
        await user.save();
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
      const countryCode = req.params.code.toUpperCase();
      const { userId } = req.body;
      
      const country = await CountryStats.findOne({ countryCode });
      
      if (!country) {
        return next(new AppError('Country not found', 404, ErrorCodes.RESOURCE_NOT_FOUND));
      }
      
      // Remove verifier
      country.verifiers = country.verifiers.filter(
        v => v.userId.toString() !== userId
      );
      
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