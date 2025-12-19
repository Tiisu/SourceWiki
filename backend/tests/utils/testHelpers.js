import User from '../../src/models/User.js';
import Submission from '../../src/models/Submission.js';
import CountryStats from '../../src/models/CountryStats.js';
import { generateAccessToken, generateRefreshToken } from '../../src/utils/jwt.js';

/**
 * Create a test user with default or custom data
 * @param {Object} userData - User data to override defaults
 * @returns {Promise<Object>} Created user object
 */
export const createTestUser = async (userData = {}) => {
  const defaultUser = {
    username: `testuser_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: 'password123',
    country: 'Ghana',
    role: 'contributor',
    points: 0,
    isActive: true,
    ...userData
  };

  const user = new User(defaultUser);
  await user.save();
  return user;
};

/**
 * Create a test admin user
 * @param {Object} userData - User data to override defaults
 * @returns {Promise<Object>} Created admin user
 */
export const createTestAdmin = async (userData = {}) => {
  return createTestUser({
    role: 'admin',
    ...userData
  });
};

/**
 * Create a test verifier user
 * @param {Object} userData - User data to override defaults
 * @returns {Promise<Object>} Created verifier user
 */
export const createTestVerifier = async (userData = {}) => {
  return createTestUser({
    role: 'verifier',
    ...userData
  });
};

/**
 * Create a test submission with default or custom data
 * @param {Object} submissionData - Submission data to override defaults
 * @param {Object} submitter - User who submitted (will be created if not provided)
 * @returns {Promise<Object>} Created submission object
 */
export const createTestSubmission = async (submissionData = {}, submitter = null) => {
  if (!submitter) {
    submitter = await createTestUser();
  }

  const defaultSubmission = {
    url: 'https://example.com/article',
    title: 'Test Article',
    publisher: 'Test Publisher',
    country: 'Ghana',
    category: 'secondary',
    status: 'pending',
    submitter: submitter._id,
    ...submissionData
  };

  const submission = new Submission(defaultSubmission);
  await submission.save();
  return submission;
};

/**
 * Generate a JWT token for a user
 * @param {Object} user - User object
 * @param {String} type - Token type: 'access' or 'refresh'
 * @returns {String} JWT token
 */
export const generateToken = (user, type = 'access') => {
  if (type === 'access') {
    return generateAccessToken(user._id);
  } else {
    return generateRefreshToken(user._id);
  }
};

/**
 * Create authorization header for authenticated requests
 * @param {Object} user - User object
 * @returns {String} Authorization header value
 */
export const getAuthHeader = (user) => {
  const token = generateToken(user, 'access');
  return `Bearer ${token}`;
};

/**
 * Seed database with test data
 * @param {Object} options - Seeding options
 * @returns {Promise<Object>} Seeded data (users, submissions, etc.)
 */
export const seedTestData = async (options = {}) => {
  const {
    users = 3,
    admins = 1,
    verifiers = 2,
    submissions = 5,
    countries = ['Ghana', 'Nigeria', 'Kenya']
  } = options;

  const seededData = {
    users: [],
    admins: [],
    verifiers: [],
    submissions: [],
    countries
  };

  // Create regular users
  for (let i = 0; i < users; i++) {
    const user = await createTestUser({
      username: `user${i + 1}`,
      email: `user${i + 1}@test.com`,
      country: countries[i % countries.length],
      points: (i + 1) * 10
    });
    seededData.users.push(user);
  }

  // Create admin users
  for (let i = 0; i < admins; i++) {
    const admin = await createTestAdmin({
      username: `admin${i + 1}`,
      email: `admin${i + 1}@test.com`,
      country: countries[i % countries.length]
    });
    seededData.admins.push(admin);
  }

  // Create verifier users
  for (let i = 0; i < verifiers; i++) {
    const verifier = await createTestVerifier({
      username: `verifier${i + 1}`,
      email: `verifier${i + 1}@test.com`,
      country: countries[i % countries.length]
    });
    seededData.verifiers.push(verifier);
  }

  // Create submissions
  for (let i = 0; i < submissions; i++) {
    const submitter = seededData.users[i % seededData.users.length];
    const submission = await createTestSubmission({
      url: `https://example.com/article${i + 1}`,
      title: `Test Article ${i + 1}`,
      publisher: `Publisher ${i + 1}`,
      country: countries[i % countries.length],
      category: i % 2 === 0 ? 'primary' : 'secondary',
      status: i < 2 ? 'approved' : i < 4 ? 'pending' : 'rejected',
      ...(i < 2 && {
        verifier: seededData.verifiers[0]._id,
        verifiedAt: new Date(),
        credibility: 'credible'
      })
    }, submitter);
    seededData.submissions.push(submission);
  }

  return seededData;
};

/**
 * Clean up all test data from database
 * @returns {Promise<void>}
 */
export const cleanupTestData = async () => {
  await User.deleteMany({});
  await Submission.deleteMany({});
  await CountryStats.deleteMany({});
};

/**
 * Wait for a specified amount of time (useful for testing async operations)
 * @param {Number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
export const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

