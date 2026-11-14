import config from '../config/config.js';
import { sequelize } from '../config/database.js';
import User from '../models/User.js';
import Submission from '../models/Submission.js';

/**
 * Earned-badge rules.
 *
 * Each rule has a stable `id`, the `name`/`icon` stored on the user, and an
 * `earned(stats)` predicate. `stats` is what loadStats() returns:
 *   points              - the user's current points
 *   submissions         - references the user has submitted
 *   credibleSubmissions - of those, approved and rated "credible"
 *   reviews             - submissions the user has verified (approved/rejected)
 *
 * To add a badge, add a rule here. Badges are never revoked.
 */
export const BADGE_RULES = [
  {
    id: 'first-steps',
    name: 'First Steps',
    icon: '🎯',
    description: 'Submitted your first reference',
    earned: (stats) => stats.submissions >= 1
  },
  {
    id: 'contributor',
    name: 'Contributor',
    icon: '📚',
    description: 'Submitted 10 references',
    earned: (stats) => stats.submissions >= 10
  },
  {
    id: 'credible-source',
    name: 'Credible Source',
    icon: '⭐',
    description: 'Had 5 submissions approved as credible',
    earned: (stats) => stats.credibleSubmissions >= 5
  },
  {
    id: 'guardian',
    name: 'Guardian',
    icon: '🛡️',
    description: 'Reviewed 10 submissions',
    earned: (stats) => stats.reviews >= 10
  },
  {
    id: 'expert',
    name: 'Expert',
    icon: '🎓',
    description: 'Reached 500 points',
    earned: (stats) => stats.points >= 500
  },
  {
    id: 'top-contributor',
    name: 'Top Contributor',
    icon: '🏆',
    description: 'Reached 1000 points',
    earned: (stats) => stats.points >= 1000
  }
];

const loadStats = async (user, transaction) => {
  const [submissions, credibleSubmissions, reviews] = await Promise.all([
    Submission.count({ where: { submitter: user.id }, transaction }),
    Submission.count({
      where: { submitter: user.id, status: 'approved', credibility: 'credible' },
      transaction
    }),
    Submission.count({ where: { verifier: user.id }, transaction })
  ]);

  return { points: user.points, submissions, credibleSubmissions, reviews };
};

/** Rules the user qualifies for but does not hold yet (matched by id or name). */
export const findNewBadges = (stats, currentBadges = [], rules = BADGE_RULES) => {
  const heldIds = new Set(currentBadges.map((badge) => badge.id).filter(Boolean));
  const heldNames = new Set(currentBadges.map((badge) => badge.name));

  return rules
    .filter((rule) => !heldIds.has(rule.id) && !heldNames.has(rule.name) && rule.earned(stats))
    .map(({ id, name, icon }) => ({ id, name, icon }));
};

// SQLite (tests) has one connection and no row locks, so overlapping
// transactions fail. Run awards one at a time there instead.
let sqliteQueue = Promise.resolve();
const oneAtATime = (task) => {
  if (config.db.dialect !== 'sqlite') return task();
  const result = sqliteQueue.then(task);
  sqliteQueue = result.catch(() => {});
  return result;
};

/**
 * Grant every badge the user has earned and does not already hold.
 *
 * Runs in a transaction with a row lock on the user (SELECT ... FOR UPDATE on
 * MariaDB), so two requests finishing at the same time cannot both append the
 * same badge.
 *
 * @param {string} userId
 * @returns {Promise<Array<{id: string, name: string, icon: string}>>} badges granted by this call
 */
export const awardEarnedBadges = async (userId) => {
  if (!userId) return [];

  return oneAtATime(() => sequelize.transaction(async (transaction) => {
    const user = await User.findByPk(userId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!user) return [];

    const stats = await loadStats(user, transaction);
    const newBadges = findNewBadges(stats, user.badges);
    if (newBadges.length === 0) return [];

    // Reassign (not push): see jsonField in models/helpers.js.
    // The User beforeSave hook stamps earnedAt.
    user.badges = [...user.badges, ...newBadges];
    await user.save({ transaction });

    return newBadges;
  }));
};

/**
 * Controller-friendly wrapper: a badge failure must never fail the request
 * that triggered it.
 */
export const awardEarnedBadgesSafely = async (userId) => {
  try {
    return await awardEarnedBadges(userId);
  } catch (error) {
    console.error(`Badge awarding failed for user ${userId}:`, error);
    return [];
  }
};
