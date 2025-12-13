# MediaWiki OAuth 2.0 Integration Issue Report

**Date:** December 2024  
**Project:** SourceWiki - Wikipedia Source Verification Platform  
**OAuth Consumer:** WikiSource-Verifier  
**Consumer Key:** `21b9ea4b08640fbc519564e8f01ac9a7`  
**OAuth Protocol:** OAuth 2.0  
**Status:** ⚠️ Workaround Implemented

---

## Executive Summary

The MediaWiki OAuth 2.0 profile endpoint (`/w/rest.php/oauth2/resource/profile`) consistently returns HTTP 500 errors, preventing retrieval of user information (username, edit count, groups) after successful OAuth authorization. This is a critical blocker for user identification in the OAuth flow.

A temporary workaround has been implemented using user ID-based temporary usernames, allowing the OAuth flow to complete successfully. However, this requires users to manually update their username post-authentication.

---

## Problem Description

### Symptoms

1. **OAuth Flow Completes Successfully**: Users can authorize the application via MediaWiki OAuth 2.0
2. **Token Exchange Works**: Authorization code is successfully exchanged for access token
3. **Profile Endpoint Fails**: When attempting to retrieve user profile information, the endpoint returns HTTP 500 with error: `"Error: exception of type TypeError"`

### Error Details

**Endpoint:** `https://meta.wikimedia.org/w/rest.php/oauth2/resource/profile`  
**Method:** GET  
**Headers:**
```
Authorization: Bearer {access_token}
User-Agent: WikiSourceVerifier/1.0
Accept: application/json
```

**Response:**
```json
{
  "message": "Error: exception of type TypeError",
  "reqId": "{request-id}",
  "httpCode": 500,
  "httpReason": "Internal Server Error"
}
```

### Impact

- Cannot retrieve username from OAuth token
- Cannot retrieve user edit count
- Cannot retrieve user groups/permissions
- Blocks complete user profile creation
- Requires workaround for user identification

---

## Investigation & Attempted Solutions

### Method 1: OAuth 2.0 Profile Endpoint (Primary Method)
**Status:** ❌ Failed  
**Error:** HTTP 500 - TypeError exception  
**Attempts:**
- GET request to `/w/rest.php/oauth2/resource/profile`
- POST request to `/w/rest.php/oauth2/resource/profile`
- Various header combinations
- Different content-type headers

**Result:** All attempts return the same 500 error with TypeError exception.

### Method 2: MediaWiki Action API with OAuth Token
**Status:** ❌ Failed  
**Endpoint:** `https://meta.wikimedia.org/w/api.php?action=query&meta=userinfo`  
**Error:** 
```json
{
  "code": "readapidenied",
  "info": "You need read permission to use this module."
}
```

**Analysis:** The OAuth token does not have sufficient permissions/scopes to access the Action API. The `mwoauth-authonly` scope appears to be too limited.

### Method 3: JWT Token Extraction
**Status:** ⚠️ Partial  
**Result:** Successfully extracts user ID from JWT token (`mw:CentralAuth::USER_ID`)  
**Limitation:** JWT payload does not contain username field

**JWT Payload Structure:**
```json
{
  "aud": "21b9ea4b08640fbc519564e8f01ac9a7",
  "jti": "...",
  "iat": 1765631218.71322,
  "nbf": 1765631218.713223,
  "exp": 1765645618.702291,
  "sub": "mw:CentralAuth::76213678",
  "iss": "https://meta.wikimedia.org",
  "ratelimit": {
    "requests_per_unit": 5000,
    "unit": "HOUR"
  },
  "scopes": []
}
```

### Method 4: CentralAuth API Lookup
**Status:** ❌ Failed  
**Endpoint:** `https://meta.wikimedia.org/w/api.php?action=query&meta=globaluserinfo&guiuserid={USER_ID}`  
**Error:**
```json
{
  "code": "invaliduser",
  "info": "Invalid username \"154.161.183.46\"."
}
```

**Analysis:** API treats requests as anonymous (IP-based) rather than authenticated, preventing user lookup.

### Method 5: Multiple Wiki User Lookup
**Status:** ❌ Failed  
**Wikis Checked:**
- meta.wikimedia.org
- en.wikipedia.org
- www.wikidata.org
- commons.wikimedia.org
- fr.wikipedia.org
- de.wikipedia.org
- es.wikipedia.org
- ru.wikipedia.org
- it.wikipedia.org
- pt.wikipedia.org
- ja.wikipedia.org
- zh.wikipedia.org

**Result:** All wikis return user as "missing":
```json
{
  "query": {
    "users": [{
      "userid": 76213678,
      "missing": ""
    }]
  }
}
```

**Analysis:** User accounts exist (OAuth succeeds) but are not found on queried wikis, or lookup requires authentication we don't have.

---

## Root Cause Analysis

### Primary Issue
The OAuth 2.0 profile endpoint (`/w/rest.php/oauth2/resource/profile`) appears to have a bug in the MediaWiki OAuth 2.0 extension that causes a TypeError exception when processing valid access tokens.

### Key Finding from Documentation
According to MediaWiki OAuth documentation (https://www.mediawiki.org/wiki/OAuth/For_Developers):

> "Applications which need minimal privileges (have been registered as User identity verification only) cannot use the API at all."

**However**, the same documentation explicitly states that the profile endpoint (`rest.php/oauth2/resource/profile`) **should work** and return:
- `sub` (central user ID)
- `username`
- `editcount`
- `confirmed_email`
- `blocked`
- `registered`
- `groups`
- `rights`
- `realname` (only if granted)
- `email` (only if granted)

**Critical Implementation Details from Documentation:**
1. "the GET request must use the HTTP Authorization header, not a query string token"
2. "API requests including rest.php/oauth2/resource/profile must be authenticated with an HTTP Authorization header containing the access token"
3. Format: `Authorization: Bearer {access_token}`

**Our Implementation Status:**
✅ Using GET request (correct)  
✅ Using Authorization header with Bearer token (correct)  
✅ Not using query string token (correct)  
✅ Request format matches documentation exactly  

**Conclusion:** Our implementation follows the documentation correctly. The HTTP 500 error with "TypeError" exception indicates a bug in the MediaWiki OAuth 2.0 extension's profile endpoint implementation, not an issue with our code.

### Contributing Factors

1. **Limited OAuth Scope**: The `mwoauth-authonly` scope may not provide sufficient permissions for:
   - Reading user profile via Action API
   - Querying user information via standard MediaWiki APIs

2. **Token Authentication**: The OAuth 2.0 Bearer token does not appear to authenticate requests to standard MediaWiki APIs (Action API, CentralAuth), causing them to be treated as anonymous requests.

3. **User Account Distribution**: Users may not have accounts on all Wikimedia wikis, making cross-wiki lookups unreliable.

---

## Workaround Implementation

### Current Solution
When all methods fail to retrieve username, the system:

1. Extracts user ID from JWT token (`mw:CentralAuth::USER_ID`)
2. Creates temporary username: `wikiuser_{USER_ID}`
3. Completes OAuth flow with temporary username
4. Allows user to update username post-authentication

### Code Location
- Service: `backend/src/services/wikimediaOAuth2.js`
- Function: `getUserProfile()`
- Controller: `backend/src/controllers/wikimediaOAuth2Controller.js`

### Limitations
- Users must manually update username after login
- Not ideal for production/acceptance requirements
- Username may not match their actual Wikimedia username

---

## Test Cases & Evidence

### Test Account 1
- **User ID:** 81123834
- **OAuth Flow:** ✅ Success
- **Profile Endpoint:** ❌ HTTP 500
- **Username Retrieval:** ❌ Failed

### Test Account 2
- **User ID:** 76213678
- **OAuth Flow:** ✅ Success
- **Profile Endpoint:** ❌ HTTP 500
- **Username Retrieval:** ❌ Failed
- **JWT Payload:** Contains user ID but no username

---

## OAuth Consumer Configuration

### Current Settings
- **Application Name:** WikiSource-Verifier
- **OAuth Protocol:** OAuth 2.0
- **Project:** meta.wikimedia.org
- **Callback URL:** `http://localhost:5000/api/auth/wikimedia/callback`
- **Grants:** mwoauth-authonly (basic access only)
- **Client Type:** Confidential
- **Status:** Approved

### Consumer Registration
URL: https://meta.wikimedia.org/wiki/Special:OAuthConsumerRegistration/list

---

## Recommendations

### Immediate Actions

1. **Report Bug to MediaWiki**
   - **Platform:** Phabricator (https://phabricator.wikimedia.org/)
   - **Component:** OAuth 2.0 Extension
   - **Issue:** Profile endpoint (`/w/rest.php/oauth2/resource/profile`) returns HTTP 500 with TypeError
   - **Evidence:** Include request/response logs and error details

2. **Review OAuth Consumer Grants**
   - Check if additional grants/permissions are needed
   - Verify if `mwoauth-authonly` is sufficient for profile retrieval
   - Consider requesting additional scopes if available

3. **Contact MediaWiki Support**
   - OAuth mailing list or IRC channel
   - Query about OAuth 2.0 profile endpoint issues
   - Request clarification on proper usage

### Long-term Solutions

1. **Fix Profile Endpoint** (MediaWiki responsibility)
   - Debug TypeError in OAuth 2.0 extension
   - Ensure proper error handling
   - Update documentation if behavior changed

2. **Alternative Approach**
   - Consider OAuth 1.0a if OAuth 2.0 remains unstable
   - Implement custom user lookup mechanism
   - Use alternative authentication flow

3. **Enhanced Workaround**
   - Add UI for username entry post-OAuth
   - Implement username verification against Wikimedia
   - Auto-update username when profile endpoint is fixed

---

## Technical Details

### Request Flow
1. User clicks "Login with Wikipedia"
2. Redirected to: `https://meta.wikimedia.org/w/rest.php/oauth2/authorize?...`
3. User authorizes application
4. Redirected to callback: `/api/auth/wikimedia/callback?code=...&state=...`
5. Backend exchanges code for access token ✅
6. Backend attempts to get user profile ❌ (HTTP 500)
7. Workaround creates temporary username ✅
8. User logged in with temporary username

### Code References

**Profile Endpoint Call:**
```javascript
// backend/src/services/wikimediaOAuth2.js
const response = await axios.get(
  `${config.wikimediaOAuth2.tokenHost}${config.wikimediaOAuth2.profilePath}`,
  {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'User-Agent': 'WikiSourceVerifier/1.0',
      'Accept': 'application/json',
    },
  }
);
```

**Workaround Implementation:**
```javascript
// backend/src/services/wikimediaOAuth2.js
const temporaryUsername = `wikiuser_${tokenInfo.wikimediaId}`;
return {
  sub: tokenInfo.sub,
  username: temporaryUsername,
  editcount: 0,
  groups: [],
  _isTemporaryUsername: true,
};
```

---

## Environment Information

- **Node.js Version:** (check with `node --version`)
- **OAuth Library:** `simple-oauth2` (latest)
- **HTTP Client:** `axios` (latest)
- **Backend Framework:** Express.js
- **Database:** MongoDB (MongoDB Atlas)

---

## Contact & References

### MediaWiki Resources
- OAuth Documentation: https://www.mediawiki.org/wiki/OAuth/For_Developers
- OAuth 2.0 REST Endpoints: https://www.mediawiki.org/wiki/Extension:OAuth2.0#REST_endpoints
- Phabricator: https://phabricator.wikimedia.org/
- OAuth Consumer Management: https://meta.wikimedia.org/wiki/Special:OAuthConsumerRegistration/list

### Project Information
- **Repository:** SourceWiki
- **Backend:** Node.js/Express
- **Frontend:** React/TypeScript

---

## Conclusion

The MediaWiki OAuth 2.0 profile endpoint is currently non-functional, returning HTTP 500 errors for all valid access tokens. This prevents proper user identification in the OAuth flow. A workaround has been implemented to allow the flow to complete, but this is not an ideal long-term solution.

**Priority:** High - Blocks proper user identification  
**Severity:** Critical for production use  
**Workaround Status:** ✅ Implemented  
**Permanent Fix:** ⏳ Pending MediaWiki bug fix

---

**Report Generated:** December 2024  
**Last Updated:** December 2024

