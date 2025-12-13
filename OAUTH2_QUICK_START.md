# Wikimedia OAuth 2.0 Quick Start Checklist

## Pre-Implementation Checklist

- [ ] Read the implementation plan: `WIKIMEDIA_OAUTH2_IMPLEMENTATION_PLAN.md`
- [ ] Register OAuth 2.0 consumer at https://meta.wikimedia.org/wiki/Special:OAuthConsumerRegistration/propose
- [ ] Save `client_id` and `client_secret` securely
- [ ] Install `simple-oauth2` package: `npm install simple-oauth2`

## Implementation Order

### Step 1: Backend Configuration (15 min)
- [ ] Add OAuth 2.0 config to `backend/src/config/config.js`
- [ ] Add environment variables to `.env`

### Step 2: OAuth 2.0 Service (30 min)
- [ ] Create `backend/src/services/wikimediaOAuth2.js`
- [ ] Implement `getAuthorizationUrl()`
- [ ] Implement `getAccessTokenFromCode()`
- [ ] Implement `getUserProfile()`

### Step 3: OAuth 2.0 Controller (45 min)
- [ ] Create `backend/src/controllers/wikimediaOAuth2Controller.js`
- [ ] Implement `initiateOAuth2()` endpoint
- [ ] Implement `oauth2Callback()` endpoint
- [ ] Add user creation/update logic

### Step 4: Routes & Server Integration (15 min)
- [ ] Create `backend/src/routes/wikimediaOAuth2Routes.js`
- [ ] Add routes to `backend/src/server.js`

### Step 5: Frontend Integration (45 min)
- [ ] Update `frontend/src/lib/api.ts` with OAuth 2.0 method
- [ ] Create `frontend/src/components/WikimediaOAuth2Button.tsx`
- [ ] Create `frontend/src/pages/WikimediaCallbackPage.tsx`
- [ ] Update `frontend/src/pages/AuthPage.tsx`

### Step 6: Testing (30 min)
- [ ] Test authorization URL generation
- [ ] Test full OAuth flow
- [ ] Test error cases
- [ ] Verify user creation/login

## Key Differences: OAuth 2.0 vs 1.0a

| Aspect | OAuth 1.0a | OAuth 2.0 |
|--------|------------|-----------|
| Signing | HMAC-SHA1 or RSA | None (uses HTTPS) |
| Tokens | Access token + secret | Access token only |
| Request format | Signed parameters | Bearer token in header |
| Complexity | High | Low |
| Library | `oauth` package | `simple-oauth2` |

## Quick Code Snippets

### Environment Variables
```env
WIKIMEDIA_OAUTH2_CLIENT_ID=your_id_here
WIKIMEDIA_OAUTH2_CLIENT_SECRET=your_secret_here
WIKIMEDIA_OAUTH2_REDIRECT_URI=http://localhost:5000/api/auth/wikimedia/callback
```

### Authorization URL Example
```
https://meta.wikimedia.org/wiki/Special:OAuth2/authorize?
  client_id=YOUR_CLIENT_ID&
  redirect_uri=http://localhost:5000/api/auth/wikimedia/callback&
  response_type=code&
  scope=mwoauth-authonly&
  state=RANDOM_STATE_STRING
```

### Token Exchange (Backend)
```javascript
POST https://meta.wikimedia.org/w/rest.php/oauth2/access_token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&
code=AUTHORIZATION_CODE&
redirect_uri=http://localhost:5000/api/auth/wikimedia/callback&
client_id=YOUR_CLIENT_ID&
client_secret=YOUR_CLIENT_SECRET
```

### Get User Profile (Backend)
```javascript
GET https://meta.wikimedia.org/w/rest.php/oauth2/resource/profile
Authorization: Bearer ACCESS_TOKEN
```

## Acceptance Criteria Verification

Before submitting, verify:

- [ ] Users can click "Login with Wikipedia" button
- [ ] User is redirected to MediaWiki authorization page
- [ ] After authorization, user is redirected back
- [ ] User is automatically logged into your application
- [ ] User profile shows Wikipedia username (if stored)
- [ ] All error cases are handled gracefully
- [ ] Code is clean and well-commented

## Troubleshooting

**Problem**: `invalid_client` error
- Check `client_id` and `client_secret` are correct
- Ensure no extra spaces in `.env` file

**Problem**: `redirect_uri_mismatch`
- Verify redirect URI matches exactly (including http/https, port, path)

**Problem**: `invalid_grant` error
- Authorization codes expire quickly (usually < 1 minute)
- Ensure you're exchanging the code immediately after receiving it

**Problem**: Token exchange succeeds but profile fails
- Check you're using `Bearer` token format in Authorization header
- Verify token hasn't expired

## Ready to Implement?

Start with Step 1 and work through each step sequentially. The full implementation plan has detailed code examples for each step.

