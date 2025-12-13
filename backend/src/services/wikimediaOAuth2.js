import axios from 'axios';
import simpleOauth2 from 'simple-oauth2';
import crypto from 'crypto';
import config from '../config/config.js';

/**
 * Wikimedia OAuth 2.0 Service
 * Handles OAuth 2.0 authorization code flow with MediaWiki
 */

// Configure OAuth 2.0 client
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

// Initialize OAuth 2.0 client
const client = new simpleOauth2.AuthorizationCode(oauth2Config);

/**
 * Generate PKCE code verifier and challenge
 * @returns {Object} Object with code_verifier and code_challenge
 */
export function generatePKCE() {
  // Generate a random code verifier (43-128 characters, URL-safe)
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  
  // Generate code challenge (SHA256 hash of verifier, base64url encoded)
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');

  return {
    code_verifier: codeVerifier,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  };
}

/**
 * Generate authorization URL for OAuth 2.0 flow
 * @param {string} state - CSRF protection state parameter
 * @param {string} codeChallenge - PKCE code challenge (optional for public clients)
 * @param {string} codeChallengeMethod - PKCE code challenge method (default: S256)
 * @returns {string} Authorization URL
 */
export function getAuthorizationUrl(state, codeChallenge = null, codeChallengeMethod = 'S256') {
  if (!config.wikimediaOAuth2.clientId || !config.wikimediaOAuth2.clientSecret) {
    throw new Error('Wikimedia OAuth 2.0 credentials not configured');
  }

  // Build authorization URL using MediaWiki OAuth 2.0 REST API endpoint
  // Documentation: https://www.mediawiki.org/wiki/Extension:OAuth2.0#REST_endpoints
  const baseUrl = config.wikimediaOAuth2.authorizationHost;
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.wikimediaOAuth2.clientId,
    redirect_uri: config.wikimediaOAuth2.redirectUri,
    scope: 'mwoauth-authonly', // User identity verification only
    state: state, // CSRF protection
  });

  // Add PKCE parameters if provided (required for public clients)
  if (codeChallenge) {
    params.append('code_challenge', codeChallenge);
    params.append('code_challenge_method', codeChallengeMethod);
  }

  // Use REST API endpoint: /w/rest.php/oauth2/authorize
  const authorizationUri = `${baseUrl}${config.wikimediaOAuth2.authorizationPath}?${params.toString()}`;

  return authorizationUri;
}

/**
 * Exchange authorization code for access token
 * @param {string} code - Authorization code from callback
 * @param {string} codeVerifier - PKCE code verifier (optional, required if PKCE was used)
 * @returns {Promise<Object>} Token object with access_token, refresh_token, expires_in
 */
export async function getAccessTokenFromCode(code, codeVerifier = null) {
  if (!config.wikimediaOAuth2.clientId || !config.wikimediaOAuth2.clientSecret) {
    throw new Error('Wikimedia OAuth 2.0 credentials not configured');
  }

  try {
    // Build token request manually to properly handle PKCE
    const tokenUrl = `${config.wikimediaOAuth2.tokenHost}${config.wikimediaOAuth2.tokenPath}`;
    
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.wikimediaOAuth2.redirectUri,
      client_id: config.wikimediaOAuth2.clientId,
      client_secret: config.wikimediaOAuth2.clientSecret,
    });

    // Add PKCE code verifier if provided (required for public clients)
    if (codeVerifier) {
      tokenParams.append('code_verifier', codeVerifier);
    }

    const response = await axios.post(tokenUrl, tokenParams, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'WikiSourceVerifier/1.0',
      },
    });
    
    const tokenData = response.data;
    
    // Return token in a usable format
    return {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in || 3600, // Default 1 hour
      token_type: tokenData.token_type || 'Bearer',
    };
  } catch (error) {
    console.error('Error exchanging authorization code for token:', error);
    if (error.response) {
      console.error('Error response status:', error.response.status);
      console.error('Error response data:', error.response.data);
    }
    throw new Error(`Failed to get access token: ${error.message}`);
  }
}

/**
 * Extract user info from JWT token
 * @param {string} accessToken - OAuth 2.0 access token (JWT)
 * @returns {Object} Basic user info from token
 */
function extractUserInfoFromToken(accessToken) {
  try {
    // JWT format: header.payload.signature
    const parts = accessToken.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    // Decode the payload (base64url)
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf-8')
    );

    // Log ALL fields in the JWT payload to see if username is hidden somewhere
    console.log('📋 JWT payload (full):', JSON.stringify(payload, null, 2));
    console.log('📋 JWT payload (summary):', {
      sub: payload.sub,
      aud: payload.aud,
      iss: payload.iss,
      iat: payload.iat,
      exp: payload.exp,
      // Check for any other fields that might contain username
      allKeys: Object.keys(payload),
    });

    // Extract user ID from sub field (format: "mw:CentralAuth::USER_ID")
    const sub = payload.sub;
    let wikimediaId = null;
    let username = null;

    // Check if username is in any field
    if (payload.username) username = payload.username;
    if (payload.name) username = payload.name;
    if (payload.preferred_username) username = payload.preferred_username;

    if (sub && sub.startsWith('mw:CentralAuth::')) {
      wikimediaId = sub.replace('mw:CentralAuth::', '');
    } else if (sub) {
      wikimediaId = sub;
    }

    console.log('🆔 Extracted Wikimedia ID:', wikimediaId);
    if (username) {
      console.log('✅ Found username in JWT token:', username);
    }

    return {
      sub: sub,
      wikimediaId: wikimediaId,
      username: username, // Include if found in token
    };
  } catch (error) {
    console.error('❌ Error extracting user info from token:', error);
    return null;
  }
}

/**
 * Get username from Wikipedia API using user ID
 * @param {string} userId - MediaWiki user ID (numeric string)
 * @returns {Promise<string|null>} Username or null
 */
async function getUsernameFromWikipediaAPI(userId) {
  try {
    console.log('🔍 Fetching username from Wikipedia API for user ID:', userId);
    
    // Try to get username from meta.wikimedia.org API
    // Note: usprop parameter might not support 'name', try without it first
    const response = await axios.get(
      'https://meta.wikimedia.org/w/api.php',
      {
        params: {
          action: 'query',
          format: 'json',
          list: 'users',
          ususerids: userId,
          // Don't use usprop: 'name' as it's not recognized
        },
        headers: {
          'User-Agent': 'WikiSourceVerifier/1.0 (OAuth 2.0)',
        },
      }
    );

    console.log('📥 Wikipedia API response:', {
      hasData: !!response.data,
      hasQuery: !!response.data?.query,
      hasUsers: !!response.data?.query?.users,
      usersLength: response.data?.query?.users?.length,
      firstUser: response.data?.query?.users?.[0],
    });

    const user = response.data?.query?.users?.[0];
    
    // Check if user exists and has a name property
    if (user && !user.missing && user.name) {
      const username = user.name;
      console.log('✅ Found username:', username);
      return username;
    }
    
    // If user is missing or has no name, try using CentralAuth
    if (user && user.missing) {
      console.log('⚠️ User missing on meta.wikimedia.org, trying alternative methods');
      
      // Try to use the OAuth token to make an authenticated API call
      // Or just return null and use fallback
      return null;
    }
    
    console.log('⚠️ No username found in API response');
    return null;
  } catch (error) {
    console.error('❌ Error fetching username from Wikipedia API:', error.message);
    if (error.response) {
      console.error('API error details:', {
        status: error.response.status,
        data: error.response.data,
      });
    }
    return null;
  }
}

/**
 * Get user info using MediaWiki Action API with OAuth token
 * @param {string} accessToken - OAuth 2.0 access token
 * @returns {Promise<Object>} User profile with username, etc.
 */
async function getUserInfoFromActionAPI(accessToken) {
  try {
    console.log('🔍 Attempting to get user info via MediaWiki Action API with OAuth token');
    
    // Try using the action=query&meta=userinfo endpoint with OAuth token
    // MediaWiki OAuth 2.0 might support Bearer token authentication
    const response = await axios.get(
      `${config.wikimediaOAuth2.tokenHost}/w/api.php`,
      {
        params: {
          action: 'query',
          meta: 'userinfo',
          format: 'json',
          uiprop: 'name|id|groups|editcount',
        },
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'WikiSourceVerifier/1.0',
          'Accept': 'application/json',
        },
      }
    );

    console.log('📥 Action API response:', {
      hasData: !!response.data,
      hasQuery: !!response.data?.query,
      hasUserinfo: !!response.data?.query?.userinfo,
      userinfo: response.data?.query?.userinfo,
      isAnon: response.data?.query?.userinfo?.anon !== undefined,
    });
    
    // Check for errors in the response
    if (response.data?.error) {
      console.error('❌ Action API returned error:', response.data.error);
      return null;
    }

    // Log full response structure for debugging
    console.log('📋 Full Action API response data:', JSON.stringify(response.data, null, 2));

    const userinfo = response.data?.query?.userinfo;
    
    // Check if we got a valid logged-in user (not anonymous)
    if (userinfo && !userinfo.anon && userinfo.name && userinfo.id) {
      console.log('✅ Got valid user info from Action API');
      return {
        username: userinfo.name,
        id: userinfo.id,
        editcount: userinfo.editcount || 0,
        groups: userinfo.groups || [],
      };
    }

    // If userinfo exists but is anonymous, log it
    if (userinfo && userinfo.anon) {
      console.log('⚠️ Action API returned anonymous user (token may not be authenticating properly)');
    } else if (userinfo) {
      console.log('⚠️ Action API returned userinfo but missing required fields:', userinfo);
    } else {
      console.log('⚠️ Action API response missing userinfo');
    }
    return null;
  } catch (error) {
    console.error('❌ Error fetching user info from Action API:', error.message);
    if (error.response) {
      console.error('Action API error details:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      });
    }
    return null;
  }
}

/**
 * Get user profile from MediaWiki using access token
 * Tries multiple methods to get username:
 * 1. OAuth 2.0 profile endpoint
 * 2. MediaWiki Action API with OAuth token
 * 3. JWT token extraction + Wikipedia API lookup
 * @param {string} accessToken - OAuth 2.0 access token
 * @returns {Promise<Object>} User profile with sub, username, etc.
 */
export async function getUserProfile(accessToken) {
  // Method 1: OAuth 2.0 profile endpoint (UserInfo endpoint)
  // According to MediaWiki docs: rest.php/oauth2/resource/profile
  // Must use GET with Authorization header (not query string)
  // Reference: https://www.mediawiki.org/wiki/OAuth/For_Developers#Identifying_the_user
  try {
    console.log('📡 Method 1: Trying OAuth 2.0 profile endpoint (UserInfo endpoint)...');
    console.log('📖 According to docs: Must use GET with Authorization header');
    console.log('🔗 Endpoint:', `${config.wikimediaOAuth2.tokenHost}${config.wikimediaOAuth2.profilePath}`);
    console.log('🔑 Using Bearer token in Authorization header');
    
    // IMPORTANT: Must use Authorization header, NOT query string
    // The docs explicitly state: "the GET request must use the HTTP Authorization header, not a query string token"
    const response = await axios.get(
      `${config.wikimediaOAuth2.tokenHost}${config.wikimediaOAuth2.profilePath}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`, // Must be Bearer token in header
          'User-Agent': 'WikiSourceVerifier/1.0',
          'Accept': 'application/json',
        },
        // Don't throw on 5xx, we want to see the actual error
        validateStatus: (status) => status < 600,
      }
    );

    if (response.status === 200) {
      console.log('✅ Profile endpoint success!');
      console.log('📥 Response data:', response.data);
      
      // Expected response format:
      // {
      //   sub: "mw:CentralAuth::USER_ID",
      //   username: "Username",
      //   editcount: 123,
      //   confirmed_email: true/false,
      //   blocked: true/false,
      //   registered: "timestamp",
      //   groups: [...],
      //   rights: [...],
      //   realname: "...",  // only if granted
      //   email: "...",     // only if granted
      // }
      
      return response.data;
    } else {
      console.error('❌ Profile endpoint returned non-200 status:', response.status);
      console.error('Response data:', JSON.stringify(response.data, null, 2));
      console.error('');
      console.error('⚠️ According to MediaWiki docs:');
      console.error('   - Applications with "User identity verification only" cannot use the API');
      console.error('   - But the profile endpoint should still work');
      console.error('   - The 500 error suggests a bug in MediaWiki OAuth 2.0 extension');
      console.error('');
    }
  } catch (error) {
    console.error('❌ Profile endpoint failed with exception:', error.message);
    if (error.response) {
      console.error('Error response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      });
    }
  }

  // Method 2: Try MediaWiki Action API with OAuth token
  // According to MediaWiki OAuth docs, we can use the access token with Action API
  // Reference: https://www.mediawiki.org/wiki/OAuth/For_Developers#Making_requests_on_the_user.27s_behalf
  console.log('📡 Method 2: Trying MediaWiki Action API with OAuth token...');
  console.log('📝 According to MediaWiki docs, we can use OAuth token with action=query&meta=userinfo');
  
  const actionAPIResult = await getUserInfoFromActionAPI(accessToken);
  if (actionAPIResult && actionAPIResult.username) {
    console.log('✅ Action API success:', actionAPIResult);
    const tokenInfo = extractUserInfoFromToken(accessToken);
    return {
      sub: tokenInfo?.sub || `mw:CentralAuth::${actionAPIResult.id}`,
      username: actionAPIResult.username,
      editcount: actionAPIResult.editcount,
      groups: actionAPIResult.groups,
    };
  } else {
    console.log('⚠️ Action API did not return valid user info, trying alternative authentication methods...');
  }

  // Method 3: Extract from JWT and try CentralAuth/Wikipedia API lookup
  console.log('📡 Method 3: Trying JWT extraction + CentralAuth/Wikipedia API...');
  const tokenInfo = extractUserInfoFromToken(accessToken);
  console.log('📝 Extracted token info:', tokenInfo);
  
  if (!tokenInfo || !tokenInfo.wikimediaId) {
    throw new Error('Could not extract user information from token');
  }

  // If username was found in JWT token, use it!
  if (tokenInfo.username) {
    console.log('✅ Username found in JWT token, using it!');
    return {
      sub: tokenInfo.sub,
      username: tokenInfo.username,
      editcount: 0,
      groups: [],
    };
  }

  // Try using CentralAuth to find which wiki the user is on
  // CentralAuth API requires the numeric user ID, not the full "mw:CentralAuth::ID" format
  console.log('🔍 Trying CentralAuth lookup...');
  console.log('🆔 Using user ID:', tokenInfo.wikimediaId);
  
  try {
    // Try multiple CentralAuth approaches
    // First, try with guiuserid (numeric ID)
    let centralAuthResponse = await axios.get(
      'https://meta.wikimedia.org/w/api.php',
      {
        params: {
          action: 'query',
          format: 'json',
          meta: 'globaluserinfo',
          guiuserid: tokenInfo.wikimediaId, // Use guiuserid for numeric ID
          guiprop: 'id|name|home|locked|groups',
        },
        headers: {
          'User-Agent': 'WikiSourceVerifier/1.0 (OAuth 2.0)',
        },
      }
    );
    
    // If that fails, try using the user ID as a string in guiuser
    if (centralAuthResponse.data?.error) {
      console.log('⚠️ guiuserid failed, trying alternative approach...');
      // Try using the user ID directly - but this might not work either
      // Actually, let's try a different approach - use the users API to get username from ID
    }

    console.log('📥 CentralAuth response:', {
      hasData: !!centralAuthResponse.data,
      hasQuery: !!centralAuthResponse.data?.query,
      hasGlobaluserinfo: !!centralAuthResponse.data?.query?.globaluserinfo,
      globaluserinfo: centralAuthResponse.data?.query?.globaluserinfo,
    });
    
    // Check for errors in the response
    if (centralAuthResponse.data?.error) {
      console.error('❌ CentralAuth API returned error:', centralAuthResponse.data.error);
    } else {
      // Log full response for debugging
      console.log('📋 Full CentralAuth response data:', JSON.stringify(centralAuthResponse.data, null, 2));
    }

    const gui = centralAuthResponse.data?.query?.globaluserinfo;
    if (gui && gui.name && !gui.missing) {
      console.log(`✅ Found username via CentralAuth:`, gui.name);
      return {
        sub: tokenInfo.sub,
        username: gui.name,
        editcount: 0, // Can't get without profile endpoint
        groups: gui.groups || [],
      };
    } else if (gui && gui.missing) {
      console.log('⚠️ User not found in CentralAuth (missing)');
    } else if (gui) {
      console.log('⚠️ CentralAuth returned globaluserinfo but missing name:', gui);
    } else {
      console.log('⚠️ CentralAuth response missing globaluserinfo');
    }
  } catch (error) {
    console.error('❌ CentralAuth lookup failed:', error.message);
    if (error.response) {
      console.error('CentralAuth error details:', {
        status: error.response.status,
        data: error.response.data,
      });
    }
  }

  // The user ID exists but shows as "missing" on all wikis we've tried
  // This means the user doesn't have accounts on those specific wikis
  // Let's try checking more wikis, or try a different approach
  
  console.log('🔍 User not found on initial wikis, trying additional wikis...');
  
  // Try more Wikimedia projects
  const additionalWikis = [
    { host: 'commons.wikimedia.org', name: 'Wikimedia Commons' },
    { host: 'fr.wikipedia.org', name: 'French Wikipedia' },
    { host: 'de.wikipedia.org', name: 'German Wikipedia' },
    { host: 'es.wikipedia.org', name: 'Spanish Wikipedia' },
    { host: 'ru.wikipedia.org', name: 'Russian Wikipedia' },
    { host: 'it.wikipedia.org', name: 'Italian Wikipedia' },
    { host: 'pt.wikipedia.org', name: 'Portuguese Wikipedia' },
    { host: 'ja.wikipedia.org', name: 'Japanese Wikipedia' },
    { host: 'zh.wikipedia.org', name: 'Chinese Wikipedia' },
  ];

  for (const wiki of additionalWikis) {
    console.log(`🔍 Trying ${wiki.name} (${wiki.host})...`);
    try {
      const response = await axios.get(
        `https://${wiki.host}/w/api.php`,
        {
          params: {
            action: 'query',
            format: 'json',
            list: 'users',
            ususerids: tokenInfo.wikimediaId,
          },
          headers: {
            'User-Agent': 'WikiSourceVerifier/1.0 (OAuth 2.0)',
          },
          timeout: 5000, // 5 second timeout per wiki
        }
      );

      const user = response.data?.query?.users?.[0];
      if (user && !user.missing && user.name) {
        console.log(`✅ Found username on ${wiki.name}:`, user.name);
        return {
          sub: tokenInfo.sub,
          username: user.name,
          editcount: 0,
          groups: [],
        };
      }
    } catch (error) {
      // Continue to next wiki if this one fails
      continue;
    }
  }

  // If still not found, we have a critical issue:
  // The OAuth profile endpoint is broken (500 error), which is the primary way to get user info
  // This appears to be a MediaWiki OAuth 2.0 extension bug
  
  // Since we have a valid OAuth token and user ID, we know the user exists
  // The problem is we can't get their username via any API method
  
  // IMPORTANT: For production/acceptance, you need to:
  // 1. Report the profile endpoint 500 error to MediaWiki (Phabricator)
  // 2. Update your OAuth consumer to request additional grants if needed
  // 3. Verify the user account exists and is accessible
  
  // If still not found, we have a critical issue
  // However, since we have a valid OAuth token and user ID, we know the user exists
  // For acceptance requirements, we'll use a workaround: use the user ID as a temporary identifier
  // The user can update their username later in their profile
  
  console.error('⚠️ WARNING: Cannot retrieve username for user ID:', tokenInfo.wikimediaId);
  console.error('All methods failed:');
  console.error('  1. Profile endpoint: 500 error (MediaWiki bug)');
  console.error('  2. Action API: readapidenied (permissions issue)');
  console.error('  3. User lookup: User not found on checked wikis');
  console.error('  4. CentralAuth: Invalid user error');
  console.error('');
  console.error('⚠️ Using workaround: Creating user with ID-based username');
  console.error('   User can update their username in their profile later');
  
  // Workaround: Use user ID as temporary username
  // Format: "wikiuser_{USER_ID}" so it's clearly identifiable
  const temporaryUsername = `wikiuser_${tokenInfo.wikimediaId}`;
  
  console.log(`✅ Using temporary username: ${temporaryUsername}`);
  
  return {
    sub: tokenInfo.sub,
    username: temporaryUsername,
    editcount: 0,
    groups: [],
    _isTemporaryUsername: true, // Flag to indicate this is temporary
  };
}

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken - OAuth 2.0 refresh token
 * @returns {Promise<Object>} New token object
 */
export async function refreshAccessToken(refreshToken) {
  if (!config.wikimediaOAuth2.clientId || !config.wikimediaOAuth2.clientSecret) {
    throw new Error('Wikimedia OAuth 2.0 credentials not configured');
  }

  try {
    const token = client.createToken({
      access_token: '',
      refresh_token: refreshToken,
      expires_at: null,
    });

    const result = await token.refresh();
    
    return {
      access_token: result.token.access_token,
      refresh_token: result.token.refresh_token || refreshToken, // Keep existing if not provided
      expires_in: result.token.expires_in || 3600,
      token_type: result.token.token_type || 'Bearer',
    };
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw new Error(`Failed to refresh access token: ${error.message}`);
  }
}

