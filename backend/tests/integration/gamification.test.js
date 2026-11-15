import { jest } from '@jest/globals';
import request from 'supertest';
import { createTestApp } from '../utils/testApp.js';
import {
  createTestUser,
  createTestSubmission,
  createTestVerifier,
  getAuthHeader
} from '../utils/testHelpers.js';
import User from '../../src/models/User.js';
import {
  BADGE_RULES,
  findNewBadges,
  awardEarnedBadges,
  awardEarnedBadgesSafely
} from '../../src/services/gamificationService.js';

const badgeNames = async (userId) => (await User.findByPk(userId)).badges.map((badge) => badge.name);

const submissionBody = (n = 1) => ({
  url: `https://example.com/article-${n}`,
  title: `Test Article ${n}`,
  publisher: 'Test Publisher',
  country: 'Ghana',
  category: 'secondary'
});

describe('Gamification service (automatic badges)', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('findNewBadges', () => {
    const stats = (overrides = {}) => ({
      points: 0,
      submissions: 0,
      credibleSubmissions: 0,
      reviews: 0,
      ...overrides
    });

    it('returns nothing when no threshold is met', () => {
      expect(findNewBadges(stats(), [])).toEqual([]);
    });

    it.each([
      ['First Steps', { submissions: 1 }],
      ['Contributor', { submissions: 10 }],
      ['Credible Source', { credibleSubmissions: 5 }],
      ['Guardian', { reviews: 10 }],
      ['Expert', { points: 500 }],
      ['Top Contributor', { points: 1000 }]
    ])('grants %s exactly at its threshold', (name, atThreshold) => {
      const [key, value] = Object.entries(atThreshold)[0];

      expect(findNewBadges(stats({ [key]: value - 1 }), []).map((b) => b.name)).not.toContain(name);
      expect(findNewBadges(stats(atThreshold), []).map((b) => b.name)).toContain(name);
    });

    it('skips badges the user already holds, matched by id or by name', () => {
      const held = [{ id: 'first-steps', name: 'First Steps' }, { name: 'Contributor', icon: '🎉' }];
      const names = findNewBadges(stats({ submissions: 10 }), held).map((b) => b.name);

      expect(names).toEqual([]);
    });

    it('has unique ids and names across all rules', () => {
      expect(new Set(BADGE_RULES.map((r) => r.id)).size).toBe(BADGE_RULES.length);
      expect(new Set(BADGE_RULES.map((r) => r.name)).size).toBe(BADGE_RULES.length);
    });
  });

  describe('awardEarnedBadges', () => {
    it('grants nothing to a user with no activity', async () => {
      const user = await createTestUser();

      expect(await awardEarnedBadges(user.id)).toEqual([]);
      expect(await badgeNames(user.id)).toEqual([]);
    });

    it('grants and persists earned badges with an earnedAt date', async () => {
      const user = await createTestUser();
      await createTestSubmission({}, user);

      const granted = await awardEarnedBadges(user.id);
      expect(granted.map((b) => b.name)).toEqual(['First Steps']);

      const { badges } = await User.findByPk(user.id);
      expect(badges).toHaveLength(1);
      expect(badges[0]).toMatchObject({ id: 'first-steps', name: 'First Steps', icon: '🎯' });
      expect(badges[0].earnedAt).toBeTruthy();
    });

    it('does not grant the same badge twice', async () => {
      const user = await createTestUser();
      await createTestSubmission({}, user);

      await awardEarnedBadges(user.id);
      expect(await awardEarnedBadges(user.id)).toEqual([]);
      expect(await badgeNames(user.id)).toEqual(['First Steps']);
    });

    it('does not duplicate badges when calls run concurrently', async () => {
      const user = await createTestUser();
      await createTestSubmission({}, user);

      await Promise.all([1, 2, 3, 4, 5].map(() => awardEarnedBadges(user.id)));

      expect(await badgeNames(user.id)).toEqual(['First Steps']);
    });

    it('keeps a manually awarded badge and does not re-grant one with the same name', async () => {
      const user = await createTestUser({ badges: [{ name: 'First Steps', icon: '🎉' }, { name: 'Early Adopter', icon: '🚀' }] });
      await createTestSubmission({}, user);

      expect(await awardEarnedBadges(user.id)).toEqual([]);
      expect(await badgeNames(user.id)).toEqual(['First Steps', 'Early Adopter']);
    });

    it('grants several badges at once when several thresholds are met', async () => {
      const user = await createTestUser({ points: 1000 });

      const granted = await awardEarnedBadges(user.id);

      expect(granted.map((b) => b.name)).toEqual(['Expert', 'Top Contributor']);
    });

    it('grants Guardian after 10 reviews', async () => {
      const verifier = await createTestVerifier();
      const submitter = await createTestUser({ username: 'submitter', email: 'submitter@test.com' });
      for (let i = 0; i < 10; i++) {
        await createTestSubmission({ status: 'rejected', verifier: verifier.id, verifiedAt: new Date() }, submitter);
      }

      const granted = await awardEarnedBadges(verifier.id);

      expect(granted.map((b) => b.name)).toContain('Guardian');
    });

    it('returns an empty list for an unknown or missing user', async () => {
      expect(await awardEarnedBadges('00000000-0000-4000-8000-000000000000')).toEqual([]);
      expect(await awardEarnedBadges(undefined)).toEqual([]);
    });
  });

  describe('awardEarnedBadgesSafely', () => {
    it('swallows errors and returns an empty list', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const findSpy = jest.spyOn(User, 'findByPk').mockRejectedValueOnce(new Error('db down'));

      await expect(awardEarnedBadgesSafely('some-id')).resolves.toEqual([]);
      expect(errorSpy).toHaveBeenCalled();

      findSpy.mockRestore();
      errorSpy.mockRestore();
    });
  });

  describe('POST /api/submissions', () => {
    it('awards First Steps on the first submission and reports it', async () => {
      const user = await createTestUser();

      const response = await request(app)
        .post('/api/submissions')
        .set('Authorization', getAuthHeader(user))
        .send(submissionBody())
        .expect(201);

      expect(response.body.newBadges.map((b) => b.name)).toEqual(['First Steps']);
      expect(await badgeNames(user.id)).toEqual(['First Steps']);
    });

    it('does not award First Steps again on later submissions', async () => {
      const user = await createTestUser();
      const authHeader = getAuthHeader(user);

      await request(app).post('/api/submissions').set('Authorization', authHeader).send(submissionBody(1)).expect(201);
      const second = await request(app)
        .post('/api/submissions')
        .set('Authorization', authHeader)
        .send(submissionBody(2))
        .expect(201);

      expect(second.body.newBadges).toEqual([]);
      expect(await badgeNames(user.id)).toEqual(['First Steps']);
    });

    it('awards Contributor on the 10th submission', async () => {
      const user = await createTestUser();
      for (let i = 0; i < 9; i++) {
        await createTestSubmission({ url: `https://example.com/seed-${i}` }, user);
      }

      const response = await request(app)
        .post('/api/submissions')
        .set('Authorization', getAuthHeader(user))
        .send(submissionBody(10))
        .expect(201);

      expect(response.body.newBadges.map((b) => b.name)).toEqual(['First Steps', 'Contributor']);
    });
  });

  describe('PUT /api/submissions/:id/verify', () => {
    it('awards the submitter a points badge when approval crosses the threshold', async () => {
      const submitter = await createTestUser({ points: 480 });
      const verifier = await createTestVerifier({ username: 'verifier', email: 'verifier@test.com' });
      const submission = await createTestSubmission({}, submitter);

      await request(app)
        .put(`/api/submissions/${submission.id}/verify`)
        .set('Authorization', getAuthHeader(verifier))
        .send({ status: 'approved', credibility: 'credible' })
        .expect(200);

      // 480 + 25 points for a credible approval
      expect(await badgeNames(submitter.id)).toContain('Expert');
    });

    it('awards Credible Source on the 5th credible approval', async () => {
      const submitter = await createTestUser();
      const verifier = await createTestVerifier({ username: 'verifier', email: 'verifier@test.com' });
      for (let i = 0; i < 4; i++) {
        await createTestSubmission(
          { url: `https://example.com/seed-${i}`, status: 'approved', credibility: 'credible', verifier: verifier.id },
          submitter
        );
      }
      const submission = await createTestSubmission({ url: 'https://example.com/fifth' }, submitter);

      await request(app)
        .put(`/api/submissions/${submission.id}/verify`)
        .set('Authorization', getAuthHeader(verifier))
        .send({ status: 'approved', credibility: 'credible' })
        .expect(200);

      expect(await badgeNames(submitter.id)).toContain('Credible Source');
    });

    it('awards the verifier Guardian on their 10th review and reports it', async () => {
      const submitter = await createTestUser();
      const verifier = await createTestVerifier({ username: 'verifier', email: 'verifier@test.com' });
      for (let i = 0; i < 9; i++) {
        await createTestSubmission(
          { url: `https://example.com/seed-${i}`, status: 'rejected', verifier: verifier.id },
          submitter
        );
      }
      const submission = await createTestSubmission({ url: 'https://example.com/tenth' }, submitter);

      const response = await request(app)
        .put(`/api/submissions/${submission.id}/verify`)
        .set('Authorization', getAuthHeader(verifier))
        .send({ status: 'rejected' })
        .expect(200);

      expect(response.body.newBadges.map((b) => b.name)).toEqual(['Guardian']);
      expect(await badgeNames(verifier.id)).toEqual(['Guardian']);
    });

    it('awards nothing to the submitter when a submission is rejected', async () => {
      const submitter = await createTestUser();
      const verifier = await createTestVerifier({ username: 'verifier', email: 'verifier@test.com' });
      const submission = await createTestSubmission({}, submitter);

      await request(app)
        .put(`/api/submissions/${submission.id}/verify`)
        .set('Authorization', getAuthHeader(verifier))
        .send({ status: 'rejected' })
        .expect(200);

      // One submission exists, so First Steps is the only badge they can hold
      expect(await badgeNames(submitter.id)).toEqual(['First Steps']);
    });
  });
});
