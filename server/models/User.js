const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
    enum: ['admin', 'verifier', 'contributor'],
    default: 'contributor'
  },
  points: {
    type: Number,
    default: 0,
    min: 0
  },
  badges: [{
    type: String,
    enum: ['first-submission', '10-verified', 'country-expert', 'early-adopter', 'super-verifier', 'quality-contributor']
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

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Calculate success rate
userSchema.methods.updateSuccessRate = function() {
  const total = this.verificationStats.verified + this.verificationStats.rejected;
  this.verificationStats.successRate = total > 0 ? Math.round((this.verificationStats.verified / total) * 100) : 0;
};

// Transform output (remove password from JSON)
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);