import User from '../models/User.js';
import Submission from '../models/Submission.js';
import CountryStats from '../models/CountryStats.js';

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

  static async deleteCountry(req, res) {
    try {
      const countryCode = req.params.code.toUpperCase();
      
      // Check if country has submissions
      const submissionCount = await Submission.countDocuments({ country: countryCode });
      if (submissionCount > 0) {
        return res.status(400).json({ 
          error: 'Bad Request',
          message: 'Cannot delete country with existing submissions' 
        });
      }
      
      const country = await CountryStats.findOneAndDelete({ countryCode });
      
      if (!country) {
        return res.status(404).json({ 
          error: 'Not Found',
          message: 'Country not found' 
        });
      }
      
      res.json({ message: 'Country deleted successfully' });
    } catch (error) {
      console.error('Country deletion error:', error);
      res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'Failed to delete country' 
      });
    }
  }

  static async getCountryStats(req, res) {
    try {
      const countryCode = req.params.code.toUpperCase();
      
      const country = await CountryStats.findOne({ countryCode })
        .populate('verifiers.userId', 'username email')
        .populate('topContributors.userId', 'username email')
        .populate('topVerifiers.userId', 'username email');
      
      if (!country) {
        return res.status(404).json({ 
          error: 'Not Found',
          message: 'Country not found' 
        });
      }
      
      res.json(country);
    } catch (error) {
      console.error('Country stats fetch error:', error);
      res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'Failed to fetch country statistics' 
      });
    }
  }

  static async updateCountryStats(req, res) {
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
        message: 'Country statistics updated successfully',
        country 
      });
    } catch (error) {
      console.error('Country stats update error:', error);
      res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'Failed to update country statistics' 
      });
    }
  }

  static async assignVerifier(req, res) {
    try {
      const countryCode = req.params.code.toUpperCase();
      const { userId, specializations = [] } = req.body;
      
      const [country, user] = await Promise.all([
        CountryStats.findOne({ countryCode }),
        User.findById(userId)
      ]);
      
      if (!country) {
        return res.status(404).json({ 
          error: 'Not Found',
          message: 'Country not found' 
        });
      }
      
      if (!user) {
        return res.status(404).json({ 
          error: 'Not Found',
          message: 'User not found' 
        });
      }
      
      // Check if user is already a verifier for this country
      const existingVerifier = country.verifiers.find(
        v => v.userId.toString() === userId
      );
      
      if (existingVerifier) {
        return res.status(400).json({ 
          error: 'Bad Request',
          message: 'User is already a verifier for this country' 
        });
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
      console.error('Verifier assignment error:', error);
      res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'Failed to assign verifier' 
      });
    }
  }

  static async removeVerifier(req, res) {
    try {
      const countryCode = req.params.code.toUpperCase();
      const { userId } = req.body;
      
      const country = await CountryStats.findOne({ countryCode });
      
      if (!country) {
        return res.status(404).json({ 
          error: 'Not Found',
          message: 'Country not found' 
        });
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
      console.error('Verifier removal error:', error);
      res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'Failed to remove verifier' 
      });
    }
  }
}

export default CountryController;