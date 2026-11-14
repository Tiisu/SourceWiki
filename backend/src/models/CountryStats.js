import { DataTypes, Model, fn, col } from 'sequelize';
import { sequelize } from '../config/database.js';
import Submission from './Submission.js';
import User from './User.js';
import { idField, jsonField, timestampFields, withIds } from './helpers.js';

// Statistics are real columns (so they can be sorted and filtered) but are
// exposed as a nested `statistics` object, as the Mongo API did.
export const STAT_FIELDS = [
  'totalSubmissions',
  'verifiedSources',
  'unreliableSources',
  'pendingReview',
  'activeContributors',
  'activeVerifiers'
];

const ACTIVITY_LIMIT = 50;

class CountryStats extends Model {
  // Mongo-style alias used throughout the codebase
  get _id() {
    return this.id;
  }

  static async getOrCreate(countryCode, countryName) {
    const code = countryCode.toUpperCase();
    let stats = await this.findOne({ where: { countryCode: code } });
    if (!stats) {
      stats = await this.create({ countryCode: code, countryName });
    }
    return stats;
  }

  async updateStats() {
    const rows = await Submission.findAll({
      where: { country: this.countryCode },
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group: ['status'],
      raw: true
    });

    const stats = {
      totalSubmissions: 0,
      verifiedSources: 0,
      unreliableSources: 0,
      pendingReview: 0
    };

    for (const { status, count } of rows) {
      const n = Number(count);
      if (status === 'approved') stats.verifiedSources = n;
      if (status === 'rejected') stats.unreliableSources = n;
      if (status === 'pending') stats.pendingReview = n;
      stats.totalSubmissions += n;
    }

    [stats.activeContributors, stats.activeVerifiers] = await Promise.all([
      User.count({ where: { country: this.countryCode, role: 'contributor', isActive: true } }),
      User.count({ where: { country: this.countryCode, role: 'verifier', isActive: true } })
    ]);

    this.statistics = stats;
    this.lastUpdated = new Date();
    return this.save();
  }

  addActivity(type, userId, description, submissionId = null) {
    this.recentActivity = [
      { type, userId, submissionId, description, timestamp: new Date().toISOString() },
      ...this.recentActivity
    ].slice(0, ACTIVITY_LIMIT);
    return this.save();
  }

  toJSON() {
    const values = { ...this.get() };
    for (const field of STAT_FIELDS) delete values[field];
    return withIds(values);
  }
}

const statColumns = Object.fromEntries(STAT_FIELDS.map((field) => [field, {
  type: DataTypes.INTEGER,
  allowNull: false,
  defaultValue: 0
}]));

CountryStats.init({
  ...idField,
  countryCode: {
    type: DataTypes.STRING(2),
    allowNull: false,
    unique: true,
    set(value) {
      this.setDataValue('countryCode', typeof value === 'string' ? value.trim().toUpperCase() : value);
    },
    validate: {
      notNull: { msg: 'Country code is required' },
      len: { args: [2, 2], msg: 'Country code must be 2 letters' }
    }
  },
  countryName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    set(value) {
      this.setDataValue('countryName', typeof value === 'string' ? value.trim() : value);
    },
    validate: {
      notNull: { msg: 'Country name is required' }
    }
  },
  ...statColumns,
  // Nested view of the stat columns. Accepts partial objects on create/set.
  statistics: {
    type: DataTypes.VIRTUAL,
    get() {
      return Object.fromEntries(STAT_FIELDS.map((field) => [field, this.getDataValue(field) ?? 0]));
    },
    set(values) {
      for (const field of STAT_FIELDS) {
        if (values && values[field] !== undefined) this.set(field, values[field]);
      }
    }
  },
  topContributors: jsonField('topContributors', []),
  topVerifiers: jsonField('topVerifiers', []),
  recentActivity: jsonField('recentActivity', []),
  verifiers: jsonField('verifiers', []),
  lastUpdated: {
    type: DataTypes.DATE(3),
    defaultValue: DataTypes.NOW
  },
  ...timestampFields
}, {
  sequelize,
  modelName: 'CountryStats',
  tableName: 'country_stats',
  indexes: [
    { fields: ['totalSubmissions'] },
    { fields: ['verifiedSources'] }
  ]
});

export default CountryStats;
