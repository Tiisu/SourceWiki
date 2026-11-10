import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';
import User from './User.js';
import { idField, jsonField, timestampFields, withIds } from './helpers.js';

const trimmed = (field) => ({
  set(value) {
    this.setDataValue(field, typeof value === 'string' ? value.trim() : value);
  }
});

class Submission extends Model {
  // Mongo-style alias used throughout the codebase
  get _id() {
    return this.id;
  }

  /**
   * Same shape the Mongoose API returned: `submitter` / `verifier` are the
   * user object when loaded via `include`, otherwise the raw user id.
   */
  toJSON() {
    const values = { ...this.get() };
    const { submitterUser, verifierUser } = values;
    delete values.submitterUser;
    delete values.verifierUser;

    if (submitterUser) values.submitter = submitterUser.toJSON();
    if (verifierUser) values.verifier = verifierUser.toJSON();

    return withIds(values);
  }
}

Submission.init({
  ...idField,
  url: {
    type: DataTypes.STRING(2048),
    allowNull: false,
    ...trimmed('url'),
    validate: {
      notNull: { msg: 'URL is required' },
      notEmpty: { msg: 'URL is required' }
    }
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    ...trimmed('title'),
    validate: {
      notNull: { msg: 'Title is required' },
      notEmpty: { msg: 'Title is required' },
      len: { args: [0, 200], msg: 'Title cannot exceed 200 characters' }
    }
  },
  publisher: {
    type: DataTypes.STRING(100),
    allowNull: false,
    ...trimmed('publisher'),
    validate: {
      notNull: { msg: 'Publisher is required' },
      notEmpty: { msg: 'Publisher is required' },
      len: { args: [0, 100], msg: 'Publisher cannot exceed 100 characters' }
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
  category: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      notNull: { msg: 'Category is required' },
      isIn: { args: [['primary', 'secondary', 'unreliable']], msg: 'Invalid category' }
    }
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'pending',
    validate: {
      isIn: { args: [['pending', 'approved', 'rejected']], msg: 'Invalid status' }
    }
  },
  submittedDate: {
    type: DataTypes.DATE(3),
    defaultValue: DataTypes.NOW
  },
  credibility: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      isIn: { args: [['credible', 'unreliable']], msg: 'Invalid credibility' }
    }
  },
  submitter: {
    type: DataTypes.UUID,
    allowNull: false,
    validate: {
      notNull: { msg: 'Submitter is required' }
    }
  },
  verifier: {
    type: DataTypes.UUID,
    allowNull: true
  },
  wikipediaArticle: {
    type: DataTypes.STRING(2048),
    allowNull: true,
    ...trimmed('wikipediaArticle')
  },
  verifierNotes: {
    type: DataTypes.STRING(500),
    allowNull: true,
    ...trimmed('verifierNotes'),
    validate: {
      len: { args: [0, 500], msg: 'Notes cannot exceed 500 characters' }
    }
  },
  verifiedAt: {
    type: DataTypes.DATE(3),
    allowNull: true
  },
  fileType: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: 'url',
    validate: {
      isIn: { args: [['url', 'pdf']], msg: 'Invalid file type' }
    }
  },
  fileName: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  tags: jsonField('tags', []),
  ...timestampFields
}, {
  sequelize,
  modelName: 'Submission',
  tableName: 'submissions',
  validate: {
    credibilityRequiredWhenApproved() {
      if (this.status === 'approved' && !this.credibility) {
        throw new Error('Credibility rating is required for approved submissions');
      }
    }
  },
  indexes: [
    { fields: ['country', 'status'] },
    { fields: ['submitter'] },
    { fields: ['category'] },
    { fields: ['createdAt'] }
  ]
});

Submission.belongsTo(User, { as: 'submitterUser', foreignKey: 'submitter', constraints: false });
Submission.belongsTo(User, { as: 'verifierUser', foreignKey: 'verifier', constraints: false });

/** `include` entries equivalent to Mongoose `.populate('submitter', 'a b c')`. */
export const includeSubmitter = (fields) => ({
  model: User,
  as: 'submitterUser',
  attributes: ['id', ...fields]
});

export const includeVerifier = (fields) => ({
  model: User,
  as: 'verifierUser',
  attributes: ['id', ...fields]
});

export default Submission;
