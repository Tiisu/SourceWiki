import crypto from 'crypto';
import { 
  generatePKCE,
  getAuthorizationUrl, 
  getAccessTokenFromCode, 
  getUserProfile 
} from '../services/wikimediaOAuth2.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';
import User from '../models/User.js';
import config from '../config/config.js';

// Store states for CSRF protection (in production, use Redis)
const stateStore = new Map();

// Clean up expired states every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [state, data] of stateStore.entries()) {
    if (now - data.timestamp > 10 * 60 * 1000) { // 10 minutes
      stateStore.delete(state);
    }
  }
}, 10 * 60 * 1000);

/**
 * Initiate OAuth 2.0 flow
 * GET /api/auth/wikimedia/initiate
 */
export const initiateOAuth2 = async (req, res, next) => {
  try {
    if (!config.wikimediaOAuth2.clientId || !config.wikimediaOAuth2.clientSecret) {
      return res.status(503).json({
        success: false,
        message: 'Wikimedia OAuth 2.0 is not configured. Please add WIKIMEDIA_CONSUMER_KEY and WIKIMEDIA_CONSUMER_SECRET to your .env file.',
        details: 'Get your credentials from: https://meta.wikimedia.org/wiki/Special:OAuthConsumerRegistration/propose'
      });
    }

    // Generate random state for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');
    
    // Generate PKCE challenge (required for public clients)
    const pkce = generatePKCE();
    
    // Store state with optional user ID for account linking and PKCE verifier
    stateStore.set(state, {
      timestamp: Date.now(),
      userId: req.user?.id, // For account linking (if user is already logged in)
      code_verifier: pkce.code_verifier, // Store for token exchange
    });

    // Generate authorization URL with PKCE challenge
    const authorizationUrl = getAuthorizationUrl(state, pkce.code_challenge, pkce.code_challenge_method);

    if (config.nodeEnv === 'development') {
      console.log('🔐 Initiating Wikimedia OAuth 2.0 flow...');
      console.log('📝 State:', state.substring(0, 10) + '...');
      console.log('🔗 Authorization URL:', authorizationUrl);
    }

    res.json({
      success: true,
      authorizationUrl,
      state,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle OAuth 2.0 callback
 * GET /api/auth/wikimedia/callback
 */
export const oauth2Callback = async (req, res, next) => {
  try {
    const { code, state, error, error_description } = req.query;

    // Handle authorization errors
    if (error) {
      console.error('❌ OAuth 2.0 authorization error:', error, error_description);
      const frontendUrl = config.frontendUrl || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/auth?error=${error}&message=${encodeURIComponent(error_description || 'Authorization failed')}`);
    }

    // Validate required parameters
    if (!code || !state) {
      console.error('❌ OAuth 2.0 callback missing required parameters');
      const frontendUrl = config.frontendUrl || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/auth?error=missing_parameters`);
    }

    // Verify state (CSRF protection)
    const storedState = stateStore.get(state);
    if (!storedState) {
      console.error('❌ Invalid or expired state parameter');
      const frontendUrl = config.frontendUrl || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/auth?error=invalid_state`);
    }

    // State can only be used once
    const codeVerifier = storedState.code_verifier; // Get PKCE verifier
    stateStore.delete(state);

    const userIdToLink = storedState.userId; // For account linking

    if (config.nodeEnv === 'development') {
      console.log('🔄 OAuth 2.0 callback received');
      console.log('📝 Code:', code.substring(0, 20) + '...');
      console.log('🔐 PKCE verifier present:', !!codeVerifier);
    }

    // Exchange authorization code for access token (include PKCE verifier)
    const tokenData = await getAccessTokenFromCode(code, codeVerifier);

    // Get user profile from MediaWiki
    const profile = await getUserProfile(tokenData.access_token);

    if (config.nodeEnv === 'development') {
      console.log('✅ User profile retrieved:', {
        sub: profile.sub,
        username: profile.username,
        editcount: profile.editcount,
      });
    }

    let user;

    // Check if this is account linking (userIdToLink exists)
    if (userIdToLink) {
      // Account linking flow
      user = await User.findById(userIdToLink);
      if (!user) {
        const frontendUrl = config.frontendUrl || 'http://localhost:3000';
        return res.redirect(`${frontendUrl}/auth?error=user_not_found`);
      }

      // Check if Wikimedia account is already linked to another user
      const existingUser = await User.findOne({ 
        'wikimediaOAuth2.wikimediaId': profile.sub,
        _id: { $ne: userIdToLink }
      });
      
      if (existingUser) {
        const frontendUrl = config.frontendUrl || 'http://localhost:3000';
        return res.redirect(`${frontendUrl}/profile?error=account_already_linked`);
      }

      // Link the account (optional - only if you want to store OAuth data)
      // For now, we'll just update the user
      user.wikimediaOAuth2 = {
        wikimediaId: profile.sub,
        username: profile.username,
        accessToken: tokenData.access_token, // In production, encrypt this
        refreshToken: tokenData.refresh_token,
        tokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
        linkedAt: new Date(),
        editCount: profile.editcount || 0,
        groups: profile.groups || [],
      };
      await user.save();

      // Redirect to profile page for linked account
      const frontendUrl = config.frontendUrl || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/profile?linked=success`);
    }

    // Login/Registration flow
    // Check if user already exists with this Wikimedia account
    user = await User.findOne({ 
      'wikimediaOAuth2.wikimediaId': profile.sub 
    });

    if (user) {
      // Update OAuth tokens and user info
      if (!user.wikimediaOAuth2) {
        user.wikimediaOAuth2 = {};
      }
      user.wikimediaOAuth2.accessToken = tokenData.access_token;
      user.wikimediaOAuth2.refreshToken = tokenData.refresh_token;
      user.wikimediaOAuth2.tokenExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
      user.wikimediaOAuth2.editCount = profile.editcount || 0;
      user.wikimediaOAuth2.groups = profile.groups || [];
      await user.save();
    } else {
      // Create new user or find by username
      // Check if this is a temporary username (workaround for MediaWiki API issues)
      const isTemporaryUsername = profile._isTemporaryUsername;
      const usernameToUse = profile.username;
      
      user = await User.findOne({ username: usernameToUse });
      
      // Also check if a user exists with this Wikimedia ID
      const existingByWikiId = await User.findOne({ 
        'wikimediaOAuth2.wikimediaId': profile.sub 
      });
      
      if (existingByWikiId) {
        // User exists with this Wikimedia ID, update them
        user = existingByWikiId;
        if (!user.wikimediaOAuth2) {
          user.wikimediaOAuth2 = {};
        }
        user.wikimediaOAuth2.accessToken = tokenData.access_token;
        user.wikimediaOAuth2.refreshToken = tokenData.refresh_token;
        user.wikimediaOAuth2.tokenExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
        user.wikimediaOAuth2.editCount = profile.editcount || 0;
        user.wikimediaOAuth2.groups = profile.groups || [];
        // If username was temporary and we have a different username, keep the existing one
        await user.save();
      } else if (!user) {
        // Create new user
        user = await User.create({
          username: usernameToUse,
          email: `${usernameToUse}@wikimedia.local`, // Placeholder email
          password: crypto.randomBytes(32).toString('hex'), // Random password (user won't use it)
          country: 'Unknown', // Can be updated later
          wikimediaOAuth2: {
            wikimediaId: profile.sub,
            username: usernameToUse, // This might be temporary if API failed
            accessToken: tokenData.access_token, // In production, encrypt this
            refreshToken: tokenData.refresh_token,
            tokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
            linkedAt: new Date(),
            editCount: profile.editcount || 0,
            groups: profile.groups || [],
          },
        });
        
        if (isTemporaryUsername) {
          console.log('⚠️ User created with temporary username. User should update their profile.');
        }
      } else {
        // Link existing account (user exists but doesn't have Wikimedia account linked)
        user.wikimediaOAuth2 = {
          wikimediaId: profile.sub,
          username: usernameToUse,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          tokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
          linkedAt: new Date(),
          editCount: profile.editcount || 0,
          groups: profile.groups || [],
        };
        await user.save();
      }
    }

    // Generate JWT tokens
    const jwtAccessToken = generateAccessToken(user._id);
    const jwtRefreshToken = generateRefreshToken(user._id);

    // Redirect to frontend with tokens
    const frontendUrl = config.frontendUrl || 'http://localhost:3000';
    const redirectUrl = new URL('/auth/wikimedia/success', frontendUrl);
    redirectUrl.searchParams.set('accessToken', jwtAccessToken);
    redirectUrl.searchParams.set('refreshToken', jwtRefreshToken);
    
    if (config.nodeEnv === 'development') {
      console.log('✅ OAuth 2.0 flow completed successfully');
      console.log('👤 User:', user.username);
    }

    res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('❌ OAuth 2.0 callback error:', error);
    const frontendUrl = config.frontendUrl || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth?error=oauth_failed&message=${encodeURIComponent(error.message)}`);
  }
};

/**
 * Link Wikimedia account to existing user (optional)
 * POST /api/auth/wikimedia/link
 */
export const linkAccount = async (req, res, next) => {
  try {
    if (!config.wikimediaOAuth2.clientId || !config.wikimediaOAuth2.clientSecret) {
      return res.status(503).json({
        success: false,
        message: 'Wikimedia OAuth 2.0 is not configured.',
      });
    }

    // Generate state with user ID
    const state = crypto.randomBytes(32).toString('hex');
    stateStore.set(state, {
      timestamp: Date.now(),
      userId: req.user.id,
    });

    const authorizationUrl = getAuthorizationUrl(state);

    res.json({
      success: true,
      authorizationUrl,
      state,
    });
  } catch (error) {
    next(error);
  }
};

