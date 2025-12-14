import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  country: {
    type: String,
    required: [true, 'Country is required']
  },
  role: {
    type: String,
    enum: ['contributor', 'verifier', 'admin'],
    default: 'contributor'
  },
  points: {
    type: Number,
    default: 0
  },
  badges: [{
    name: String,
    icon: String,
    earnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  refreshTokens: [{
    token: String,
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 604800 // 7 days in seconds
    }
  }],
  // Wikimedia OAuth 1.0a integration (optional)
  wikimediaOAuth1: {
    wikimediaId: {
      type: String,
      sparse: true, // Allows null values but enforces uniqueness when present
      unique: true
    },
    username: String,
    accessToken: String, // In production, encrypt this
    accessTokenSecret: String, // In production, encrypt this (OAuth 1.0a uses token + secret)
    linkedAt: Date,
    editCount: Number,
    groups: [String], // e.g., 'autoconfirmed', 'editor', etc.
    rights: [String], // User rights on Wikimedia
  },
  // Wikimedia OAuth 2.0 integration (Deprecated - kept for backward compatibility)
  wikimediaOAuth2: {
    wikimediaId: {
      type: String,
      sparse: true,
      unique: true
    },
    username: String,
    accessToken: String,
    refreshToken: String,
    tokenExpiresAt: Date,
    linkedAt: Date,
    editCount: Number,
    groups: [String],
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get public profile
userSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    username: this.username,
    email: this.email,
    country: this.country,
    role: this.role,
    points: this.points,
    badges: this.badges,
    joinDate: this.createdAt,
    isActive: this.isActive,
    wikimediaAccount: (this.wikimediaOAuth1?.wikimediaId || this.wikimediaOAuth2?.wikimediaId) ? {
      username: this.wikimediaOAuth1?.username || this.wikimediaOAuth2?.username,
      editCount: this.wikimediaOAuth1?.editCount || this.wikimediaOAuth2?.editCount,
      linkedAt: this.wikimediaOAuth1?.linkedAt || this.wikimediaOAuth2?.linkedAt,
      groups: this.wikimediaOAuth1?.groups || this.wikimediaOAuth2?.groups,
    } : null
  };
};

const User = mongoose.model('User', userSchema);

export default User;
