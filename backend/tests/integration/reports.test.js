import request from 'supertest';
import { createTestApp } from '../utils/testApp.js';
import {
  createTestUser,
  createTestAdmin,
  createTestVerifier,
  getAuthHeader,
  seedTestData
} from '../utils/testHelpers.js';
import User from '../../src/models/User.js';
import CountryStats from '../../src/models/CountryStats.js';

describe('Reports API Integration Tests', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('GET /api/reports/overview', () => {
    it('should generate overview report when authenticated as admin', async () => {
      const admin = await createTestAdmin();
      const authHeader = getAuthHeader(admin);
      await seedTestData({ submissions: 5 });

      const response = await request(app)
        .get('/api/reports/overview')
        .set('Authorization', authHeader)
        .expect(200);

      expect(response.body).toHaveProperty('summary');
      expect(response.body.summary).toHaveProperty('totalSubmissions');
      expect(response.body.summary).toHaveProperty('approvedSubmissions');
      expect(response.body.summary).toHaveProperty('rejectedSubmissions');
      expect(response.body.summary).toHaveProperty('pendingSubmissions');
      expect(response.body.summary).toHaveProperty('newUsers');
    });

    it('should generate overview report when authenticated as verifier', async () => {
      const verifier = await createTestVerifier();
      const authHeader = getAuthHeader(verifier);
      await seedTestData({ submissions: 3 });

      const response = await request(app)
        .get('/api/reports/overview')
        .set('Authorization', authHeader)
        .expect(200);

      expect(response.body).toHaveProperty('summary');
      expect(response.body.summary).toHaveProperty('totalSubmissions');
    });

    it('should filter overview report by country', async () => {
      const admin = await createTestAdmin();
      const authHeader = getAuthHeader(admin);
      await seedTestData({ submissions: 4, countries: ['Ghana', 'Nigeria'] });

      const response = await request(app)
        .get('/api/reports/overview?country=Ghana')
        .set('Authorization', authHeader)
        .expect(200);

      expect(response.body).toHaveProperty('summary');
      expect(response.body.summary).toHaveProperty('totalSubmissions');
    });

    it('should return 403 when accessed by contributor', async () => {
      const contributor = await createTestUser({ role: 'contributor' });
      const authHeader = getAuthHeader(contributor);

      const response = await request(app)
        .get('/api/reports/overview')
        .set('Authorization', authHeader)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/reports/overview')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/reports/country/:country', () => {
    it('should generate country report when authenticated as admin', async () => {
      const admin = await createTestAdmin();
      const authHeader = getAuthHeader(admin);
      
      // Seed CountryStats since the controller searches for it and throws 404 if not found
      const countryGH = new CountryStats({
        countryCode: 'GH',
        countryName: 'Ghana'
      });
      await countryGH.save();

      await seedTestData({ submissions: 5 });

      const response = await request(app)
        .get('/api/reports/country/GH')
        .set('Authorization', authHeader)
        .expect(200);

      expect(response.body).toHaveProperty('summary');
      expect(response.body.summary).toHaveProperty('totalSubmissions');
      expect(response.body.summary).toHaveProperty('approvedSubmissions');
      expect(response.body.summary).toHaveProperty('contributors');
      expect(response.body.summary).toHaveProperty('verifiers');
    });

    it('should return 403 when accessed by contributor', async () => {
      const contributor = await createTestUser({ role: 'contributor' });
      const authHeader = getAuthHeader(contributor);

      await request(app)
        .get('/api/reports/country/GH')
        .set('Authorization', authHeader)
        .expect(403);
    });
  });

  describe('GET /api/reports/user/:userId', () => {
    it('should generate user report when authenticated as admin', async () => {
      const admin = await createTestAdmin();
      const authHeader = getAuthHeader(admin);
      const user = await createTestUser();

      const response = await request(app)
        .get(`/api/reports/user/${user._id}`)
        .set('Authorization', authHeader)
        .expect(200);

      expect(response.body).toHaveProperty('summary');
      expect(response.body.summary).toHaveProperty('totalSubmissions');
      expect(response.body.summary).toHaveProperty('approvedSubmissions');
      expect(response.body).toHaveProperty('breakdown');
      expect(response.body.breakdown).toHaveProperty('byCategory');
      expect(response.body.breakdown).toHaveProperty('timeline');
    });

    it('should return 404 for a non-existent user ID', async () => {
      const admin = await createTestAdmin();
      const authHeader = getAuthHeader(admin);
      const fakeId = '507f1f77bcf86cd799439011';

      await request(app)
        .get(`/api/reports/user/${fakeId}`)
        .set('Authorization', authHeader)
        .expect(404);
    });

    it('should return 403 when accessed by contributor', async () => {
      const contributor = await createTestUser({ role: 'contributor' });
      const authHeader = getAuthHeader(contributor);
      const user = await createTestUser();

      await request(app)
        .get(`/api/reports/user/${user._id}`)
        .set('Authorization', authHeader)
        .expect(403);
    });
  });
});
