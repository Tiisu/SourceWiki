import request from 'supertest';
import { createTestApp } from '../utils/testApp.js';
import { createTestUser, getAuthHeader, generateToken } from '../utils/testHelpers.js';
import User from '../../src/models/User.js';

describe('Auth API Integration Tests', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'newuser',
        email: 'newuser@test.com',
        password: 'password123',
        country: 'Ghana'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe(userData.username);
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body).toHaveProperty('accessToken');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          // Missing email, password, country
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for duplicate username', async () => {
      const user = await createTestUser({ username: 'duplicate', email: 'test1@test.com' });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'duplicate',
          email: 'test2@test.com',
          password: 'password123',
          country: 'Ghana'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for duplicate email', async () => {
      const user = await createTestUser({ username: 'user1', email: 'duplicate@test.com' });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'user2',
          email: 'duplicate@test.com',
          password: 'password123',
          country: 'Ghana'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'invalid-email',
          password: 'password123',
          country: 'Ghana'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for password too short', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@test.com',
          password: '12345', // Less than 6 characters
          country: 'Ghana'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login user with valid credentials', async () => {
      const user = await createTestUser({
        username: 'loginuser',
        email: 'login@test.com',
        password: 'password123'
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'loginuser',
          password: 'password123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user.username).toBe('loginuser');
    });

    it('should return 401 for invalid username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'password123'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should return 401 for invalid password', async () => {
      const user = await createTestUser({
        username: 'testuser',
        password: 'correctpassword'
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should return 400 for missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user when authenticated', async () => {
      const user = await createTestUser({ username: 'meuser', email: 'me@test.com' });
      const authHeader = getAuthHeader(user);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', authHeader)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.username).toBe('meuser');
      expect(response.body.user.email).toBe('me@test.com');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout user successfully', async () => {
      const user = await createTestUser();
      const authHeader = getAuthHeader(user);

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', authHeader)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Logged out');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      const user = await createTestUser();
      const refreshToken = generateToken(user, 'refresh');

      // Add refresh token to user's refreshTokens array
      user.refreshTokens.push({ token: refreshToken });
      await user.save();

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('accessToken');
    });

    it('should return 401 for invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/auth/profile', () => {
    it('should update user profile when authenticated', async () => {
      const user = await createTestUser({ username: 'profileuser', country: 'Ghana' });
      const authHeader = getAuthHeader(user);

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', authHeader)
        .send({
          country: 'Nigeria',
          email: 'updated@test.com'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.country).toBe('Nigeria');
      expect(response.body.user.email).toBe('updated@test.com');
      // Note: username is not updatable via this endpoint (only email and country)
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .send({ country: 'Nigeria' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/auth/password', () => {
    it('should change password when authenticated', async () => {
      const user = await createTestUser({ password: 'oldpassword' });
      const authHeader = getAuthHeader(user);

      const response = await request(app)
        .put('/api/auth/password')
        .set('Authorization', authHeader)
        .send({
          currentPassword: 'oldpassword',
          newPassword: 'newpassword123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify new password works
      const updatedUser = await User.findById(user._id).select('+password');
      const isMatch = await updatedUser.comparePassword('newpassword123');
      expect(isMatch).toBe(true);
    });

    it('should return 401 for incorrect current password', async () => {
      const user = await createTestUser({ password: 'oldpassword' });
      const authHeader = getAuthHeader(user);

      const response = await request(app)
        .put('/api/auth/password')
        .set('Authorization', authHeader)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .put('/api/auth/password')
        .send({
          currentPassword: 'oldpassword',
          newPassword: 'newpassword123'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});

