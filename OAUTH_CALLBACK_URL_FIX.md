# OAuth Callback URL Fix

## Error: "OAuth token not found, E004"

This error occurs when the **callback URL** registered in your Wikimedia OAuth consumer settings doesn't match the callback URL your application is using.

## Solution

### 1. Check Your Current Callback URL

The callback URL your application uses is:
```
http://localhost:5000/api/auth/wikimedia/callback
```

### 2. Verify in Wikimedia OAuth Settings

Go to your OAuth consumer settings and make sure the callback URL is **exactly**:
```
http://localhost:5000/api/auth/wikimedia/callback
```

**Important:** 
- Must be **exact match** (case-sensitive)
- Must include `http://` (not `https://` for localhost)
- Must include the port number `:5000`
- Must include the full path `/api/auth/wikimedia/callback`

### 3. Common Issues

❌ **Wrong:**
- `http://localhost/api/auth/wikimedia/callback` (missing port)
- `http://localhost:3000/api/auth/wikimedia/callback` (wrong port)
- `http://127.0.0.1:5000/api/auth/wikimedia/callback` (different host)
- `/api/auth/wikimedia/callback` (missing protocol and host)

✅ **Correct:**
- `http://localhost:5000/api/auth/wikimedia/callback`

### 4. Update Wikimedia OAuth Consumer

1. Go to: https://meta.wikimedia.org/wiki/Special:OAuthConsumerRegistration/propose/your-consumer-id
2. Or go to your consumer list: https://meta.wikimedia.org/wiki/Special:OAuthConsumerRegistration/list
3. Click on your consumer to edit
4. Update the "OAuth callback URL" field to: `http://localhost:5000/api/auth/wikimedia/callback`
5. Save changes

### 5. Test Again

After updating the callback URL in Wikimedia:
1. Restart your backend server
2. Try the OAuth login again
3. Check the backend console for the callback URL being used

### 6. For Production

When deploying to production, update:
1. The callback URL in Wikimedia OAuth settings to your production URL
2. Set `BACKEND_URL` environment variable to your production backend URL
3. Make sure to use `https://` in production

Example production callback URL:
```
https://api.yourdomain.com/api/auth/wikimedia/callback
```

## Debugging

The application now logs the callback URL on startup. Check your backend console for:
```
🔗 OAuth Callback URL: http://localhost:5000/api/auth/wikimedia/callback
```

This should match exactly what's in your Wikimedia OAuth consumer settings.



