import request from 'supertest';
import { createTestApp } from '../utils/testApp.js';
import {
  createTestUser,
  createTestAdmin,
  createTestVerifier,
  getAuthHeader,
  seedTestData
} from '../utils/testHelpers.js';
import CountryStats from '../../src/models/CountryStats.js';
import User from '../../src/models/User.js';

describe('Country Management API Integration Tests', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  // Seed test country stats for public endpoint testing
  let countryGH;
  let countryNG;

  beforeEach(async () => {
    // Clear and seed test countries
    await CountryStats.deleteMany({});
    
    countryGH = new CountryStats({
      countryCode: 'GH',
      countryName: 'Ghana',
      statistics: { totalSubmissions: 5, verifiedSources: 2 }
    });
    await countryGH.save();

    countryNG = new CountryStats({
      countryCode: 'NG',
      countryName: 'Nigeria',
      statistics: { totalSubmissions: 3, verifiedSources: 1 }
    });
    await countryNG.save();
  });

  describe('GET /api/countries', () => {
    it('should list countries (public)', async () => {
      const response = await request(app)
        .get('/api/countries')
        .expect(200);

      expect(response.body.countries.length).toBe(2);
      expect(response.body).toHaveProperty('pagination');
    });

    it('should filter countries by search query', async () => {
      const response = await request(app)
        .get('/api/countries?search=Ghana')
        .expect(200);

      expect(response.body.countries.length).toBe(1);
      expect(response.body.countries[0].countryCode).toBe('GH');
    });

    it('should sort countries by totalSubmissions descending', async () => {
      const response = await request(app)
        .get('/api/countries?sortBy=submissions')
        .expect(200);

      expect(response.body.countries[0].countryCode).toBe('GH'); // 5 > 3
    });
  });

  describe('GET /api/countries/:code/stats', () => {
    it('should fetch statistics for a specific country (public)', async () => {
      const response = await request(app)
        .get('/api/countries/GH/stats')
        .expect(200);

      expect(response.body.countryName).toBe('Ghana');
      expect(response.body.statistics.totalSubmissions).toBe(5);
    });

    it('should return 404 for a non-existent country code', async () => {
      const response = await request(app)
        .get('/api/countries/XX/stats')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/countries/:code/submissions', () => {
    it('should fetch submissions for a specific country (public)', async () => {
      const response = await request(app)
        .get('/api/countries/GH/submissions')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.submissions)).toBe(true);
    });
  });

  describe('POST /api/countries (Admin only)', () => {
    it('should allow admin to create a new country record', async () => {
      const admin = await createTestAdmin();
      const authHeader = getAuthHeader(admin);

      const response = await request(app)
        .post('/api/countries')
        .set('Authorization', authHeader)
        .send({
          countryCode: 'KE',
          countryName: 'Kenya'
        })
        .expect(201);

      expect(response.body.country.countryCode).toBe('KE');
      expect(response.body.country.countryName).toBe('Kenya');
      
      const exists = await CountryStats.findOne({ countryCode: 'KE' });
      expect(exists).not.toBeNull();
    });

    it('should return 400 when country already exists', async () => {
      const admin = await createTestAdmin();
      const authHeader = getAuthHeader(admin);

      await request(app)
        .post('/api/countries')
        .set('Authorization', authHeader)
        .send({
          countryCode: 'GH',
          countryName: 'Ghana Duplicate'
        })
        .expect(400);
    });

    it('should return 403 when accessed by non-admin verifier', async () => {
      const verifier = await createTestVerifier();
      const authHeader = getAuthHeader(verifier);

      await request(app)
        .post('/api/countries')
        .set('Authorization', authHeader)
        .send({
          countryCode: 'KE',
          countryName: 'Kenya'
        })
        .expect(403);
    });
  });

  describe('PUT /api/countries/:code (Admin only)', () => {
    it('should allow admin to update country name', async () => {
      const admin = await createTestAdmin();
      const authHeader = getAuthHeader(admin);

      const response = await request(app)
        .put('/api/countries/GH')
        .set('Authorization', authHeader)
        .send({
          countryName: 'Ghana Updated'
        })
        .expect(200);

      expect(response.body.country.countryName).toBe('Ghana Updated');
    });

    it('should return 403 for non-admin user', async () => {
      const contributor = await createTestUser();
      const authHeader = getAuthHeader(contributor);

      await request(app)
        .put('/api/countries/GH')
        .set('Authorization', authHeader)
        .send({
          countryName: 'Ghana Updated'
        })
        .expect(403);
    });
  });

  describe('DELETE /api/countries/:code (Admin only)', () => {
    it('should allow admin to delete a country', async () => {
      const admin = await createTestAdmin();
      const authHeader = getAuthHeader(admin);

      await request(app)
        .delete('/api/countries/GH')
        .set('Authorization', authHeader)
        .expect(200);

      const exists = await CountryStats.findOne({ countryCode: 'GH' });
      expect(exists).toBeNull();
    });

    it('should return 403 for non-admin user', async () => {
      const contributor = await createTestUser();
      const authHeader = getAuthHeader(contributor);

      await request(app)
        .delete('/api/countries/GH')
        .set('Authorization', authHeader)
        .expect(403);
    });
  });

  describe('POST /api/countries/:code/update-stats (Admin only)', () => {
    it('should allow admin to trigger statistics recalculation', async () => {
      const admin = await createTestAdmin();
      const authHeader = getAuthHeader(admin);

      const response = await request(app)
        .post('/api/countries/GH/update-stats')
        .set('Authorization', authHeader)
        .expect(200);

      expect(response.body.message).toBe('Country statistics updated successfully');
    });
  });

  describe('POST /api/countries/:code/assign-verifier (Admin only)', () => {
    it('should assign a verifier and update user role if needed', async () => {
      const admin = await createTestAdmin();
      const authHeader = getAuthHeader(admin);
      const user = await createTestUser({ role: 'contributor' });

      const response = await request(app)
        .post('/api/countries/GH/assign-verifier')
        .set('Authorization', authHeader)
        .send({
          userId: user._id.toString(),
          specializations: ['Academic journals']
        })
        .expect(200);

      expect(response.body.message).toBe('Verifier assigned successfully');
      
      // Verify role is updated
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.role).toBe('verifier');

      // Verify verifier list in country stats
      const updatedCountry = await CountryStats.findOne({ countryCode: 'GH' });
      expect(updatedCountry.verifiers.some(v => v.userId.toString() === user._id.toString())).toBe(true);
    });

    it('should return 400 when user is already a verifier for this country', async () => {
      const admin = await createTestAdmin();
      const authHeader = getAuthHeader(admin);
      const verifier = await createTestVerifier();
      
      // Assign once
      await request(app)
        .post('/api/countries/GH/assign-verifier')
        .set('Authorization', authHeader)
        .send({ userId: verifier._id.toString() });

      // Assign twice
      const response = await request(app)
        .post('/api/countries/GH/assign-verifier')
        .set('Authorization', authHeader)
        .send({ userId: verifier._id.toString() })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/countries/:code/remove-verifier (Admin only)', () => {
    it('should remove a verifier from a country', async () => {
      const admin = await createTestAdmin();
      const authHeader = getAuthHeader(admin);
      const verifier = await createTestVerifier();

      // Assign first
      await request(app)
        .post('/api/countries/GH/assign-verifier')
        .set('Authorization', authHeader)
        .send({ userId: verifier._id.toString() });

      // Remove
      const response = await request(app)
        .post('/api/countries/GH/remove-verifier')
        .set('Authorization', authHeader)
        .send({ userId: verifier._id.toString() })
        .expect(200);

      expect(response.body.message).toBe('Verifier removed successfully');

      const updatedCountry = await CountryStats.findOne({ countryCode: 'GH' });
      expect(updatedCountry.verifiers.some(v => v.userId.toString() === verifier._id.toString())).toBe(false);
    });
  });
});
