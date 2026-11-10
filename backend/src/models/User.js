import { DataTypes, Model } from 'sequelize';
import bcrypt from 'bcryptjs';
import { sequelize } from '../config/database.js';
import { idField, jsonField, timestampFields, withIds } from './helpers.js';

class User extends Model {
  // Mongo-style alias used throughout the codebase
  get _id() {
    return this.id;
  }

  async comparePassword(candidatePassword) {
    let hash = this.getDataValue('password');
    if (hash === undefined) {
      // Password is excluded by the default scope; load it on demand
      const withPassword = await User.scope('withPassword').findByPk(this.id);
      hash = withPassword?.getDataValue('password');
    }
    if (!hash || !candidatePassword) return false;
    return bcrypt.compare(candidatePassword, hash);
  }

  getPublicProfile() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      country: this.country,
      role: this.role,
      points: this.points,
      badges: this.badges,
      joinDate: this.createdAt,
      isActive: this.isActive
    };
  }

  toJSON() {
    const values = { ...this.get() };
    delete values.password;
    delete values.refreshTokens;
    return withIds(values);
  }
}

User.init({
  ...idField,
  username: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true,
    set(value) {
      this.setDataValue('username', typeof value === 'string' ? value.trim() : value);
    },
    validate: {
      notNull: { msg: 'Username is required' },
      notEmpty: { msg: 'Username is required' },
      len: { args: [3, 30], msg: 'Username must be between 3 and 30 characters' }
    }
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    set(value) {
      this.setDataValue('email', typeof value === 'string' ? value.trim().toLowerCase() : value);
    },
    validate: {
      notNull: { msg: 'Email is required' },
      is: { args: /^\S+@\S+\.\S+$/, msg: 'Please provide a valid email' }
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notNull: { msg: 'Password is required' },
      len: { args: [6, 255], msg: 'Password must be at least 6 characters' }
    }
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notNull: { msg: 'Country is required' },
      notEmpty: { msg: 'Country is required' }
    }
  },
  role: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'contributor',
    validate: {
      isIn: { args: [['contributor', 'verifier', 'admin']], msg: 'Invalid role' }
    }
  },
  points: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  badges: jsonField('badges', []),
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  refreshTokens: jsonField('refreshTokens', []),
  ...timestampFields
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  defaultScope: {
    attributes: { exclude: ['password'] }
  },
  scopes: {
    withPassword: { attributes: { include: ['password'] } }
  },
  indexes: [
    { fields: ['country'] },
    { fields: ['points'] }
  ]
});

const hashPassword = async (user) => {
  if (user.changed('password') && user.getDataValue('password')) {
    const salt = await bcrypt.genSalt(10);
    user.setDataValue('password', await bcrypt.hash(user.getDataValue('password'), salt));
  }
};

User.beforeSave(hashPassword);

// Badges need an earnedAt date, like the old Mongoose sub-schema default
User.beforeSave((user) => {
  if (user.changed('badges')) {
    user.badges = user.badges.map((badge) => ({
      ...badge,
      earnedAt: badge.earnedAt || new Date().toISOString()
    }));
  }
});

export default User;
