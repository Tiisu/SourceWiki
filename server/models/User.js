const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  country: {
    type: String,
    required: true,
    length: 2 // Country code (e.g., 'US', 'GB')
  },
  role: {
    type: String,
    enum: ['admin', 'country_verifier', 'contributor'],
    default: 'contributor'
  },
  points: {
    type: Number,
    default: 0,
    min: 0
  },
  badges: [{
    type: String,
    enum: ['first-submission', 'reliable-hunter', 'country-expert', 'wikimedia-contributor', 'source-guardian', 'quality-verifier', 'citation-champion']
  }],
  joinDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  profileImage: {
    type: String // URL to profile image
  },
  bio: {
    type: String,
    maxlength: 500
  },
  verificationStats: {
    submitted: { type: Number, default: 0 },
    verified: { type: Number, default: 0 },
    rejected: { type: Number, default: 0 },
    successRate: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Index for performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ country: 1 });
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);