# Wikimedia OAuth 1.0a Setup Guide

## Overview

We've switched from OAuth 2.0 to OAuth 1.0a for Wikimedia authentication due to stability and reliability issues with OAuth 2.0. OAuth 1.0a is more mature, better documented, and provides reliable user information retrieval.

## Migration Complete ✅

The implementation has been completed:
- ✅ Backend OAuth 1.0a service created
- ✅ Controllers and routes updated
- ✅ User model updated to support OAuth 1.0a
- ✅ Frontend updated to use new endpoints
- ✅ OAuth 2.0 code kept for reference (not used)

## Required Steps

### 1. Register OAuth 1.0a Consumer

You need to register a new OAuth 1.0a consumer on Wikimedia:

1. Go to: https://meta.wikimedia.org/wiki/Special:OAuthConsumerRegistration/propose
2. Fill in the registration form:
   - **Application name:** WikiSource-Verifier (or your preferred name)
   - **Application description:** Wikipedia source verification platform
   - **OAuth "callback URL":** `http://localhost:5000/api/auth/wikimedia/callback`
   - **Applicable grants:** 
     - ✅ Basic rights (read only)
     - ✅ Create, edit, move pages
     - ✅ Upload new files
   - **Applicable project:** meta.wikimedia.org
3. Submit the registration
4. Copy the **Consumer Key** and **Consumer Secret**

### 2. Update Environment Variables

Add these to your `backend/.env` file:

```env
# Wikimedia OAuth 1.0a (Primary)
WIKIMEDIA_OAUTH1_CONSUMER_KEY=your_consumer_key_here
WIKIMEDIA_OAUTH1_CONSUMER_SECRET=your_consumer_secret_here
WIKIMEDIA_OAUTH1_CALLBACK_URL=http://localhost:5000/api/auth/wikimedia/callback
```

For production, update the callback URL:
```env
WIKIMEDIA_OAUTH1_CALLBACK_URL=https://yourdomain.com/api/auth/wikimedia/callback
```

### 3. Test the Integration

1. Start your backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Start your frontend:
   ```bash
   cd frontend
   npm run dev
   ```

3. Navigate to the login page and click "Login with Wikipedia"

4. Complete the OAuth flow:
   - You'll be redirected to Wikimedia
   - Authorize the application
   - You'll be redirected back and logged in

## Key Differences from OAuth 2.0

### Advantages of OAuth 1.0a

1. **Stable Profile Endpoint**: Uses MediaWiki Action API (`action=query&meta=userinfo`) which is reliable and well-tested
2. **No Profile Endpoint Bugs**: Avoids the HTTP 500 errors from OAuth 2.0 profile endpoint
3. **Better Documentation**: More examples and clearer documentation
4. **Proven Reliability**: Used by many Wikimedia tools successfully
5. **Full User Information**: Gets username, edit count, groups, and rights reliably

### Technical Differences

- **Token Format**: OAuth 1.0a uses `accessToken` + `accessTokenSecret` (two tokens) vs OAuth 2.0's single `accessToken`
- **Request Signing**: OAuth 1.0a requires HMAC-SHA1 request signing (handled automatically by the `oauth` library)
- **No PKCE**: OAuth 1.0a doesn't require PKCE (Proof Key for Code Exchange)
- **API Access**: Uses `action=query&meta=userinfo` directly with OAuth signed requests

## Architecture

### Flow

1. **Initiate**: Frontend calls `/api/auth/wikimedia/initiate`
   - Backend gets request token from Wikimedia
   - Returns authorization URL to frontend

2. **Authorize**: User clicks authorization URL
   - Redirected to Wikimedia to authorize
   - User authorizes application

3. **Callback**: Wikimedia redirects to `/api/auth/wikimedia/callback`
   - Backend receives `oauth_token` and `oauth_verifier`
   - Exchanges for access token
   - Gets user info via authenticated API call
   - Creates/logs in user
   - Redirects to frontend with JWT tokens

### Files

**Backend:**
- `backend/src/services/wikimediaOAuth1.js` - OAuth 1.0a service logic
- `backend/src/controllers/wikimediaOAuth1Controller.js` - Route handlers
- `backend/src/routes/wikimediaOAuth1Routes.js` - Route definitions
- `backend/src/models/User.js` - Updated with `wikimediaOAuth1` field

**Frontend:**
- `frontend/src/lib/api.ts` - Updated API client
- `frontend/src/pages/AuthPage.tsx` - Login/Register with Wikipedia button
- `frontend/src/pages/WikimediaCallbackPage.tsx` - OAuth callback handler

## Troubleshooting

### Error: "Wikimedia OAuth 1.0a credentials not configured"

**Solution:** Add `WIKIMEDIA_OAUTH1_CONSUMER_KEY` and `WIKIMEDIA_OAUTH1_CONSUMER_SECRET` to your `.env` file.

### Error: "Invalid signature" or OAuth errors

**Possible causes:**
1. Consumer key/secret are incorrect
2. Callback URL doesn't match the registered callback URL
3. Consumer not approved yet (check registration status)

**Solution:** 
- Verify your credentials in `.env`
- Ensure callback URL matches exactly (including http/https and port)
- Check if consumer registration is approved

### Error: "User is anonymous or userinfo not available"

**Possible causes:**
1. OAuth grants are insufficient
2. Access token is invalid

**Solution:**
- Re-register consumer with more grants
- Check consumer registration includes "Basic rights (read only)"

## Security Notes

⚠️ **Important:** In production, you should encrypt the stored `accessToken` and `accessTokenSecret` in the database. Currently, they're stored as plain text for development.

## Support

For more information:
- MediaWiki OAuth Documentation: https://www.mediawiki.org/wiki/OAuth/For_Developers
- OAuth Consumer Registration: https://meta.wikimedia.org/wiki/Special:OAuthConsumerRegistration/propose




