# Wikimedia OAuth 2.0 Setup Instructions

## Environment Variables

Add these to your `backend/.env` file:

```env
WIKIMEDIA_CONSUMER_KEY=21b9ea4b08640fbc519564e8f01ac9a7
WIKIMEDIA_CONSUMER_SECRET=2f63f1fccff92687f6c2ce0266f74f4cf50bc145
WIKIMEDIA_OAUTH2_REDIRECT_URI=http://localhost:5000/api/auth/wikimedia/callback
```

**Important**: The `WIKIMEDIA_OAUTH2_REDIRECT_URI` must match **exactly** what you registered in your OAuth consumer on meta.wikimedia.org, including:
- Protocol (http/https)
- Port number
- Full path
- Trailing slash (or lack thereof)

## Verification Steps

1. **Check OAuth Consumer Registration**
   - Go to: https://meta.wikimedia.org/wiki/Special:OAuthConsumerRegistration/list
   - Find your consumer and verify:
     - OAuth protocol version is **OAuth 2.0**
     - Callback URL matches: `http://localhost:5000/api/auth/wikimedia/callback`

2. **Test the Implementation**
   
   Start your backend server:
   ```bash
   cd backend
   npm run dev
   ```
   
   Start your frontend (in a separate terminal):
   ```bash
   cd frontend
   npm run dev
   ```
   
   Test the flow:
   1. Go to `http://localhost:3000/auth` (or your frontend URL)
   2. Click "Login with Wikipedia" or "Sign up with Wikipedia"
   3. You should be redirected to MediaWiki authorization page
   4. After authorizing, you should be redirected back and logged in

## Testing the API Directly

You can test the backend API directly:

```bash
# 1. Get authorization URL
curl http://localhost:5000/api/auth/wikimedia/initiate

# Response should contain:
# {
#   "success": true,
#   "authorizationUrl": "https://meta.wikimedia.org/wiki/Special:OAuth2/authorize?...",
#   "state": "..."
# }
```

## Common Issues

### Issue: "redirect_uri_mismatch"
**Solution**: Make sure the redirect URI in `.env` matches exactly what you registered in your OAuth consumer settings.

### Issue: "invalid_client"
**Solution**: 
- Verify `WIKIMEDIA_CONSUMER_KEY` and `WIKIMEDIA_CONSUMER_SECRET` are correct
- Check for extra spaces or quotes in `.env` file
- Ensure you're using the OAuth 2.0 consumer (not OAuth 1.0a)

### Issue: Authorization succeeds but callback fails
**Solution**: 
- Check backend logs for errors
- Verify the callback route is registered in `server.js`
- Check CORS settings allow your frontend URL

## Implementation Complete!

The following has been implemented:

✅ Backend OAuth 2.0 service (`wikimediaOAuth2.js`)
✅ Backend OAuth 2.0 controller (`wikimediaOAuth2Controller.js`)
✅ Backend OAuth 2.0 routes (`wikimediaOAuth2Routes.js`)
✅ User model updated to support OAuth 2.0 data
✅ Frontend API client updated
✅ Frontend callback page created
✅ Frontend auth page updated with Wikipedia login buttons
✅ Full OAuth 2.0 flow integration

## Next Steps

1. Add environment variables to `.env`
2. Restart your backend server
3. Test the OAuth flow
4. Verify user creation/login works
5. Test account linking (if needed)

## Production Considerations

Before deploying to production:

1. **Update redirect URI** to your production URL
2. **Update OAuth consumer** on meta.wikimedia.org with production callback URL
3. **Encrypt tokens** - Currently tokens are stored in plaintext. In production, encrypt `accessToken` and `refreshToken` before storing
4. **Use Redis** for state storage instead of in-memory Map
5. **Add HTTPS** - OAuth 2.0 requires HTTPS in production
6. **Environment variables** - Ensure all sensitive data is in environment variables

