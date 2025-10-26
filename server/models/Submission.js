const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  publisher: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  country: {
    type: String,
    required: true,
    length: 2 // Country code
  },
  category: {
    type: String,
    required: true,
    enum: ['primary', 'secondary', 'unreliable']
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  submitterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  submitterName: {
    type: String,
    required: true
  },
  wikipediaArticle: {
    type: String,
    trim: true
  },
  fileName: {
    type: String,
    trim: true
  },
  mediaType: {
    type: String,
    enum: ['url', 'pdf'],
    required: true
  },
  submittedDate: {
    type: Date,
    default: Date.now
  },
  verifiedDate: {
    type: Date
  },
  verifierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifierNotes: {
    type: String,
    maxlength: 1000
  },
  reliability: {
    type: String,
    enum: ['credible', 'unreliable']
  },
  // Additional metadata
  fileSize: {
    type: Number // in bytes
  },
  originalFileName: {
    type: String
  },
  filePath: {
    type: String // server file path for uploaded PDFs
  },
  tags: [{
    type: String,
    trim: true
  }],
  priority: {
    type: String,
    enum: ['low', 'normal', 'high'],
    default: 'normal'
  },
  reviewHistory: [{
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    action: {
      type: String,
      enum: ['submitted', 'reviewed', 'approved', 'rejected', 'updated']
    },
    notes: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  // Verification metrics
  viewCount: {
    type: Number,
    default: 0
  },
  downloadCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for performance
submissionSchema.index({ submitterId: 1 });
submissionSchema.index({ verifierId: 1 });
submissionSchema.index({ country: 1 });
submissionSchema.index({ status: 1 });
submissionSchema.index({ category: 1 });
submissionSchema.index({ submittedDate: -1 });
submissionSchema.index({ title: 'text', publisher: 'text' }); // Text search

// Compound indexes
submissionSchema.index({ country: 1, status: 1 });
submissionSchema.index({ submitterId: 1, status: 1 });

// Virtual for submission age in days
submissionSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.submittedDate) / (1000 * 60 * 60 * 24));
});

// Static method to get submissions by country
submissionSchema.statics.findByCountry = function(countryCode, status = null) {
  const query = { country: countryCode };
  if (status) query.status = status;
  return this.find(query).populate('submitterId', 'username email').populate('verifierId', 'username email');
};

// Static method to get user's submission stats
submissionSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { submitterId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const result = { pending: 0, verified: 0, rejected: 0, total: 0 };
  stats.forEach(stat => {
    result[stat._id] = stat.count;
    result.total += stat.count;
  });
  
  return result;
};

// Instance method to add review history entry
submissionSchema.methods.addReviewEntry = function(reviewerId, action, notes = '') {
  this.reviewHistory.push({
    reviewerId,
    action,
    notes,
    date: new Date()
  });
  return this.save();
};

module.exports = mongoose.model('Submission', submissionSchema);