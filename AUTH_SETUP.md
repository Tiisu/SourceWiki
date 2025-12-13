# Authentication Setup & Frontend-Backend Connection

This document outlines the authentication setup and connection between the frontend and backend.

## ✅ Completed Changes

### Backend Improvements

1. **Environment Configuration (`backend/src/config/config.js`)**
   - ✅ Added validation for required environment variables
   - ✅ Clear error messages when env vars are missing
   - ✅ Centralized configuration management
   - ✅ Support for JWT refresh tokens

2. **CORS Configuration (`backend/src/server.js`)**
   - ✅ Configured to allow both localhost:3000 and localhost:5173
   - ✅ Development mode allows any localhost origin
   - ✅ Production mode uses explicit allowed origins
   - ✅ Credentials enabled for cookie-based auth
   - ✅ Proper headers and methods configured

3. **Security Headers (`backend/src/server.js`)**
   - ✅ Helmet configured for production
   - ✅ Cross-origin resource policy set appropriately
   - ✅ Security headers optimized for API

4. **User Model (`backend/src/models/User.js`)**
   - ✅ Fixed `getPublicProfile()` to convert `_id` to string
   - ✅ Ensures badges array defaults to empty array
   - ✅ Consistent user data format

5. **JWT Utilities (`backend/src/utils/jwt.js`)**
   - ✅ Updated to use centralized config
   - ✅ Cookie settings optimized for development and production
   - ✅ `sameSite` set to 'lax' for development, 'none' for production (with secure flag)

6. **Auth Controller (`backend/src/controllers/authController.js`)**
   - ✅ Refresh token endpoint supports both body and cookies
   - ✅ Returns refreshToken in refresh response
   - ✅ Consistent error handling
   - ✅ Logout properly clears cookies

7. **Auth Middleware (`backend/src/middleware/auth.js`)**
   - ✅ Supports both Bearer tokens and cookies
   - ✅ Updated to use centralized config
   - ✅ Proper error handling

8. **Error Handler (`backend/src/middleware/errorHandler.js`)**
   - ✅ Updated to use centralized config
   - ✅ Proper error formatting
   - ✅ Development vs production error details

### Frontend Improvements

1. **Environment Configuration (`frontend/.env`)**
   - ✅ Created `.env` file with API URL
   - ✅ Created `.env.example` for reference
   - ✅ API URL: `http://localhost:5000/api`

2. **API Client (`frontend/src/lib/api.ts`)**
   - ✅ Improved error handling for non-JSON responses
   - ✅ Better error messages with status codes
   - ✅ Supports credentials (cookies)
   - ✅ Automatic token refresh on 401 errors
   - ✅ Proper token management

3. **Auth Context (`frontend/src/lib/auth-context.tsx`)**
   - ✅ Already properly structured
   - ✅ Handles login, register, logout
   - ✅ Auto-refreshes user on mount
   - ✅ Proper error handling

## 🔐 Authentication Flow

### Registration Flow
1. User submits registration form → Frontend calls `authApi.register()`
2. Backend creates user → Returns tokens and user data
3. Frontend stores tokens in localStorage → Updates auth context

### Login Flow
1. User submits login form → Frontend calls `authApi.login()`
2. Backend validates credentials → Returns tokens and user data
3. Frontend stores tokens in localStorage → Updates auth context

### Token Refresh Flow
1. API request returns 401 → Frontend detects expired token
2. Frontend calls `/auth/refresh` with refresh token
3. Backend validates refresh token → Returns new access token
4. Frontend updates access token → Retries original request

### Protected Routes
1. Frontend adds `Authorization: Bearer <token>` header
2. Backend middleware checks token → Verifies user
3. If valid → Request proceeds
4. If invalid → Returns 401 → Frontend handles refresh/logout

## 🔧 Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/wikisource-verifier
JWT_SECRET=<generated-secret>
JWT_REFRESH_SECRET=<generated-secret>
JWT_EXPIRE=30d
JWT_REFRESH_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5000/api
```

## 🚀 Running the Application

### Start Backend
```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

### Start Frontend
```bash
cd frontend
npm run dev
# Server runs on http://localhost:3000
```

## 🔍 Testing Authentication

### Test Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "country": "Ghana"
  }'
```

### Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

### Test Protected Route
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <access-token>"
```

## 📝 Production Considerations

1. **Environment Variables**
   - ✅ Use strong, randomly generated JWT secrets
   - ✅ Set `NODE_ENV=production`
   - ✅ Use HTTPS in production
   - ✅ Update `FRONTEND_URL` to production domain

2. **Security**
   - ✅ Cookies use `secure: true` and `sameSite: 'none'` in production
   - ✅ Helmet security headers enabled
   - ✅ Rate limiting configured
   - ✅ CORS restricted to allowed origins

3. **Database**
   - ✅ Use MongoDB Atlas or managed database
   - ✅ Connection string in environment variables
   - ✅ Enable authentication on MongoDB

4. **Frontend**
   - ✅ Update `VITE_API_URL` to production API URL
   - ✅ Build for production: `npm run build`
   - ✅ Serve static files through CDN or reverse proxy

## 🐛 Troubleshooting

### CORS Errors
- Check that frontend URL is in allowed origins
- Verify `credentials: true` is set in both frontend and backend
- Ensure cookies have proper `sameSite` settings

### Authentication Fails
- Check JWT secrets are set correctly
- Verify tokens are being stored in localStorage
- Check browser console for errors
- Verify API URL is correct in frontend `.env`

### Token Refresh Fails
- Check refresh token is stored correctly
- Verify refresh token endpoint is accessible
- Check token expiration times

## 📚 API Endpoints

### Auth Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user (requires auth)
- `GET /api/auth/me` - Get current user (requires auth)
- `POST /api/auth/refresh` - Refresh access token
- `PUT /api/auth/profile` - Update profile (requires auth)
- `PUT /api/auth/password` - Change password (requires auth)

All auth endpoints return:
```json
{
  "success": true,
  "accessToken": "...",
  "refreshToken": "...",
  "user": { ... }
}
```

## ✅ Verification Checklist

- [x] Backend environment variables configured
- [x] Frontend environment variables configured
- [x] CORS properly configured
- [x] JWT tokens working (access + refresh)
- [x] Cookie-based auth supported
- [x] Bearer token auth supported
- [x] Error handling improved
- [x] Security headers configured
- [x] Production-ready settings




