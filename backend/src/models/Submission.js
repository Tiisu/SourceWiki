import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  url: {
    type: String,
    required: [true, 'URL is required'],
    trim: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  publisher: {
    type: String,
    required: [true, 'Publisher is required'],
    trim: true,
    maxlength: [100, 'Publisher cannot exceed 100 characters']
  },
  country: {
    type: String,
    required: [true, 'Country is required']
  },
  category: {
    type: String,
    enum: ['primary', 'secondary', 'unreliable'],
    required: [true, 'Category is required']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  submitter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  verifier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  wikipediaArticle: {
    type: String,
    trim: true
  },
  verifierNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  verifiedAt: {
    type: Date
  },
  fileType: {
    type: String,
    enum: ['url', 'pdf'],
    default: 'url'
  },
  fileName: {
    type: String
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
submissionSchema.index({ country: 1, status: 1 });
submissionSchema.index({ submitter: 1 });
submissionSchema.index({ category: 1 });
submissionSchema.index({ createdAt: -1 });

// Virtual for submitter details
submissionSchema.virtual('submitterDetails', {
  ref: 'User',
  localField: 'submitter',
  foreignField: '_id',
  justOne: true
});

// Virtual for verifier details
submissionSchema.virtual('verifierDetails', {
  ref: 'User',
  localField: 'verifier',
  foreignField: '_id',
  justOne: true
});

// Ensure virtuals are included in JSON
submissionSchema.set('toJSON', { virtuals: true });
submissionSchema.set('toObject', { virtuals: true });

const Submission = mongoose.model('Submission', submissionSchema);

export default Submission;
