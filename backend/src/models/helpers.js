import { DataTypes, Op } from 'sequelize';
import config from '../config/config.js';

// SQLite has a single TEXT type; MariaDB needs LONGTEXT for large JSON.
const LONG_TEXT = config.db.dialect === 'sqlite' ? DataTypes.TEXT : DataTypes.TEXT('long');

/**
 * A column that stores a JSON value (array/object) as TEXT, so it behaves the
 * same on MariaDB and SQLite.
 *
 * NOTE: the getter returns a fresh parsed copy each time, so mutating it in
 * place (e.g. `user.badges.push(x)`) does NOT persist. Always reassign:
 * `user.badges = [...user.badges, x]`.
 */
export const jsonField = (name, defaultValue) => ({
  type: LONG_TEXT,
  allowNull: true,
  get() {
    const raw = this.getDataValue(name);
    if (raw === null || raw === undefined || raw === '') {
      return structuredClone(defaultValue);
    }
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  },
  set(value) {
    this.setDataValue(name, JSON.stringify(value ?? defaultValue));
  }
});

/** createdAt/updatedAt with millisecond precision (MariaDB DATETIME(3)). */
export const timestampFields = {
  createdAt: { type: DataTypes.DATE(3), allowNull: false },
  updatedAt: { type: DataTypes.DATE(3), allowNull: false }
};

/** UUID primary key. Kept as a string so ids compare like the old ObjectIds. */
export const idField = {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  }
};

/**
 * Plain JSON for a model instance, with both `id` and `_id` (the API
 * historically returned Mongo-style `_id`).
 */
export const withIds = (values) => ({ _id: values.id, ...values });

/** Case-insensitive "contains" condition across several columns. */
export const searchAny = (columns, term) => {
  const escaped = String(term).replace(/[\\%_]/g, (c) => `\\${c}`);
  return {
    [Op.or]: columns.map((column) => ({ [column]: { [Op.like]: `%${escaped}%` } }))
  };
};

/** Parse page/limit query params into { page, limit, offset }. */
export const paginate = (query, defaultLimit = 20) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.max(parseInt(query.limit, 10) || defaultLimit, 1);
  return { page, limit, offset: (page - 1) * limit };
};

