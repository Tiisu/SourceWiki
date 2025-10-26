const { User, Submission, CountryStats } = require('../models');

class CountryController {
  // ============================================================================
  // COUNTRY MANAGEMENT
  // ============================================================================

  static async getCountries(req, res) {
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
      console.error('Countries fetch error:', error);
      res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'Failed to fetch countries' 
      });
    }
  }

  static async createCountry(req, res) {
    try {
      const { countryCode, countryName } = req.body;
      
      // Check if country already exists
      const existing = await CountryStats.findOne({ 
        countryCode: countryCode.toUpperCase() 
      });
      
      if (existing) {
        return res.status(400).json({ 
          error: 'Conflict',
          message: 'Country already exists' 
        });
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
      console.error('Country creation error:', error);
      res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'Failed to create country' 
      });
    }
  }

  static async updateCountry(req, res) {
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
        return res.status(404).json({ 
          error: 'Not Found',
          message: 'Country not found' 
        });
      }
      
      res.json({ 
        message: 'Country updated successfully', 
        country 
      });
    } catch (error) {
      console.error('Country update error:', error);
      res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'Failed to update country' 
      });
    }
  }

  static async refreshCountryStats(req, res) {
    try {
      const countryCode = req.params.code.toUpperCase();
      
      const country = await CountryStats.findOne({ countryCode });
      if (!country) {
        return res.status(404).json({ 
          error: 'Not Found',
          message: 'Country not found' 
        });
      }
      
      await country.updateStats();
      
      res.json({ 
        message: 'Country statistics refreshed successfully', 
        country 
      });
    } catch (error) {
      console.error('Stats refresh error:', error);
      res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'Failed to refresh statistics' 
      });
    }
  }

  // ============================================================================
  // VERIFIER MANAGEMENT
  // ============================================================================

  static async getVerifiers(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;
      
      // Build user filter for verifiers
      const userFilter = { role: 'country_verifier' };
      if (req.query.country) userFilter.country = req.query.country.toUpperCase();
      if (req.query.active !== undefined) userFilter.isActive = req.query.active === 'true';
      if (req.query.search) {
        userFilter.$or = [
          { username: { $regex: req.query.search, $options: 'i' } },
          { email: { $regex: req.query.search, $options: 'i' } }
        ];
      }
      
      const [verifiers, total] = await Promise.all([
        User.find(userFilter)
          .select('-password')
          .sort({ joinDate: -1 })
          .skip(skip)
          .limit(limit),
        User.countDocuments(userFilter)
      ]);
      
      // Get verification stats for each verifier
      const verifierIds = verifiers.map(v => v._id);
      const verificationStats = await Submission.aggregate([
        { $match: { verifierId: { $in: verifierIds } } },
        {
          $group: {
            _id: '$verifierId',
            totalReviewed: { $sum: 1 },
            verified: { $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] } },
            rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
            avgDaysToReview: {
              $avg: {
                $divide: [
                  { $subtract: ['$verifiedDate', '$submittedDate'] },
                  1000 * 60 * 60 * 24
                ]
              }
            }
          }
        }
      ]);
      
      // Merge stats with verifiers
      const verifiersWithStats = verifiers.map(verifier => {
        const stats = verificationStats.find(s => s._id.toString() === verifier._id.toString());
        return {
          ...verifier.toObject(),
          verificationStats: stats || { 
            totalReviewed: 0, 
            verified: 0, 
            rejected: 0, 
            avgDaysToReview: 0 
          }
        };
      });
      
      res.json({
        verifiers: verifiersWithStats,
        pagination: { 
          current: page, 
          pages: Math.ceil(total / limit), 
          total, 
          limit 
        }
      });
    } catch (error) {
      console.error('Verifiers fetch error:', error);
      res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'Failed to fetch verifiers' 
      });
    }
  }

  static async assignVerifier(req, res) {
    try {
      const countryCode = req.params.code.toUpperCase();
      const { userId, specializations = [] } = req.body;
      
      // Check if user exists and is a verifier
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ 
          error: 'Not Found',
          message: 'User not found' 
        });
      }
      
      if (user.role !== 'country_verifier') {
        return res.status(400).json({ 
          error: 'Bad Request',
          message: 'User must be a country verifier' 
        });
      }
      
      // Get or create country stats
      const country = await CountryStats.getOrCreate(countryCode, '');
      
      // Check if verifier already assigned
      const existingVerifier = country.verifiers.find(
        v => v.userId.toString() === userId
      );
      
      if (existingVerifier) {
        return res.status(400).json({ 
          error: 'Conflict',
          message: 'Verifier already assigned to this country' 
        });
      }
      
      // Add verifier to country
      country.verifiers.push({
        userId,
        specializations,
        assignedDate: new Date(),
        isActive: true
      });
      
      await country.save();
      
      // Add activity
      await country.addActivity(
        'new_verifier', 
        userId, 
        `New verifier assigned: ${user.username}`
      );
      
      res.json({ 
        message: 'Verifier assigned successfully', 
        country 
      });
    } catch (error) {
      console.error('Verifier assignment error:', error);
      res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'Failed to assign verifier' 
      });
    }
  }

  static async updateVerifier(req, res) {
    try {
      const countryCode = req.params.code.toUpperCase();
      const userId = req.params.userId;
      
      const country = await CountryStats.findOne({ countryCode });
      if (!country) {
        return res.status(404).json({ 
          error: 'Not Found',
          message: 'Country not found' 
        });
      }
      
      const verifierIndex = country.verifiers.findIndex(
        v => v.userId.toString() === userId
      );
      
      if (verifierIndex === -1) {
        return res.status(404).json({ 
          error: 'Not Found',
          message: 'Verifier not found in this country' 
        });
      }
      
      // Update verifier details
      if (req.body.specializations !== undefined) {
        country.verifiers[verifierIndex].specializations = req.body.specializations;
      }
      if (req.body.isActive !== undefined) {
        country.verifiers[verifierIndex].isActive = req.body.isActive;
      }
      
      await country.save();
      
      res.json({ 
        message: 'Verifier updated successfully', 
        country 
      });
    } catch (error) {
      console.error('Verifier update error:', error);
      res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'Failed to update verifier' 
      });
    }
  }

  static async removeVerifier(req, res) {
    try {
      const countryCode = req.params.code.toUpperCase();
      const userId = req.params.userId;
      
      const country = await CountryStats.findOne({ countryCode });
      if (!country) {
        return res.status(404).json({ 
          error: 'Not Found',
          message: 'Country not found' 
        });
      }
      
      const verifierIndex = country.verifiers.findIndex(
        v => v.userId.toString() === userId
      );
      
      if (verifierIndex === -1) {
        return res.status(404).json({ 
          error: 'Not Found',
          message: 'Verifier not found in this country' 
        });
      }
      
      // Remove verifier
      country.verifiers.splice(verifierIndex, 1);
      await country.save();
      
      // Add activity
      const user = await User.findById(userId);
      await country.addActivity(
        'verifier_removed', 
        userId, 
        `Verifier removed: ${user?.username}`
      );
      
      res.json({ 
        message: 'Verifier removed successfully', 
        country 
      });
    } catch (error) {
      console.error('Verifier removal error:', error);
      res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'Failed to remove verifier' 
      });
    }
  }
}

module.exports = CountryController;