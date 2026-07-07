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
import User from '../../src/models/User.js';

describe('Verification Workflow API Integration Tests', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('PUT /api/submissions/:id/verify', () => {
    it('should approve a pending submission with credibility rating and award points', async () => {
      const verifier = await createTestVerifier();
      const authHeader = getAuthHeader(verifier);
      const submitter = await createTestUser({ points: 10 });
      const submission = await createTestSubmission({ status: 'pending', submitter: submitter._id });

      const response = await request(app)
        .put(`/api/submissions/${submission._id}/verify`)
        .set('Authorization', authHeader)
        .send({
          status: 'approved',
          credibility: 'credible',
          verifierNotes: 'Verified to be credible.'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.submission.status).toBe('approved');
      expect(response.body.submission.credibility).toBe('credible');
      expect(response.body.submission.verifierNotes).toBe('Verified to be credible.');
      expect(response.body.submission.verifier._id).toBe(verifier._id.toString());

      // Verify submitter points: 10 + 25 = 35
      const updatedSubmitter = await User.findById(submitter._id);
      expect(updatedSubmitter.points).toBe(35);

      // Verify verifier points: 0 + 5 = 5
      const updatedVerifier = await User.findById(verifier._id);
      expect(updatedVerifier.points).toBe(5);
    });

    it('should reject a pending submission and award verifier points', async () => {
      const verifier = await createTestVerifier();
      const authHeader = getAuthHeader(verifier);
      const submitter = await createTestUser({ points: 10 });
      const submission = await createTestSubmission({ status: 'pending', submitter: submitter._id });

      const response = await request(app)
        .put(`/api/submissions/${submission._id}/verify`)
        .set('Authorization', authHeader)
        .send({
          status: 'rejected',
          verifierNotes: 'Rejected due to invalid links.'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.submission.status).toBe('rejected');
      expect(response.body.submission.verifierNotes).toBe('Rejected due to invalid links.');

      // Submitter points should remain same
      const updatedSubmitter = await User.findById(submitter._id);
      expect(updatedSubmitter.points).toBe(10);

      // Verifier points: 0 + 5 = 5
      const updatedVerifier = await User.findById(verifier._id);
      expect(updatedVerifier.points).toBe(5);
    });

    it('should return 400 when status is approved but credibility rating is missing', async () => {
      const verifier = await createTestVerifier();
      const authHeader = getAuthHeader(verifier);
      const submission = await createTestSubmission({ status: 'pending' });

      const response = await request(app)
        .put(`/api/submissions/${submission._id}/verify`)
        .set('Authorization', authHeader)
        .send({
          status: 'approved',
          verifierNotes: 'Approved.'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 when attempting to verify an already verified submission', async () => {
      const verifier = await createTestVerifier();
      const authHeader = getAuthHeader(verifier);
      const submission = await createTestSubmission({ status: 'approved', credibility: 'credible' });

      const response = await request(app)
        .put(`/api/submissions/${submission._id}/verify`)
        .set('Authorization', authHeader)
        .send({
          status: 'rejected',
          verifierNotes: 'Cannot reject approved.'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 when user does not have verifier or admin role', async () => {
      const contributor = await createTestUser({ role: 'contributor' });
      const authHeader = getAuthHeader(contributor);
      const submission = await createTestSubmission({ status: 'pending' });

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

    it('should return 404 when submission does not exist', async () => {
      const verifier = await createTestVerifier();
      const authHeader = getAuthHeader(verifier);
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .put(`/api/submissions/${fakeId}/verify`)
        .set('Authorization', authHeader)
        .send({
          status: 'approved',
          credibility: 'credible'
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/submissions/pending/country', () => {
    it('should get pending submissions for verifier\'s country only', async () => {
      const verifier = await createTestVerifier({ country: 'Ghana' });
      const authHeader = getAuthHeader(verifier);

      await createTestSubmission({ country: 'Ghana', status: 'pending' });
      await createTestSubmission({ country: 'Ghana', status: 'pending' });
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

    it('should get all pending submissions regardless of country for admin', async () => {
      const admin = await createTestAdmin({ country: 'Ghana' });
      const authHeader = getAuthHeader(admin);

      await createTestSubmission({ country: 'Ghana', status: 'pending' });
      await createTestSubmission({ country: 'Nigeria', status: 'pending' });

      const response = await request(app)
        .get('/api/submissions/pending/country')
        .set('Authorization', authHeader)
        .expect(200);

      expect(response.body.success).toBe(true);
      // Clean test database setup cleans collections after each test, so we should see exactly 2 pending submissions.
      expect(response.body.submissions.length).toBe(2);
    });

    it('should return 403 when user is contributor', async () => {
      const contributor = await createTestUser({ role: 'contributor' });
      const authHeader = getAuthHeader(contributor);

      const response = await request(app)
        .get('/api/submissions/pending/country')
        .set('Authorization', authHeader)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});
