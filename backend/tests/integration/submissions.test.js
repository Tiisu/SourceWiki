import request from 'supertest';
import { createTestApp } from '../utils/testApp.js';
import {
  createTestUser,
  createTestSubmission,
  createTestAdmin,
  createTestVerifier,
  getAuthHeader,
  seedTestData
} from '../utils/testHelpers.js';
import Submission from '../../src/models/Submission.js';

describe('Submissions API Integration Tests', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('POST /api/submissions', () => {
    it('should create a new submission when authenticated', async () => {
      const user = await createTestUser();
      const authHeader = getAuthHeader(user);

      const submissionData = {
        url: 'https://example.com/article',
        title: 'Test Article',
        publisher: 'Test Publisher',
        country: 'Ghana',
        category: 'secondary'
      };

      const response = await request(app)
        .post('/api/submissions')
        .set('Authorization', authHeader)
        .send(submissionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.submission.url).toBe(submissionData.url);
      expect(response.body.submission.title).toBe(submissionData.title);
      expect(response.body.submission.status).toBe('pending');
      expect(response.body.submission.submitter._id).toBe(user._id.toString());
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .post('/api/submissions')
        .send({
          url: 'https://example.com/article',
          title: 'Test Article',
          publisher: 'Test Publisher',
          country: 'Ghana',
          category: 'secondary'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for missing required fields', async () => {
      const user = await createTestUser();
      const authHeader = getAuthHeader(user);

      const response = await request(app)
        .post('/api/submissions')
        .set('Authorization', authHeader)
        .send({
          url: 'https://example.com/article'
          // Missing title, publisher, country, category
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid category', async () => {
      const user = await createTestUser();
      const authHeader = getAuthHeader(user);

      const response = await request(app)
        .post('/api/submissions')
        .set('Authorization', authHeader)
        .send({
          url: 'https://example.com/article',
          title: 'Test Article',
          publisher: 'Test Publisher',
          country: 'Ghana',
          category: 'invalid-category'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/submissions', () => {
    it('should get all submissions (public)', async () => {
      const { submissions } = await seedTestData({ submissions: 3 });

      const response = await request(app)
        .get('/api/submissions')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('submissions');
      expect(response.body.submissions.length).toBeGreaterThanOrEqual(3);
    });

    it('should filter submissions by country', async () => {
      await seedTestData({ submissions: 5 });
      const ghanaSubmission = await createTestSubmission({ country: 'Ghana' });

      const response = await request(app)
        .get('/api/submissions?country=Ghana')
        .expect(200);

      expect(response.body.success).toBe(true);
      const ghanaSubmissions = response.body.submissions.filter(
        s => s.country === 'Ghana'
      );
      expect(ghanaSubmissions.length).toBeGreaterThan(0);
    });

    it('should filter submissions by status', async () => {
      await seedTestData({ submissions: 5 });
      const approvedSubmission = await createTestSubmission({
        status: 'approved',
        credibility: 'credible'
      });

      const response = await request(app)
        .get('/api/submissions?status=approved')
        .expect(200);

      expect(response.body.success).toBe(true);
      const approvedSubmissions = response.body.submissions.filter(
        s => s.status === 'approved'
      );
      expect(approvedSubmissions.length).toBeGreaterThan(0);
    });

    it('should paginate submissions', async () => {
      await seedTestData({ submissions: 10 });

      const response = await request(app)
        .get('/api/submissions?page=1&limit=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.submissions.length).toBeLessThanOrEqual(5);
      expect(response.body).toHaveProperty('page');
    });
  });

  describe('GET /api/submissions/:id', () => {
    it('should get a single submission by ID (public)', async () => {
      const submission = await createTestSubmission();

      const response = await request(app)
        .get(`/api/submissions/${submission._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.submission._id).toBe(submission._id.toString());
      expect(response.body.submission.title).toBe(submission.title);
    });

    it('should return 404 for non-existent submission', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/submissions/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/submissions/my/submissions', () => {
    it('should get current user\'s submissions', async () => {
      const user = await createTestUser();
      const authHeader = getAuthHeader(user);

      // Create submissions for this user
      await createTestSubmission({}, user);
      await createTestSubmission({}, user);

      // Create submission for another user
      const otherUser = await createTestUser();
      await createTestSubmission({}, otherUser);

      const response = await request(app)
        .get('/api/submissions/my/submissions')
        .set('Authorization', authHeader)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.submissions.length).toBe(2);
      response.body.submissions.forEach(submission => {
        // submitter is not populated in getMySubmissions, so it's just the ObjectId
        expect(submission.submitter.toString()).toBe(user._id.toString());
      });
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/submissions/my/submissions')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/submissions/:id', () => {
    it('should update submission when user is the submitter', async () => {
      const user = await createTestUser();
      const authHeader = getAuthHeader(user);
      const submission = await createTestSubmission({}, user);

      const response = await request(app)
        .put(`/api/submissions/${submission._id}`)
        .set('Authorization', authHeader)
        .send({
          title: 'Updated Title',
          publisher: 'Updated Publisher'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.submission.title).toBe('Updated Title');
      expect(response.body.submission.publisher).toBe('Updated Publisher');
    });

    it('should return 403 when user is not the submitter', async () => {
      const owner = await createTestUser();
      const otherUser = await createTestUser();
      const authHeader = getAuthHeader(otherUser);
      const submission = await createTestSubmission({}, owner);

      const response = await request(app)
        .put(`/api/submissions/${submission._id}`)
        .set('Authorization', authHeader)
        .send({
          title: 'Updated Title'
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 when not authenticated', async () => {
      const submission = await createTestSubmission();

      const response = await request(app)
        .put(`/api/submissions/${submission._id}`)
        .send({
          title: 'Updated Title'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/submissions/:id', () => {
    it('should delete submission when user is the submitter', async () => {
      const user = await createTestUser();
      const authHeader = getAuthHeader(user);
      const submission = await createTestSubmission({}, user);

      const response = await request(app)
        .delete(`/api/submissions/${submission._id}`)
        .set('Authorization', authHeader)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify submission is deleted
      const deletedSubmission = await Submission.findById(submission._id);
      expect(deletedSubmission).toBeNull();
    });

    it('should return 403 when user is not the submitter', async () => {
      const owner = await createTestUser();
      const otherUser = await createTestUser();
      const authHeader = getAuthHeader(otherUser);
      const submission = await createTestSubmission({}, owner);

      const response = await request(app)
        .delete(`/api/submissions/${submission._id}`)
        .set('Authorization', authHeader)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/submissions/:id/verify', () => {
    it('should verify submission when user is verifier or admin', async () => {
      const verifier = await createTestVerifier();
      const authHeader = getAuthHeader(verifier);
      const submission = await createTestSubmission({ status: 'pending' });

      const response = await request(app)
        .put(`/api/submissions/${submission._id}/verify`)
        .set('Authorization', authHeader)
        .send({
          status: 'approved',
          credibility: 'credible',
          verifierNotes: 'This is a credible source'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.submission.status).toBe('approved');
      expect(response.body.submission.credibility).toBe('credible');
      expect(response.body.submission.verifierNotes).toBe('This is a credible source');
      expect(response.body.submission.verifier._id).toBe(verifier._id.toString());
    });

    it('should return 403 when user is not verifier or admin', async () => {
      const contributor = await createTestUser({ role: 'contributor' });
      const authHeader = getAuthHeader(contributor);
      const submission = await createTestSubmission();

      const response = await request(app)
        .put(`/api/submissions/${submission._id}/verify`)
        .set('Authorization', authHeader)
        .send({
          status: 'approved',
          credibility: 'credible'
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 when not authenticated', async () => {
      const submission = await createTestSubmission();

      const response = await request(app)
        .put(`/api/submissions/${submission._id}/verify`)
        .send({
          status: 'approved',
          credibility: 'credible'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/submissions/pending/country', () => {
    it('should get pending submissions for verifier\'s country', async () => {
      const verifier = await createTestVerifier({ country: 'Ghana' });
      const authHeader = getAuthHeader(verifier);

      // Create pending submissions in Ghana
      await createTestSubmission({ country: 'Ghana', status: 'pending' });
      await createTestSubmission({ country: 'Ghana', status: 'pending' });

      // Create submission in different country
      await createTestSubmission({ country: 'Nigeria', status: 'pending' });

      const response = await request(app)
        .get('/api/submissions/pending/country')
        .set('Authorization', authHeader)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.submissions.length).toBe(2);
      response.body.submissions.forEach(submission => {
        expect(submission.country).toBe('Ghana');
        expect(submission.status).toBe('pending');
      });
    });

    it('should return 403 when user is not verifier or admin', async () => {
      const contributor = await createTestUser();
      const authHeader = getAuthHeader(contributor);

      const response = await request(app)
        .get('/api/submissions/pending/country')
        .set('Authorization', authHeader)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/submissions/stats', () => {
    it('should get submission statistics', async () => {
      await seedTestData({ submissions: 10 });

      const response = await request(app)
        .get('/api/submissions/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('stats');
      expect(response.body.stats).toHaveProperty('total');
      expect(response.body.stats).toHaveProperty('approved');
      expect(response.body.stats).toHaveProperty('pending');
      expect(response.body.stats).toHaveProperty('rejected');
      expect(response.body).toHaveProperty('topCountries');
    });
  });
});

