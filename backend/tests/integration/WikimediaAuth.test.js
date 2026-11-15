import { jest } from '@jest/globals';
import request from 'supertest';
import { createTestApp } from '../utils/testApp.js';
import { createTestUser } from '../utils/testHelpers.js';
import User from '../../src/models/User.js';

const STATE = 'test-state-value-123';
const CALLBACK = `/api/auth/wikimedia/callback?code=fake-code&state=${STATE}`;

// Pretend to be Wikimedia: one fake answer for the token request, one for the profile request
const mockWikimedia = ({ sub, username }) => {
  globalThis.fetch = jest.fn(async (url) => {
    const target = String(url);
    if (target.includes('/oauth2/access_token')) {
      return { ok: true, status: 200, json: async () => ({ access_token: 'fake-wikimedia-token' }) };
    }
    if (target.includes('/oauth2/resource/profile')) {
      return { ok: true, status: 200, json: async () => ({ sub, username }) };
    }
    throw new Error(`Unexpected fetch call: ${target}`);
  });
};

// Do the callback as the browser would: with the state cookie that /api/auth/wikimedia set
const callback = (app, url = CALLBACK, cookie = `wikimedia_oauth_state=${STATE}`) =>
  request(app).get(url).set('Cookie', cookie);

describe('Wikimedia OAuth callback', () => {
  let app;
  const realFetch = globalThis.fetch;

  beforeAll(() => {
    app = createTestApp();
  });

  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it('creates a SourceWiki account on first login and sets the login cookies', async () => {
    mockWikimedia({ sub: 'wm-1001', username: 'Test Wiki User' });

    const response = await callback(app).expect(302);

    expect(response.headers.location).toContain('/auth?wikimedia=success');
    expect(response.headers.location).toContain('needsCountry=1');

    const cookies = response.headers['set-cookie'].join(';');
    expect(cookies).toContain('token=');
    expect(cookies).toContain('refreshToken=');

    const user = await User.findOne({ where: { wikimediaId: 'wm-1001' } });
    expect(user).not.toBeNull();
    expect(user.wikimediaUsername).toBe('Test Wiki User');
    expect(user.username).toBe('Test_Wiki_User');
    expect(user.email).toBeNull();
    expect(user.country).toBeNull();
  });

  it('exchanges the code with Wikimedia and sends the client secret only there', async () => {
    mockWikimedia({ sub: 'wm-1002', username: 'Secret Check' });

    const response = await callback(app).expect(302);

    const tokenCall = globalThis.fetch.mock.calls.find(([url]) => String(url).includes('/oauth2/access_token'));
    expect(tokenCall).toBeDefined();
    expect(String(tokenCall[1].body)).toContain('client_secret');
    expect(response.headers.location).not.toContain('client_secret');
    expect(response.headers.location).not.toContain('fake-wikimedia-token');
  });

  it('reuses the same account on a later login, matched on wikimediaId', async () => {
    mockWikimedia({ sub: 'wm-1003', username: 'Old Name' });
    await callback(app).expect(302);
    const first = await User.findOne({ where: { wikimediaId: 'wm-1003' } });

    // Same Wikimedia user, but they renamed themselves on Wikimedia
    mockWikimedia({ sub: 'wm-1003', username: 'New Name' });
    await callback(app).expect(302);

    const all = await User.findAll({ where: { wikimediaId: 'wm-1003' } });
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(first.id);
    expect(all[0].wikimediaUsername).toBe('New Name');
  });

  it('does not log into a local account that happens to have the same username', async () => {
    const local = await createTestUser({ username: 'Taken_Name', email: 'taken@test.com' });

    mockWikimedia({ sub: 'wm-1004', username: 'Taken Name' });
    await callback(app).expect(302);

    const wikimediaUser = await User.findOne({ where: { wikimediaId: 'wm-1004' } });
    expect(wikimediaUser).not.toBeNull();
    expect(wikimediaUser.id).not.toBe(local.id);
    expect(wikimediaUser.username).not.toBe('Taken_Name');

    const untouched = await User.findByPk(local.id);
    expect(untouched.wikimediaId).toBeNull();
  });

  it('rejects a state that does not match the cookie (CSRF) without calling Wikimedia', async () => {
    mockWikimedia({ sub: 'wm-1005', username: 'Csrf User' });

    const response = await callback(app, CALLBACK, 'wikimedia_oauth_state=some-other-value').expect(302);

    expect(response.headers.location).toContain('wikimedia=error');
    expect(response.headers.location).toContain('reason=invalid_state');
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(await User.findOne({ where: { wikimediaId: 'wm-1005' } })).toBeNull();
  });

  it('rejects a callback with no state cookie', async () => {
    mockWikimedia({ sub: 'wm-1006', username: 'No Cookie' });

    const response = await request(app).get(CALLBACK).expect(302);

    expect(response.headers.location).toContain('reason=invalid_state');
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('handles the user cancelling on Wikimedia', async () => {
    mockWikimedia({ sub: 'wm-1007', username: 'Cancelled' });

    const response = await callback(app, `/api/auth/wikimedia/callback?error=access_denied&state=${STATE}`).expect(302);

    expect(response.headers.location).toContain('reason=access_denied');
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('fails cleanly when Wikimedia rejects the code', async () => {
    globalThis.fetch = jest.fn(async () => ({ ok: false, status: 400, json: async () => ({}) }));

    const response = await callback(app).expect(302);

    expect(response.headers.location).toContain('reason=token_exchange_failed');
  });

  it('refuses a deactivated account', async () => {
    mockWikimedia({ sub: 'wm-1008', username: 'Deactivated User' });
    await callback(app).expect(302);
    const user = await User.findOne({ where: { wikimediaId: 'wm-1008' } });
    await user.update({ isActive: false });

    const response = await callback(app).expect(302);

    expect(response.headers.location).toContain('reason=account_inactive');
    expect(response.headers['set-cookie'].join(';')).not.toContain('token=eyJ');
  });

  it('does not let a Wikimedia-only account log in with a password', async () => {
    mockWikimedia({ sub: 'wm-1009', username: 'No Password' });
    await callback(app).expect(302);

    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'No_Password', password: 'anything123' })
      .expect(401);

    expect(response.body.success).toBe(false);
  });
});