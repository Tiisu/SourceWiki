import { fn, col, literal } from 'sequelize';

/** SUM(CASE WHEN column = value THEN 1 ELSE 0 END) AS value */
export const countWhen = (column, value, alias = value) =>
  [fn('SUM', literal(`CASE WHEN ${column} = '${value}' THEN 1 ELSE 0 END`)), alias];

/** total / approved / pending / rejected counts, as numbers. */
export const STATUS_COUNT_ATTRIBUTES = [
  [fn('COUNT', col('id')), 'total'],
  countWhen('status', 'approved'),
  countWhen('status', 'pending'),
  countWhen('status', 'rejected')
];

export const toStatusCounts = (row) => ({
  total: Number(row?.total) || 0,
  approved: Number(row?.approved) || 0,
  pending: Number(row?.pending) || 0,
  rejected: Number(row?.rejected) || 0
});

/**
 * GROUP BY `column` with a count, returned in the Mongo aggregate shape
 * [{ _id: value, count }], sorted by count (desc) unless `order` is false.
 */
export const countBy = async (model, column, { where = {}, limit, order = true } = {}) => {
  const rows = await model.findAll({
    where,
    attributes: [column, [fn('COUNT', col('id')), 'count']],
    group: [column],
    ...(order && { order: [[literal('count'), 'DESC']] }),
    ...(limit && { limit }),
    raw: true
  });
  return rows.map((row) => ({ _id: row[column], count: Number(row.count) }));
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** 'YYYY-MM-DD' (UTC) for a Date. */
export const dayKey = (date) => new Date(date).toISOString().slice(0, 10);

/**
 * Summarise how long reviewed submissions took to verify, in days.
 * Done in JS so it works the same on every SQL dialect.
 */
export const verificationSpeed = (submissions) => {
  const days = submissions
    .filter((s) => s.verifiedAt && ['approved', 'rejected'].includes(s.status))
    .map((s) => (new Date(s.verifiedAt) - new Date(s.createdAt)) / DAY_MS);

  if (days.length === 0) return null;
  return {
    avgDays: days.reduce((a, b) => a + b, 0) / days.length,
    minDays: Math.min(...days),
    maxDays: Math.max(...days),
    total: days.length
  };
};
