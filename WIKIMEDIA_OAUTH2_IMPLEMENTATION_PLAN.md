# Wikimedia OAuth 2.0 Implementation Plan

## Overview

This document provides a comprehensive plan for implementing Wikimedia OAuth 2.0 authentication from scratch, following the [MediaWiki OAuth Extension documentation](https://www.mediawiki.org/wiki/Extension:OAuth).

## Why OAuth 2.0 Instead of 1.0a?

- **Simpler**: OAuth 2.0 uses standard HTTP requests with Bearer tokens (no complex signing)
- **Modern Standard**: OAuth 2.0 is the current industry standard
- **Better Libraries**: More and better-maintained libraries for OAuth 2.0
- **Recommended**: MediaWiki documentation recommends OAuth 2.0 when available

## OAuth 2.0 Authorization Code Flow

The flow consists of these steps:

1. **User initiates login** → Frontend requests authorization URL
2. **Redirect to MediaWiki** → User authorizes the application
3. **Callback with code** → MediaWiki redirects back with authorization code
4. **Exchange code for token** → Backend exchanges code for access token
5. **Get user profile** → Backend uses access token to get user info
6. **Create/login user** → Backend creates or logs in user, returns JWT

## Prerequisites

### 1. Register OAuth 2.0 Consumer

**Step 1.1**: Go to https://meta.wikimedia.org/wiki/Special:OAuthConsumerRegistration/propose

**Step 1.2**: Fill in the registration form:
- **Application name**: WikiSource Verifier (or your app name)
- **Description**: A platform for verifying Wikipedia references
- **OAuth protocol version**: Select **OAuth 2.0** (important!)
- **Grants**: Select `mwoauth-authonly` (User identity verification only) for basic auth, or specific grants if needed
- **Callback URL**: `http://localhost:5000/api/auth/wikimedia/callback` (development)
- **Email**: Your contact email

**Step 1.3**: After registration, you'll receive:
- `client_id` (Consumer Key)
- `client_secret` (Consumer Secret)

**Step 1.4**: Save these in your `.env` file:
```env
WIKIMEDIA_OAUTH2_CLIENT_ID=your_client_id_here
WIKIMEDIA_OAUTH2_CLIENT_SECRET=your_client_secret_here
WIKIMEDIA_OAUTH2_REDIRECT_URI=http://localhost:5000/api/auth/wikimedia/callback
```

### 2. Install Required Packages

```bash
cd backend
npm install simple-oauth2  # Simple OAuth 2.0 library
# OR
npm install openid-client  # Alternative with better OpenID Connect support
```

**Recommended**: `simple-oauth2` - simpler and perfect for our use case.

## Implementation Steps

### Phase 1: Backend Setup

#### Step 1: Update Environment Configuration

**File**: `backend/src/config/config.js`

Add OAuth 2.0 configuration:
```javascript
wikimediaOAuth2: {
  clientId: process.env.WIKIMEDIA_OAUTH2_CLIENT_ID,
  clientSecret: process.env.WIKIMEDIA_OAUTH2_CLIENT_SECRET,
  redirectUri: process.env.WIKIMEDIA_OAUTH2_REDIRECT_URI || 'http://localhost:5000/api/auth/wikimedia/callback',
  // MediaWiki OAuth 2.0 endpoints (meta.wikimedia.org)
  authorizationHost: 'https://meta.wikimedia.org',
  tokenHost: 'https://meta.wikimedia.org',
  authorizationPath: '/wiki/Special:OAuth2/authorize',
  tokenPath: '/w/rest.php/oauth2/access_token',
  profilePath: '/w/rest.php/oauth2/resource/profile'
}
```

#### Step 2: Create OAuth 2.0 Service

**File**: `backend/src/services/wikimediaOAuth2.js`

This service will:
- Initialize OAuth 2.0 client
- Generate authorization URL
- Exchange authorization code for access token
- Get user profile from MediaWiki

**Key functions**:
```javascript
- getAuthorizationUrl(state) // Generate authorization URL
- getAccessTokenFromCode(code) // Exchange code for token
- getUserProfile(accessToken) // Get user info
- refreshAccessToken(refreshToken) // Refresh expired tokens
```

#### Step 3: Create OAuth 2.0 Controller

**File**: `backend/src/controllers/wikimediaOAuth2Controller.js`

**Endpoints**:
1. `GET /api/auth/wikimedia/initiate` - Returns authorization URL
2. `GET /api/auth/wikimedia/callback` - Handles OAuth callback
3. `POST /api/auth/wikimedia/link` - Link Wikimedia account to existing user (optional)

**Flow in callback**:
1. Extract `code` and `state` from query params
2. Verify state (CSRF protection)
3. Exchange code for access token
4. Get user profile from MediaWiki
5. Create or update user in database
6. Generate JWT tokens
7. Redirect to frontend with tokens

#### Step 4: Create OAuth 2.0 Routes

**File**: `backend/src/routes/wikimediaOAuth2Routes.js`

```javascript
router.get('/initiate', initiateOAuth2)
router.get('/callback', oauth2Callback)
router.post('/link', protect, linkAccount) // Optional
```

#### Step 5: Update User Model (Optional Enhancement)

**File**: `backend/src/models/User.js`

If you want to store OAuth info (optional):
```javascript
wikimediaOAuth2: {
  wikimediaId: String, // Central user ID (sub from profile)
  username: String,    // Wikipedia username
  accessToken: String, // Encrypted
  refreshToken: String, // Encrypted
  tokenExpiresAt: Date,
  linkedAt: Date
}
```

### Phase 2: Frontend Setup

#### Step 6: Update API Client

**File**: `frontend/src/lib/api.ts`

Add OAuth 2.0 methods:
```typescript
// Wikimedia OAuth 2.0
initiateWikimediaOAuth2: () => api.get('/auth/wikimedia/initiate'),
```

#### Step 7: Create OAuth 2.0 Login Component

**File**: `frontend/src/components/WikimediaOAuth2Button.tsx`

Button component that:
1. Calls `/api/auth/wikimedia/initiate`
2. Gets authorization URL
3. Redirects user to MediaWiki

#### Step 8: Create Callback Handler

**File**: `frontend/src/pages/WikimediaCallbackPage.tsx`

Handles the redirect after OAuth:
1. Extracts tokens from URL (set by backend redirect)
2. Stores tokens
3. Fetches user data
4. Updates auth context
5. Redirects to home/profile

#### Step 9: Update Auth Page

**File**: `frontend/src/pages/AuthPage.tsx`

Add "Login with Wikipedia" button that uses OAuth 2.0

### Phase 3: Integration & Testing

#### Step 10: Update Server Routes

**File**: `backend/src/server.js`

Add OAuth 2.0 routes:
```javascript
import wikimediaOAuth2Routes from './routes/wikimediaOAuth2Routes.js';
app.use('/api/auth/wikimedia', wikimediaOAuth2Routes);
```

#### Step 11: Testing Checklist

- [ ] Authorization URL generation works
- [ ] User can authorize on MediaWiki
- [ ] Callback receives authorization code
- [ ] Code exchange for access token works
- [ ] User profile retrieval works
- [ ] User creation/login works
- [ ] JWT tokens are generated correctly
- [ ] Frontend receives tokens and logs user in
- [ ] Protected routes work with OAuth users

## Detailed Implementation

### OAuth 2.0 Service Implementation

```javascript
import axios from 'axios';
import simpleOauth2 from 'simple-oauth2';
import config from '../config/config.js';

const oauth2Config = {
  client: {
    id: config.wikimediaOAuth2.clientId,
    secret: config.wikimediaOAuth2.clientSecret,
  },
  auth: {
    tokenHost: config.wikimediaOAuth2.tokenHost,
    tokenPath: config.wikimediaOAuth2.tokenPath,
    authorizePath: config.wikimediaOAuth2.authorizationPath,
  },
};

const client = new simpleOauth2.AuthorizationCode(oauth2Config);

export function getAuthorizationUrl(state) {
  const authorizationUri = client.authorizeURL({
    redirect_uri: config.wikimediaOAuth2.redirectUri,
    scope: 'mwoauth-authonly', // User identity verification
    state: state, // CSRF protection
  });
  
  return authorizationUri;
}

export async function getAccessTokenFromCode(code) {
  const tokenParams = {
    code,
    redirect_uri: config.wikimediaOAuth2.redirectUri,
  };
  
  const result = await client.getToken(tokenParams);
  return result.token;
}

export async function getUserProfile(accessToken) {
  const response = await axios.get(
    `${config.wikimediaOAuth2.tokenHost}${config.wikimediaOAuth2.profilePath}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken.access_token}`,
        'User-Agent': 'WikiSourceVerifier/1.0',
      },
    }
  );
  
  return response.data;
}
```

### Controller Implementation

```javascript
import crypto from 'crypto';
import { getAuthorizationUrl, getAccessTokenFromCode, getUserProfile } from '../services/wikimediaOAuth2.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';
import User from '../models/User.js';

// Store states for CSRF protection (use Redis in production)
const stateStore = new Map();

export const initiateOAuth2 = async (req, res) => {
  // Generate random state for CSRF protection
  const state = crypto.randomBytes(32).toString('hex');
  
  // Store state (expires in 10 minutes)
  stateStore.set(state, {
    timestamp: Date.now(),
    userId: req.user?.id, // For account linking
  });
  
  setTimeout(() => stateStore.delete(state), 10 * 60 * 1000);
  
  const authorizationUrl = getAuthorizationUrl(state);
  
  res.json({
    success: true,
    authorizationUrl,
    state,
  });
};

export const oauth2Callback = async (req, res) => {
  const { code, state, error } = req.query;
  
  // Check for errors
  if (error) {
    return res.redirect(`${config.frontendUrl}/auth?error=${error}`);
  }
  
  // Verify state
  const storedState = stateStore.get(state);
  if (!storedState) {
    return res.redirect(`${config.frontendUrl}/auth?error=invalid_state`);
  }
  
  stateStore.delete(state); // One-time use
  
  try {
    // Exchange code for access token
    const accessToken = await getAccessTokenFromCode(code);
    
    // Get user profile
    const profile = await getUserProfile(accessToken);
    
    // Create or update user
    let user = await User.findOne({ 
      'wikimediaOAuth2.wikimediaId': profile.sub 
    });
    
    if (!user) {
      // Check if user exists by username
      user = await User.findOne({ username: profile.username });
      
      if (!user) {
        // Create new user
        user = await User.create({
          username: profile.username,
          email: `${profile.username}@wikimedia.local`,
          password: crypto.randomBytes(32).toString('hex'),
          country: 'Unknown', // Can be updated later
          wikimediaOAuth2: {
            wikimediaId: profile.sub,
            username: profile.username,
            accessToken: accessToken.access_token, // In production, encrypt this
            refreshToken: accessToken.refresh_token,
            tokenExpiresAt: new Date(Date.now() + accessToken.expires_in * 1000),
            linkedAt: new Date(),
          },
        });
      } else {
        // Link existing account
        user.wikimediaOAuth2 = {
          wikimediaId: profile.sub,
          username: profile.username,
          accessToken: accessToken.access_token,
          refreshToken: accessToken.refresh_token,
          tokenExpiresAt: new Date(Date.now() + accessToken.expires_in * 1000),
          linkedAt: new Date(),
        };
        await user.save();
      }
    } else {
      // Update tokens
      user.wikimediaOAuth2.accessToken = accessToken.access_token;
      user.wikimediaOAuth2.refreshToken = accessToken.refresh_token;
      user.wikimediaOAuth2.tokenExpiresAt = new Date(Date.now() + accessToken.expires_in * 1000);
      await user.save();
    }
    
    // Generate JWT tokens
    const jwtAccessToken = generateAccessToken(user._id);
    const jwtRefreshToken = generateRefreshToken(user._id);
    
    // Redirect to frontend with tokens
    const redirectUrl = new URL('/auth/wikimedia/success', config.frontendUrl);
    redirectUrl.searchParams.set('accessToken', jwtAccessToken);
    redirectUrl.searchParams.set('refreshToken', jwtRefreshToken);
    
    res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('OAuth 2.0 callback error:', error);
    res.redirect(`${config.frontendUrl}/auth?error=oauth_failed`);
  }
};
```

## Hackathon Acceptance Criteria Checklist

### Functional Requirements

- [ ] **Users can authenticate using Wikimedia OAuth 2.0**
  - [ ] Authorization flow initiates correctly
  - [ ] User can authorize on MediaWiki
  - [ ] Callback handles authorization code
  - [ ] User is logged in after successful auth

- [ ] **Wikipedia account linking works**
  - [ ] Users can link Wikipedia accounts (optional feature)
  - [ ] Linked accounts are stored correctly
  - [ ] Users can unlink accounts (optional)

- [ ] **Edit history verification** (if required)
  - [ ] Can retrieve user's Wikipedia edit history
  - [ ] Can verify if user edited specific articles
  - [ ] Edit counts and statistics are displayed

### Technical Requirements

- [ ] **OAuth 2.0 implementation follows MediaWiki spec**
  - [ ] Uses correct endpoints (REST API)
  - [ ] Proper state parameter for CSRF protection
  - [ ] Token storage and refresh implemented
  - [ ] Error handling is comprehensive

- [ ] **Security best practices**
  - [ ] State parameter for CSRF protection
  - [ ] Tokens stored securely (encrypted in production)
  - [ ] HTTPS in production
  - [ ] Proper error messages (don't leak secrets)

- [ ] **Integration quality**
  - [ ] Seamless user experience
  - [ ] Proper error handling and user feedback
  - [ ] Loading states during OAuth flow
  - [ ] Responsive design

### Documentation & Demo

- [ ] **Documentation complete**
  - [ ] README updated with OAuth setup instructions
  - [ ] Environment variables documented
  - [ ] API endpoints documented

- [ ] **Demo ready**
  - [ ] Can demonstrate full OAuth flow
  - [ ] Can show user profile with Wikipedia info
  - [ ] Can show edit verification (if applicable)

## File Structure

```
backend/
├── src/
│   ├── config/
│   │   └── config.js (updated)
│   ├── services/
│   │   └── wikimediaOAuth2.js (new)
│   ├── controllers/
│   │   └── wikimediaOAuth2Controller.js (new)
│   ├── routes/
│   │   └── wikimediaOAuth2Routes.js (new)
│   ├── models/
│   │   └── User.js (optionally updated)
│   └── server.js (updated)
│
frontend/
├── src/
│   ├── components/
│   │   └── WikimediaOAuth2Button.tsx (new)
│   ├── pages/
│   │   ├── AuthPage.tsx (updated)
│   │   └── WikimediaCallbackPage.tsx (new)
│   └── lib/
│       └── api.ts (updated)
```

## Testing Guide

### Manual Testing Steps

1. **Test Authorization URL Generation**
   ```bash
   curl http://localhost:5000/api/auth/wikimedia/initiate
   ```
   Should return JSON with `authorizationUrl` and `state`

2. **Test Full Flow**
   - Click "Login with Wikipedia" button
   - Should redirect to MediaWiki authorization page
   - Authorize the application
   - Should redirect back to your app
   - Should be logged in

3. **Test Error Cases**
   - User denies authorization
   - Invalid state parameter
   - Expired authorization code
   - Network errors

### Integration Testing

Create test file: `backend/tests/wikimediaOAuth2.test.js`

Test:
- Authorization URL generation
- Token exchange (mock MediaWiki responses)
- User profile retrieval
- User creation/update logic

## Environment Variables

Add to `backend/.env`:

```env
# Wikimedia OAuth 2.0 Configuration
WIKIMEDIA_OAUTH2_CLIENT_ID=your_client_id_from_meta_wikimedia
WIKIMEDIA_OAUTH2_CLIENT_SECRET=your_client_secret_from_meta_wikimedia
WIKIMEDIA_OAUTH2_REDIRECT_URI=http://localhost:5000/api/auth/wikimedia/callback
```

For production:
```env
WIKIMEDIA_OAUTH2_REDIRECT_URI=https://yourdomain.com/api/auth/wikimedia/callback
```

## Common Issues & Solutions

### Issue: "Invalid client_id"
**Solution**: Ensure `WIKIMEDIA_OAUTH2_CLIENT_ID` matches exactly what you got from registration

### Issue: "redirect_uri mismatch"
**Solution**: The redirect URI must match exactly what you registered (including http/https, port, trailing slash)

### Issue: "Invalid authorization code"
**Solution**: Authorization codes are single-use and expire quickly. Make sure you're exchanging it immediately.

### Issue: "Access token expired"
**Solution**: Implement token refresh using the refresh_token from the initial token response.

## Next Steps After Implementation

1. **Add token refresh logic** - Handle expired access tokens
2. **Add account unlinking** - Allow users to disconnect Wikipedia accounts
3. **Add edit verification** - Use Wikipedia API to verify user edits
4. **Add user profile display** - Show Wikipedia username, edit count, etc.
5. **Production hardening** - Encrypt tokens, use Redis for state storage, etc.

## References

- [MediaWiki OAuth Extension Documentation](https://www.mediawiki.org/wiki/Extension:OAuth)
- [OAuth 2.0 for Developers Guide](https://www.mediawiki.org/wiki/OAuth/For_Developers)
- [OAuth 2.0 Specification](https://oauth.net/2/)
- [simple-oauth2 Library](https://github.com/lelylan/simple-oauth2)

## Implementation Timeline

**Estimated Time**: 4-6 hours for full implementation

- Phase 1 (Backend): 2-3 hours
- Phase 2 (Frontend): 1-2 hours
- Phase 3 (Testing & Polish): 1 hour

This plan provides a complete, production-ready implementation of Wikimedia OAuth 2.0 that meets hackathon acceptance criteria.



