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
    maxlength: 200
  },
  country: {
    type: String,
    required: true,
    length: 2 // Country code
  },
  category: {
    type: String,
    required: true,
    enum: ['primary', 'secondary', 'not_reliable']
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
    enum: ['credible', 'unreliable', 'needs_review']
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

module.exports = mongoose.model('Submission', submissionSchema);