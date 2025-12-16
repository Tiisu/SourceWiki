import request from 'supertest';
import { createTestApp } from '../utils/testApp.js';
import {
  createTestUser,
  createTestAdmin,
  getAuthHeader,
  seedTestData
} from '../utils/testHelpers.js';

describe('Users API Integration Tests', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('GET /api/users/leaderboard', () => {
    it('should get global leaderboard (public)', async () => {
      await seedTestData({ users: 5 });

      const response = await request(app)
        .get('/api/users/leaderboard')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('users');
      expect(Array.isArray(response.body.users)).toBe(true);
    });

    it('should limit leaderboard results', async () => {
      await seedTestData({ users: 10 });

      const response = await request(app)
        .get('/api/users/leaderboard?limit=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.users.length).toBeLessThanOrEqual(5);
    });

    it('should sort leaderboard by points descending', async () => {
      await seedTestData({ users: 5 });

      const response = await request(app)
        .get('/api/users/leaderboard')
        .expect(200);

      expect(response.body.success).toBe(true);
      const users = response.body.users;
      
      if (users.length > 1) {
        for (let i = 0; i < users.length - 1; i++) {
          expect(users[i].points).toBeGreaterThanOrEqual(users[i + 1].points);
        }
      }
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get user profile by ID (public)', async () => {
      const user = await createTestUser({
        username: 'profileuser',
        points: 100
      });

      const response = await request(app)
        .get(`/api/users/${user._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      // getPublicProfile() returns 'id' not '_id'
      expect(response.body.user.id).toBe(user._id.toString());
      expect(response.body.user.username).toBe('profileuser');
      expect(response.body.user.points).toBe(100);
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body).toHaveProperty('stats');
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/users/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/users (Admin only)', () => {
    it('should get all users when authenticated as admin', async () => {
      const admin = await createTestAdmin();
      const authHeader = getAuthHeader(admin);
      await seedTestData({ users: 3 });

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', authHeader)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.users.length).toBeGreaterThanOrEqual(3);
    });

    it('should return 403 when user is not admin', async () => {
      const user = await createTestUser();
      const authHeader = getAuthHeader(user);

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', authHeader)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/users/:id/role (Admin only)', () => {
    it('should update user role when authenticated as admin', async () => {
      const admin = await createTestAdmin();
      const authHeader = getAuthHeader(admin);
      const user = await createTestUser({ role: 'contributor' });

      const response = await request(app)
        .put(`/api/users/${user._id}/role`)
        .set('Authorization', authHeader)
        .send({ role: 'verifier' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.role).toBe('verifier');
    });

    it('should return 400 for invalid role', async () => {
      const admin = await createTestAdmin();
      const authHeader = getAuthHeader(admin);
      const user = await createTestUser();

      const response = await request(app)
        .put(`/api/users/${user._id}/role`)
        .set('Authorization', authHeader)
        .send({ role: 'invalid-role' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 when user is not admin', async () => {
      const user = await createTestUser();
      const authHeader = getAuthHeader(user);
      const targetUser = await createTestUser();

      const response = await request(app)
        .put(`/api/users/${targetUser._id}/role`)
        .set('Authorization', authHeader)
        .send({ role: 'verifier' })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/users/:id/badge (Admin only)', () => {
    it('should award badge to user when authenticated as admin', async () => {
      const admin = await createTestAdmin();
      const authHeader = getAuthHeader(admin);
      const user = await createTestUser();

      const response = await request(app)
        .post(`/api/users/${user._id}/badge`)
        .set('Authorization', authHeader)
        .send({
          name: 'First Submission',
          icon: '🎉'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.badges.length).toBeGreaterThan(0);
    });

    it('should return 403 when user is not admin', async () => {
      const user = await createTestUser();
      const authHeader = getAuthHeader(user);
      const targetUser = await createTestUser();

      const response = await request(app)
        .post(`/api/users/${targetUser._id}/badge`)
        .set('Authorization', authHeader)
        .send({
          name: 'First Submission',
          icon: '🎉'
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/users/:id/deactivate (Admin only)', () => {
    it('should deactivate user when authenticated as admin', async () => {
      const admin = await createTestAdmin();
      const authHeader = getAuthHeader(admin);
      const user = await createTestUser({ isActive: true });

      const response = await request(app)
        .put(`/api/users/${user._id}/deactivate`)
        .set('Authorization', authHeader)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.isActive).toBe(false);
    });

    it('should return 403 when user is not admin', async () => {
      const user = await createTestUser();
      const authHeader = getAuthHeader(user);
      const targetUser = await createTestUser();

      const response = await request(app)
        .put(`/api/users/${targetUser._id}/deactivate`)
        .set('Authorization', authHeader)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/users/:id/activate (Admin only)', () => {
    it('should activate user when authenticated as admin', async () => {
      const admin = await createTestAdmin();
      const authHeader = getAuthHeader(admin);
      const user = await createTestUser({ isActive: false });

      const response = await request(app)
        .put(`/api/users/${user._id}/activate`)
        .set('Authorization', authHeader)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.isActive).toBe(true);
    });

    it('should return 403 when user is not admin', async () => {
      const user = await createTestUser();
      const authHeader = getAuthHeader(user);
      const targetUser = await createTestUser({ isActive: false });

      const response = await request(app)
        .put(`/api/users/${targetUser._id}/activate`)
        .set('Authorization', authHeader)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});

