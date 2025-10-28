import mongoose from 'mongoose';

const countryStatsSchema = new mongoose.Schema({
  countryCode: {
    type: String,
    required: true,
    length: 2,
    uppercase: true
  },
  countryName: {
    type: String,
    required: true,
    trim: true
  },
  statistics: {
    totalSubmissions: { type: Number, default: 0 },
    verifiedSources: { type: Number, default: 0 },
    unreliableSources: { type: Number, default: 0 },
    pendingReview: { type: Number, default: 0 },
    activeContributors: { type: Number, default: 0 },
    activeVerifiers: { type: Number, default: 0 }
  },
  topContributors: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: String,
    points: Number,
    verifiedSubmissions: Number
  }],
  topVerifiers: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: String,
    reviewsCompleted: Number,
    accuracy: Number // percentage of reviews that align with community consensus
  }],
  recentActivity: [{
    type: {
      type: String,
      enum: ['submission', 'verification', 'new_contributor', 'new_verifier']
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    submissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Submission'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    description: String
  }],
  verifiers: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    assignedDate: {
      type: Date,
      default: Date.now
    },
    specializations: [{
      type: String,
      trim: true // e.g., "Academic journals", "Government sources", "News media"
    }],
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
countryStatsSchema.index({ countryCode: 1 }, { unique: true });
countryStatsSchema.index({ 'statistics.totalSubmissions': -1 });
countryStatsSchema.index({ 'statistics.verifiedSources': -1 });

// Update statistics
countryStatsSchema.methods.updateStats = async function() {
  const Submission = mongoose.model('Submission');
  const User = mongoose.model('User');
  
  // Get submission counts
  const stats = await Submission.aggregate([
    { $match: { country: this.countryCode } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  // Reset stats
  this.statistics.totalSubmissions = 0;
  this.statistics.verifiedSources = 0;
  this.statistics.unreliableSources = 0;
  this.statistics.pendingReview = 0;

  // Update from aggregation
  stats.forEach(stat => {
    switch(stat._id) {
      case 'approved':
        this.statistics.verifiedSources = stat.count;
        break;
      case 'rejected':
        this.statistics.unreliableSources = stat.count;
        break;
      case 'pending':
        this.statistics.pendingReview = stat.count;
        break;
    }
    this.statistics.totalSubmissions += stat.count;
  });

  // Update user counts
  this.statistics.activeContributors = await User.countDocuments({
    country: this.countryCode,
    role: 'contributor',
    isActive: true
  });

  this.statistics.activeVerifiers = await User.countDocuments({
    country: this.countryCode,
    role: 'verifier',
    isActive: true
  });

  this.lastUpdated = new Date();
  return this.save();
};

// Static method to get or create country stats
countryStatsSchema.statics.getOrCreate = async function(countryCode, countryName) {
  let stats = await this.findOne({ countryCode });
  if (!stats) {
    stats = new this({
      countryCode: countryCode.toUpperCase(),
      countryName
    });
    await stats.save();
  }
  return stats;
};

// Add activity to recent activity feed
countryStatsSchema.methods.addActivity = function(type, userId, description, submissionId = null) {
  this.recentActivity.unshift({
    type,
    userId,
    submissionId,
    description,
    timestamp: new Date()
  });

  // Keep only last 50 activities
  if (this.recentActivity.length > 50) {
    this.recentActivity = this.recentActivity.slice(0, 50);
  }

  return this.save();
};

const CountryStats = mongoose.model('CountryStats', countryStatsSchema);

export default CountryStats;