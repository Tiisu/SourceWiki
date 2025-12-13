# Wikimedia OAuth Integration Setup Guide

This guide explains how to set up and use Wikimedia OAuth authentication in the WikiSource Verifier application.

## Overview

The application now supports:
- **Wikimedia OAuth Login**: Users can authenticate using their Wikipedia/Wikimedia accounts
- **Account Linking**: Existing users can link their Wikipedia accounts
- **Edit History Verification**: Verify if users have edited specific Wikipedia articles
- **Contribution Statistics**: View user's Wikipedia edit count and contribution history

## Backend Setup

### 1. Register OAuth Consumer with Wikimedia

1. Go to [Wikimedia OAuth Consumer Registration](https://meta.wikimedia.org/wiki/Special:OAuthConsumerRegistration)
2. Log in with your Wikimedia account
3. Fill in the registration form:
   - **Application name**: WikiSource Verifier
   - **Application description**: A platform for verifying Wikipedia references
   - **OAuth "callback" URL**: `http://localhost:3000/auth/wikimedia/callback` (development)
   - **Contact email**: Your email
   - **Allowed grants**: Check "Request access to edit pages"
4. Submit the form
5. **Save the Consumer Key and Consumer Secret** - you'll need these!

### 2. Update Environment Variables

Add to your `backend/.env` file:

```env
# Wikimedia OAuth Configuration
WIKIMEDIA_CONSUMER_KEY=your_consumer_key_here
WIKIMEDIA_CONSUMER_SECRET=your_consumer_secret_here
```

### 3. Install Dependencies

```bash
cd backend
npm install oauth axios
```

The `oauth` package is used for OAuth 1.0a (which Wikimedia uses), and `axios` for making HTTP requests to Wikipedia API.

### 4. Restart Backend Server

```bash
npm run dev
```

## Frontend Setup

The frontend components are already integrated. No additional setup required!

## Usage

### For Users

#### Login/Register with Wikipedia

1. Go to the login/register page
2. Click "Login with Wikipedia" or "Sign up with Wikipedia"
3. You'll be redirected to Wikimedia's authorization page
4. Log in with your Wikimedia account
5. Authorize the application
6. You'll be redirected back and logged in automatically

#### Link Existing Account

1. Log in with your regular account
2. Go to your profile page
3. In the "Wikipedia Account" section, click "Link Wikipedia Account"
4. Authorize the application
5. Your accounts will be linked

#### Unlink Account

1. Go to your profile page
2. In the "Wikipedia Account" section, click "Unlink Account"
3. Confirm the action

### For Developers

#### API Endpoints

**Initiate OAuth Flow**
```
GET /api/auth/wikimedia/initiate
```
Returns an authorization URL to redirect users to.

**OAuth Callback**
```
GET /api/auth/wikimedia/callback?oauth_token=...&oauth_verifier=...
```
Handled automatically by the backend - exchanges tokens and creates/updates user account.

**Link Account (Protected)**
```
POST /api/auth/wikimedia/link
```
Initiates OAuth flow for linking an existing account.

**Get Contributions (Protected)**
```
GET /api/auth/wikimedia/contributions
```
Returns user's Wikipedia contribution statistics.

**Verify Article Edit (Protected)**
```
POST /api/auth/wikimedia/verify-edit
Body: { "articleTitle": "Article_Name" }
```
Verifies if the user has edited the specified Wikipedia article.

**Unlink Account (Protected)**
```
DELETE /api/auth/wikimedia/unlink
```
Unlinks the user's Wikipedia account.

#### User Model Updates

The User model now includes a `wikimediaAccount` field:

```javascript
{
  wikimediaId: String,
  wikipediaUsername: String,
  oauthToken: String,
  oauthTokenSecret: String,
  linkedAt: Date,
  editCount: Number,
  registrationDate: Date,
  groups: [String],
  lastVerified: Date
}
```

## Features

### 1. Automatic Account Creation

When a user authenticates via Wikipedia for the first time:
- A new user account is created automatically
- Username is set to their Wikipedia username
- Email is set to a placeholder (no email from OAuth)
- Country defaults to "Unknown" (can be updated later)

### 2. Account Linking

Existing users can link their Wikipedia accounts:
- OAuth tokens are stored securely
- User info is synced periodically
- Edit count is tracked

### 3. Edit History Verification

You can verify if a user has edited a specific article:
- Checks user's recent contributions (up to 500 edits)
- Supports article title matching
- Returns boolean verification result

### 4. Contribution Statistics

Get detailed statistics about a user's Wikipedia contributions:
- Total edit count
- Recent edits
- Edits by month
- Registration date
- User groups/permissions

## Security Considerations

1. **OAuth Tokens**: Store OAuth tokens securely (they're stored encrypted in the database)
2. **HTTPS in Production**: Use HTTPS for production callback URLs
3. **Token Expiration**: OAuth tokens should be refreshed periodically
4. **Rate Limiting**: Wikipedia API has rate limits - implement caching where possible

## Production Setup

For production deployment:

1. **Update OAuth Consumer**:
   - Add production callback URL: `https://yourdomain.com/auth/wikimedia/callback`
   - Update allowed grants as needed

2. **Update Environment Variables**:
   ```env
   FRONTEND_URL=https://yourdomain.com
   NODE_ENV=production
   ```

3. **HTTPS Required**: Wikimedia OAuth requires HTTPS in production

4. **Token Storage**: Consider using Redis or similar for OAuth token storage instead of in-memory Map

## Troubleshooting

### "Wikimedia OAuth is not configured"
- Check that `WIKIMEDIA_CONSUMER_KEY` and `WIKIMEDIA_CONSUMER_SECRET` are set in `.env`
- Restart the backend server after adding them

### "Failed to get request token"
- Verify consumer key and secret are correct
- Check callback URL matches what's registered in Wikimedia
- Ensure backend can reach Wikimedia servers

### "OAuth callback error"
- Check that callback URL in Wikimedia matches your frontend URL
- Verify CORS settings allow redirects
- Check backend logs for detailed error messages

### "User not found" when linking
- Ensure user is logged in before attempting to link
- Check that the `/link` endpoint is being used for account linking

## Example Usage in Code

### Check if user has Wikipedia account linked

```typescript
const { user } = useAuth();
if (user?.wikimediaAccount?.wikipediaUsername) {
  console.log(`Linked to Wikipedia: ${user.wikimediaAccount.wikipediaUsername}`);
}
```

### Verify article edit

```typescript
const response = await authApi.verifyArticleEdit("Climate_change");
if (response.verified) {
  console.log("User has edited this article!");
}
```

### Get contributions

```typescript
const response = await authApi.getWikimediaContributions();
console.log(`Total edits: ${response.contributions.totalEdits}`);
```

## Next Steps

- Implement periodic token refresh
- Add caching for Wikipedia API responses
- Create admin dashboard for viewing linked accounts
- Add badges for Wikipedia contributors
- Implement edit history verification in submission workflow

