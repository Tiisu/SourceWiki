import request from 'supertest';
import { createTestApp } from '../utils/testApp.js';
import {
  createTestUser,
  createTestAdmin,
  createTestSubmission,
  getAuthHeader,
  seedTestData
} from '../utils/testHelpers.js';
import User from '../../src/models/User.js';
import Submission from '../../src/models/Submission.js';
import CountryStats from '../../src/models/CountryStats.js';

describe('Admin API Integration Tests', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('Access Control', () => {
    it('should return 403 when a non-admin verifier tries to access admin routes', async () => {
      const verifier = await createTestUser({ role: 'verifier' });
      const authHeader = getAuthHeader(verifier);

      await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', authHeader)
        .expect(403);
    });

    it('should return 403 when a contributor tries to access admin routes', async () => {
      const contributor = await createTestUser({ role: 'contributor' });
      const authHeader = getAuthHeader(contributor);

      await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', authHeader)
        .expect(403);
    });

    it('should return 401 when unauthenticated', async () => {
      await request(app)
        .get('/api/admin/dashboard')
        .expect(401);
    });
  });

  describe('GET /api/admin/dashboard', () => {
    it('should get admin dashboard statistics', async () => {
      const admin = await createTestAdmin();
      const authHeader = getAuthHeader(admin);
      await seedTestData({ submissions: 5 });

      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', authHeader)
        .expect(200);

      expect(response.body).toHaveProperty('globalStats');
      expect(response.body).toHaveProperty('charts');
      expect(response.body).toHaveProperty('recentActivity');
    });
  });

  describe('GET /api/admin/analytics', () => {
    it('should get analytics data', async () => {
      const admin = await createTestAdmin();
      const authHeader = getAuthHeader(admin);
      await seedTestData({ submissions: 2 });

      const response = await request(app)
        .get('/api/admin/analytics?period=7d')
        .set('Authorization', authHeader)
        .expect(200);

      expect(response.body).toHaveProperty('trends');
      expect(response.body).toHaveProperty('verificationSpeed');
    });
  });

  describe('GET /api/admin/users', () => {
    it('should list all users with pagination and stats', async () => {
      const admin = await createTestAdmin();
      const authHeader = getAuthHeader(admin);
      await seedTestData({ users: 5 });

      const response = await request(app)
        .get('/api/admin/users?page=1&limit=5')
        .set('Authorization', authHeader)
        .expect(200);

      expect(response.body.users.length).toBeGreaterThan(0);
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.users[0]).toHaveProperty('submissionStats');
    });

    it('should filter users by role and search', async () => {
      const admin = await createTestAdmin();
      const authHeader = getAuthHeader(admin);
      const testUser = await createTestUser({ username: 'specialadminuser', role: 'contributor' });

      const response = await request(app)
        .get('/api/admin/users?role=contributor&search=specialadminuser')
        .set('Authorization', authHeader)
        .expect(200);

      expect(response.body.users.some(u => u.username === 'specialadminuser')).toBe(true);
    });
  });

  describe('PUT /api/admin/users/:id', () => {
    it('should update user role and details', async () => {
      const admin = await createTestAdmin();
      const authHeader = getAuthHeader(admin);
      
      // Use 2-letter country code so getOrCreate doesn't fail Mongoose validation limit of 2 characters
      const user = await createTestUser({ role: 'contributor', country: 'GH' });

      // Ensure country stats exists for the logic
      const countryGH = new CountryStats({ countryCode: 'GH', countryName: 'Ghana' });
      await countryGH.save();

      const response = await request(app)
        .put(`/api/admin/users/${user._id}`)
        .set('Authorization', authHeader)
        .send({
          role: 'verifier',
          points: 120
        })
        .expect(200);

      expect(response.body.user.role).toBe('verifier');
      expect(response.body.user.points).toBe(120);

      // Verify user is added to CountryStats verifiers
      const updatedCountry = await CountryStats.findOne({ countryCode: 'GH' });
      expect(updatedCountry.verifiers.some(v => v.userId.toString() === user._id.toString())).toBe(true);
    });

    it('should return 400 when admin tries to update their own account', async () => {
      const admin = await createTestAdmin();
      const authHeader = getAuthHeader(admin);

      await request(app)
        .put(`/api/admin/users/${admin._id}`)
        .set('Authorization', authHeader)
        .send({
          role: 'contributor'
        })
        .expect(400);
    });
  });

  describe('DELETE /api/admin/users/:id', () => {
    it('should soft delete user by setting isActive to false', async () => {
      const admin = await createTestAdmin();
      const authHeader = getAuthHeader(admin);
      const user = await createTestUser();

      const response = await request(app)
        .delete(`/api/admin/users/${user._id}`)
        .set('Authorization', authHeader)
        .expect(200);

      expect(response.body.user.isActive).toBe(false);
      expect(response.body.user.email).toContain('deleted_');

      const dbUser = await User.findById(user._id);
      expect(dbUser.isActive).toBe(false);
    });

    it('should return 400 when admin tries to delete their own account', async () => {
      const admin = await createTestAdmin();
      const authHeader = getAuthHeader(admin);

      await request(app)
        .delete(`/api/admin/users/${admin._id}`)
        .set('Authorization', authHeader)
        .expect(400);
    });
  });

  describe('GET /api/admin/submissions', () => {
    it('should list submissions for admin', async () => {
      const admin = await createTestAdmin();
      const authHeader = getAuthHeader(admin);
      await seedTestData({ submissions: 3 });

      const response = await request(app)
        .get('/api/admin/submissions')
        .set('Authorization', authHeader)
        .expect(200);

      expect(response.body.submissions.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('PUT /api/admin/submissions/:id/override', () => {
    it('should override a submission status and notes', async () => {
      const admin = await createTestAdmin();
      const authHeader = getAuthHeader(admin);
      const submission = await createTestSubmission({ status: 'pending' });

      const response = await request(app)
        .put(`/api/admin/submissions/${submission._id}/override`)
        .set('Authorization', authHeader)
        .send({
          status: 'approved',
          credibility: 'credible', // Required when status is 'approved'
          adminNotes: 'Overridden by administrator',
          reason: 'Valid source'
        })
        .expect(200);

      expect(response.body.submission.status).toBe('approved');
      expect(response.body.submission.verifierNotes).toBe('Overridden by administrator');
      expect(response.body.submission.verifier.toString()).toBe(admin._id.toString());
    });
  });

  describe('DELETE /api/admin/submissions/:id', () => {
    it('should delete a submission', async () => {
      const admin = await createTestAdmin();
      const authHeader = getAuthHeader(admin);
      const submission = await createTestSubmission();

      await request(app)
        .delete(`/api/admin/submissions/${submission._id}`)
        .set('Authorization', authHeader)
        .expect(200);

      const dbSubmission = await Submission.findById(submission._id);
      expect(dbSubmission).toBeNull();
    });
  });
});
