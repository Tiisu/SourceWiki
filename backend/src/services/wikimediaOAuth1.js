import axios from 'axios';
import crypto from 'crypto';
import config from '../config/config.js';

// Add nodeEnv to config check
if (!config.nodeEnv) {
  config.nodeEnv = process.env.NODE_ENV || 'development';
}

/**
 * Wikimedia OAuth 1.0a Service
 * Implements OAuth 1.0a according to https://oauth.net/core/1.0a/
 * 
 * Reference: https://www.mediawiki.org/wiki/OAuth/For_Developers#OAuth_1.0a
 */

/**
 * Percent-encode a string according to RFC 3986 Section 2.1
 * OAuth 1.0a Section 5.1: Parameter Encoding
 */
function percentEncode(str) {
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A');
}

/**
 * Normalize URL according to RFC 3986 Section 3
 * OAuth 1.0a Section 9.1.2: Construct Request URL
 */
function normalizeUrl(url) {
  const urlObj = new URL(url);
  // Scheme and authority MUST be lowercase
  const scheme = urlObj.protocol.slice(0, -1).toLowerCase();
  const authority = urlObj.host.toLowerCase();
  // Port should be included only if it's not the default port
  let port = '';
  if (urlObj.port && 
      ((scheme === 'http' && urlObj.port !== '80') ||
       (scheme === 'https' && urlObj.port !== '443'))) {
    port = `:${urlObj.port}`;
  }
  // Path must be included
  const path = urlObj.pathname;
  
  return `${scheme}://${authority}${port}${path}`;
}

/**
 * Collect and normalize parameters
 * OAuth 1.0a Section 9.1.1: Normalize Request Parameters
 */
function collectParameters(url, params) {
  const allParams = {};
  
  // 1. Parse query parameters from URL
  const urlObj = new URL(url);
  urlObj.searchParams.forEach((value, key) => {
    allParams[key] = value;
  });
  
  // 2. Add parameters from request body or query string
  Object.assign(allParams, params);
  
  // 3. Remove oauth_signature if present (it's not included in signature calculation)
  delete allParams.oauth_signature;
  
  return allParams;
}

/**
 * Create normalized parameter string
 * OAuth 1.0a Section 9.1.1: Normalize Request Parameters
 */
function normalizeParameters(params) {
  // 1. Percent encode names and values
  const encoded = [];
  for (const key in params) {
    if (params.hasOwnProperty(key)) {
      encoded.push([percentEncode(key), percentEncode(String(params[key]))]);
    }
  }
  
  // 2. Sort by name, then by value if names are equal
  encoded.sort((a, b) => {
    if (a[0] < b[0]) return -1;
    if (a[0] > b[0]) return 1;
    if (a[1] < b[1]) return -1;
    if (a[1] > b[1]) return 1;
    return 0;
  });
  
  // 3. Join with &
  return encoded.map(pair => `${pair[0]}=${pair[1]}`).join('&');
}

/**
 * Create Signature Base String
 * OAuth 1.0a Section 9.1: Signature Base String
 */
function createSignatureBaseString(method, url, params) {
  // 1. Normalize Request URL (Section 9.1.2)
  const normalizedUrl = normalizeUrl(url);
  
  // 2. Collect parameters (Section 9.1.1)
  const collectedParams = collectParameters(url, params);
  
  // 3. Normalize parameters (Section 9.1.1)
  const normalizedParams = normalizeParameters(collectedParams);
  
  // 4. Construct signature base string
  // METHOD + "&" + encoded(normalized_url) + "&" + encoded(normalized_parameters)
  return [
    percentEncode(method.toUpperCase()),
    percentEncode(normalizedUrl),
    percentEncode(normalizedParams)
  ].join('&');
}

/**
 * Create signing key
 * OAuth 1.0a Section 9.2: HMAC-SHA1
 */
function createSigningKey(consumerSecret, tokenSecret = '') {
  return `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`;
}

/**
 * Calculate HMAC-SHA1 signature
 * OAuth 1.0a Section 9.2: HMAC-SHA1
 */
function calculateSignature(signatureBaseString, signingKey) {
  return crypto
    .createHmac('sha1', signingKey)
    .update(signatureBaseString)
    .digest('base64');
}

/**
 * Build OAuth Authorization header
 * OAuth 1.0a Section 5.4: OAuth HTTP Authorization Scheme
 */
function buildAuthorizationHeader(oauthParams) {
  // Sort parameters
  const sortedKeys = Object.keys(oauthParams).sort();
  
  // Build header value: OAuth + space + comma-separated list of parameter="value" pairs
  const paramString = sortedKeys
    .map(key => `${percentEncode(key)}="${percentEncode(String(oauthParams[key]))}"`)
    .join(', ');
  
  return `OAuth ${paramString}`;
}

/**
 * Make a signed OAuth 1.0a request to MediaWiki
 */
async function makeSignedRequest(method, url, params, consumerKey, consumerSecret, token = null, tokenSecret = '') {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString('hex');

  // Build OAuth protocol parameters (Section 5.2)
  const oauthParams = {
    oauth_consumer_key: consumerKey,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_nonce: nonce,
    oauth_version: '1.0',
  };

  if (token) {
    oauthParams.oauth_token = token;
  }

  // Combine all parameters for signature calculation
  // OAuth params go in Authorization header, request params go in URL/body
  const allParams = { ...params, ...oauthParams };
  
  // Create signature base string (Section 9.1)
  const signatureBaseString = createSignatureBaseString(method, url, allParams);
  
  // Create signing key (Section 9.2)
  const signingKey = createSigningKey(consumerSecret, tokenSecret);
  
  // Calculate signature (Section 9.2)
  const signature = calculateSignature(signatureBaseString, signingKey);
  
  // Add signature to OAuth params
  oauthParams.oauth_signature = signature;

  // Build Authorization header (Section 5.4)
  const authHeader = buildAuthorizationHeader(oauthParams);

  // Build final URL with request parameters in query string
  const urlObj = new URL(url);
  Object.keys(params).forEach(key => {
    urlObj.searchParams.set(key, params[key]);
  });
  const finalUrl = urlObj.toString();
  
  if (config.nodeEnv === 'development') {
    console.log('📤 OAuth 1.0a Request:', {
      method,
      url: finalUrl,
      normalizedUrl: normalizeUrl(url),
      signatureBaseString: signatureBaseString.substring(0, 200) + (signatureBaseString.length > 200 ? '...' : ''),
    });
  }

  try {
    const response = await axios({
      method,
      url: finalUrl,
      headers: {
        'Authorization': authHeader,
        'User-Agent': 'WikiSourceVerifier/1.0',
        'Accept': 'application/json',
      },
    });

    // Check if we got HTML instead of JSON (error page)
    if (response.headers['content-type']?.includes('text/html')) {
      const htmlText = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      let errorMsg = 'MediaWiki returned HTML error page instead of JSON.';
      
      // Try to extract error message from HTML
      const errorMatch = htmlText.match(/wgErrorPageMessageKey[":\s]+"([^"]+)"/);
      if (errorMatch) {
        errorMsg += ` Error: ${errorMatch[1]}`;
      }
      
      console.error('❌ HTML Error Response:', {
        status: response.status,
        statusText: response.statusText,
        url: finalUrl,
        errorMessageKey: errorMatch ? errorMatch[1] : 'unknown',
      });
      
      throw new Error(errorMsg);
    }

    return response.data;
  } catch (error) {
    // Enhanced error logging for debugging
    if (error.response) {
      console.error('❌ OAuth Request Failed:', {
        status: error.response.status,
        statusText: error.response.statusText,
        url: finalUrl,
        normalizedUrl: normalizeUrl(url),
        responseData: typeof error.response.data === 'string' 
          ? error.response.data.substring(0, 500) 
          : JSON.stringify(error.response.data).substring(0, 500),
        authHeader: authHeader.substring(0, 200) + '...',
      });
    }
    throw error;
  }
}

/**
 * Get request token to initiate OAuth flow
 * OAuth 1.0a Section 6.1: Obtaining an Unauthorized Request Token
 * MediaWiki returns JSON: { token: "...", key: "..." }
 */
export async function getRequestToken() {
  if (!config.wikimediaOAuth1.consumerKey || !config.wikimediaOAuth1.consumerSecret) {
    throw new Error('Wikimedia OAuth 1.0a credentials not configured');
  }

  if (config.nodeEnv === 'development') {
    console.log('🔐 Initiating OAuth 1.0a request token...');
    console.log('📝 Config:', {
      consumerKey: config.wikimediaOAuth1.consumerKey?.substring(0, 8) + '...',
      hasSecret: !!config.wikimediaOAuth1.consumerSecret,
      callbackUrl: config.wikimediaOAuth1.callbackUrl,
      requestTokenUrl: config.wikimediaOAuth1.requestTokenUrl,
    });
  }

  try {
    // OAuth 1.0a Section 6.1.1: oauth_callback parameter
    // MediaWiki requires "oob" (out-of-band) when consumer doesn't allow dynamic callbacks
    // The fixed callback URL registered with the consumer during registration will still be used
    // for redirects after user authorization, but we must pass "oob" in the request token request
    const params = {
      oauth_callback: 'oob', // Must be exactly "oob" (case-sensitive) when consumer doesn't allow dynamic callbacks
      format: 'json', // MediaWiki-specific: request JSON response
    };

    // Make signed request to Special:OAuth/initiate
    const response = await makeSignedRequest(
      'GET',
      config.wikimediaOAuth1.requestTokenUrl,
      params,
      config.wikimediaOAuth1.consumerKey,
      config.wikimediaOAuth1.consumerSecret
    );

    if (config.nodeEnv === 'development') {
      console.log('📥 OAuth response received:', response);
    }

    // MediaWiki returns JSON with 'key' (token) and 'secret' (token secret) fields
    if (response.error) {
      throw new Error(`OAuth error: ${response.error} - ${response.message || ''}`);
    }

    // MediaWiki uses 'key' for the token and 'secret' for the token secret
    if (!response.key || !response.secret) {
      throw new Error('Invalid response from OAuth provider. Missing key or secret. Response: ' + JSON.stringify(response));
    }

    const oauthToken = response.key;
    const oauthTokenSecret = response.secret;

    // Build authorization URL (Section 6.2: Obtaining User Authorization)
    // MediaWiki authorization URL format: Special:OAuth/authorize?oauth_token=...
    // Only oauth_token is required, oauth_consumer_key is not needed
    const urlObj = new URL(config.wikimediaOAuth1.authorizeUrl);
    urlObj.searchParams.set('oauth_token', oauthToken);
    const authorizeUrl = urlObj.toString();
    
    if (config.nodeEnv === 'development') {
      console.log('🔗 Built authorization URL:', authorizeUrl);
    }

    if (config.nodeEnv === 'development') {
      console.log('✅ Request token obtained successfully');
      console.log('🔗 Authorization URL:', authorizeUrl);
    }

    return {
      oauthToken,
      oauthTokenSecret,
      authorizeUrl,
    };
  } catch (error) {
    console.error('❌ Error getting request token:', error);
    if (error.response) {
      console.error('❌ Response status:', error.response.status);
      console.error('❌ Response data:', error.response.data);
    }
    throw error;
  }
}

/**
 * Exchange request token for access token
 * OAuth 1.0a Section 6.3: Obtaining an Access Token
 * MediaWiki returns JSON: { token: "...", key: "..." }
 */
export async function getAccessToken(oauthToken, oauthTokenSecret, oauthVerifier) {
  if (!config.wikimediaOAuth1.consumerKey || !config.wikimediaOAuth1.consumerSecret) {
    throw new Error('Wikimedia OAuth 1.0a credentials not configured');
  }

  if (config.nodeEnv === 'development') {
    console.log('🔄 Exchanging request token for access token...');
  }

  try {
    // OAuth 1.0a Section 6.3.1: oauth_verifier parameter
    const params = {
      oauth_verifier: oauthVerifier,
      format: 'json', // MediaWiki-specific: request JSON response
    };

    // Make signed request to Special:OAuth/token
    // Signed with consumer key/secret AND request token/secret (Section 6.3)
    const response = await makeSignedRequest(
      'GET',
      config.wikimediaOAuth1.accessTokenUrl,
      params,
      config.wikimediaOAuth1.consumerKey,
      config.wikimediaOAuth1.consumerSecret,
      oauthToken,
      oauthTokenSecret
    );

    if (config.nodeEnv === 'development') {
      console.log('📥 Access token response:', response);
    }

    // MediaWiki returns JSON with 'key' (token) and 'secret' (token secret) fields
    if (response.error) {
      throw new Error(`OAuth error: ${response.error} - ${response.message || ''}`);
    }

    // MediaWiki uses 'key' for the token and 'secret' for the token secret
    if (!response.key || !response.secret) {
      throw new Error('Invalid response from OAuth provider. Missing key or secret. Response: ' + JSON.stringify(response));
    }

    const accessToken = response.key;
    const accessTokenSecret = response.secret;

    if (config.nodeEnv === 'development') {
      console.log('✅ Access token obtained successfully');
    }

    return {
      accessToken,
      accessTokenSecret,
    };
  } catch (error) {
    console.error('❌ Error getting access token:', error);
    if (error.response) {
      console.error('❌ Response status:', error.response.status);
      console.error('❌ Response data:', error.response.data);
    }
    throw error;
  }
}

/**
 * Make authenticated API request using OAuth 1.0a tokens
 * OAuth 1.0a Section 7: Accessing Protected Resources
 */
export async function makeAuthenticatedRequest(accessToken, accessTokenSecret, url, method = 'GET', params = {}) {
  if (!config.wikimediaOAuth1.consumerKey || !config.wikimediaOAuth1.consumerSecret) {
    throw new Error('Wikimedia OAuth 1.0a credentials not configured');
  }

  try {
    // Make signed request with access token
    const response = await makeSignedRequest(
      method,
      url,
      params,
      config.wikimediaOAuth1.consumerKey,
      config.wikimediaOAuth1.consumerSecret,
      accessToken,
      accessTokenSecret
    );

    return response;
  } catch (error) {
    console.error('❌ Error making authenticated request:', error);
    if (error.response) {
      console.error('❌ Response status:', error.response.status);
      console.error('❌ Response data:', error.response.data);
    }
    throw error;
  }
}

/**
 * Get user info using OAuth 1.0a authenticated API request
 * MediaWiki Action API: https://www.mediawiki.org/wiki/API:Main_page
 * For meta.wikimedia.org, the API endpoint is /w/api.php
 */
export async function getUserInfo(accessToken, accessTokenSecret) {
  try {
    // Construct the full API URL
    const apiUrl = `${config.wikimediaOAuth1.apiBaseUrl}/w/api.php`;
    
    if (config.nodeEnv === 'development') {
      console.log('🔍 Getting user info from:', apiUrl);
    }

    // Try minimal userinfo first (just name and id)
    // If the grant is "User identity verification only", we may not have access to groups/editcount
    let response;
    try {
      response = await makeAuthenticatedRequest(
        accessToken,
        accessTokenSecret,
        apiUrl,
        'GET',
        {
          action: 'query',
          meta: 'userinfo',
          uiprop: 'name|id',
          format: 'json',
        }
      );
    } catch (error) {
      // If minimal request fails, try with additional properties (might work with different grants)
      if (error.message && error.message.includes('read permission')) {
        // Try with just name (some grants only allow this)
        response = await makeAuthenticatedRequest(
          accessToken,
          accessTokenSecret,
          apiUrl,
          'GET',
          {
            action: 'query',
            meta: 'userinfo',
            uiprop: 'name',
            format: 'json',
          }
        );
      } else {
        throw error;
      }
    }
    
    // If we got basic info, try to get additional properties in a separate request
    if (response.query?.userinfo?.name && response.query?.userinfo?.id) {
      try {
        const extendedResponse = await makeAuthenticatedRequest(
          accessToken,
          accessTokenSecret,
          apiUrl,
          'GET',
          {
            action: 'query',
            meta: 'userinfo',
            uiprop: 'name|id|groups|editcount|rights',
            format: 'json',
          }
        );
        // Use extended response if successful
        if (extendedResponse.query?.userinfo) {
          response = extendedResponse;
        }
      } catch (extendedError) {
        // If extended request fails, continue with basic info
        if (config.nodeEnv === 'development') {
          console.log('⚠️ Could not fetch extended user info, using basic info only');
        }
      }
    }

    if (response.error) {
      // Log but don't throw - we'll use fallback values
      const errorCode = response.error.code;
      const errorInfo = response.error.info || '';
      
      if (config.nodeEnv === 'development') {
        console.log(`⚠️ API returned error: ${errorCode} - ${errorInfo}`);
      }
      
      // Return null to indicate we couldn't get user info
      // The controller will use fallback values based on access token
      return null;
    }

    const userinfo = response.query?.userinfo;

    if (!userinfo || userinfo.anon) {
      if (config.nodeEnv === 'development') {
        console.log('⚠️ User is anonymous or userinfo not available');
      }
      return null;
    }

    if (!userinfo.name) {
      if (config.nodeEnv === 'development') {
        console.log('⚠️ Invalid userinfo response: missing name');
      }
      return null;
    }

    return {
      username: userinfo.name,
      id: userinfo.id,
      editcount: userinfo.editcount || 0,
      groups: userinfo.groups || [],
      rights: userinfo.rights || [],
    };
  } catch (error) {
    // Don't throw - return null so auth flow can continue with fallback values
    if (config.nodeEnv === 'development') {
      console.log('⚠️ Could not fetch user info, auth will continue with fallback');
    }
    return null;
  }
}
