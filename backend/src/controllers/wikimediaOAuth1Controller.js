import crypto from 'crypto';
import { 
  getRequestToken, 
  getAccessToken, 
  getUserInfo 
} from '../services/wikimediaOAuth1.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';
import User from '../models/User.js';
import config from '../config/config.js';

// Store request tokens and states for OAuth flow (in production, use Redis)
const requestTokenStore = new Map(); // oauthToken -> { oauthTokenSecret, state, timestamp, userId? }

// Clean up expired tokens every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of requestTokenStore.entries()) {
    if (now - data.timestamp > 10 * 60 * 1000) { // 10 minutes
      requestTokenStore.delete(token);
    }
  }
}, 10 * 60 * 1000);

/**
 * Initiate OAuth 1.0a flow
 * GET /api/auth/wikimedia/initiate
 */
export const initiateOAuth1 = async (req, res, next) => {
  try {
    if (!config.wikimediaOAuth1.consumerKey || !config.wikimediaOAuth1.consumerSecret) {
      return res.status(503).json({
        success: false,
        message: 'Wikimedia OAuth 1.0a is not configured. Please add WIKIMEDIA_OAUTH1_CONSUMER_KEY and WIKIMEDIA_OAUTH1_CONSUMER_SECRET to your .env file.',
        details: 'Get your credentials from: https://meta.wikimedia.org/wiki/Special:OAuthConsumerRegistration/propose'
      });
    }

    // Generate random state for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');
    
    // Get request token
    const { oauthToken, oauthTokenSecret, authorizeUrl } = await getRequestToken();
    
    // Store request token with state for later verification
    requestTokenStore.set(oauthToken, {
      oauthTokenSecret,
      state,
      timestamp: Date.now(),
      userId: req.user?.id, // For account linking (if user is already logged in)
    });

    if (config.nodeEnv === 'development') {
      console.log('🔐 Initiating Wikimedia OAuth 1.0a flow...');
      console.log('📝 State:', state.substring(0, 10) + '...');
      console.log('🔗 Authorization URL:', authorizeUrl);
    }

    res.json({
      success: true,
      authorizationUrl: authorizeUrl,
      state: state,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle OAuth 1.0a callback
 * GET /api/auth/wikimedia/callback
 */
export const oauth1Callback = async (req, res, next) => {
  try {
    const { oauth_token, oauth_verifier, state, oauth_problem, denied } = req.query;

    // Handle user denial
    if (denied) {
      const frontendUrl = config.frontendUrl || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/auth?error=access_denied&message=${encodeURIComponent('Authorization was denied')}`);
    }

    // Handle OAuth errors
    if (oauth_problem) {
      console.error('❌ OAuth 1.0a error:', oauth_problem);
      const frontendUrl = config.frontendUrl || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/auth?error=oauth_error&message=${encodeURIComponent(oauth_problem)}`);
    }

    // Validate required parameters
    if (!oauth_token || !oauth_verifier) {
      console.error('❌ OAuth 1.0a callback missing required parameters');
      const frontendUrl = config.frontendUrl || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/auth?error=missing_parameters`);
    }

    // Get stored request token data
    const requestTokenData = requestTokenStore.get(oauth_token);
    if (!requestTokenData) {
      console.error('❌ Invalid or expired OAuth token');
      const frontendUrl = config.frontendUrl || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/auth?error=invalid_token`);
    }

    // Verify state if provided (CSRF protection)
    if (state && state !== requestTokenData.state) {
      console.error('❌ State mismatch');
      const frontendUrl = config.frontendUrl || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/auth?error=invalid_state`);
    }

    // Token can only be used once
    requestTokenStore.delete(oauth_token);

    const userIdToLink = requestTokenData.userId; // For account linking

    if (config.nodeEnv === 'development') {
      console.log('🔄 OAuth 1.0a callback received');
      console.log('📝 Verifier:', oauth_verifier.substring(0, 20) + '...');
    }

    // Exchange request token for access token
    const { accessToken, accessTokenSecret } = await getAccessToken(
      oauth_token,
      requestTokenData.oauthTokenSecret,
      oauth_verifier
    );

    // Get user info using authenticated API request
    // This may return null if API calls fail - we'll use fallback values
    const userInfo = await getUserInfo(accessToken, accessTokenSecret);

    // Generate fallback username from access token if userInfo is null
    // Use first 16 chars of access token as a unique identifier
    const fallbackUsername = userInfo?.username || `wikiuser_${accessToken.substring(0, 16)}`;
    const fallbackId = userInfo?.id || accessToken.substring(0, 16);
    const fallbackEditCount = userInfo?.editcount || 0;
    const fallbackGroups = userInfo?.groups || [];
    const fallbackRights = userInfo?.rights || [];

    if (config.nodeEnv === 'development') {
      if (userInfo) {
        console.log('✅ User info retrieved:', {
          username: userInfo.username,
          id: userInfo.id,
          editcount: userInfo.editcount,
          groups: userInfo.groups,
        });
      } else {
        console.log('⚠️ User info not available, using fallback values:', {
          username: fallbackUsername,
          id: fallbackId,
        });
      }
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

      // Check if Wikimedia account is already linked to another user (if we have an ID)
      if (fallbackId) {
        const existingUser = await User.findOne({ 
          'wikimediaOAuth1.wikimediaId': fallbackId.toString(),
          _id: { $ne: userIdToLink }
        });
        
        if (existingUser) {
          const frontendUrl = config.frontendUrl || 'http://localhost:3000';
          return res.redirect(`${frontendUrl}/profile?error=account_already_linked`);
        }
      }

      // Link the account
      user.wikimediaOAuth1 = {
        wikimediaId: fallbackId.toString(),
        username: fallbackUsername,
        accessToken: accessToken, // In production, encrypt this
        accessTokenSecret: accessTokenSecret, // In production, encrypt this
        linkedAt: new Date(),
        editCount: fallbackEditCount,
        groups: fallbackGroups,
        rights: fallbackRights,
      };
      await user.save();

      // Redirect to profile page for linked account
      const frontendUrl = config.frontendUrl || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/profile?linked=success`);
    }

    // Login/Registration flow
    // Check if user already exists with this Wikimedia account (try by ID first, then by token)
    if (fallbackId) {
      user = await User.findOne({ 
        'wikimediaOAuth1.wikimediaId': fallbackId.toString() 
      });
    }
    
    // If not found by ID, try finding by access token (for users created with fallback)
    if (!user) {
      user = await User.findOne({ 
        'wikimediaOAuth1.accessToken': accessToken 
      });
    }

    if (user) {
      // Update OAuth tokens and user info
      if (!user.wikimediaOAuth1) {
        user.wikimediaOAuth1 = {};
      }
      user.wikimediaOAuth1.accessToken = accessToken;
      user.wikimediaOAuth1.accessTokenSecret = accessTokenSecret;
      // Only update these if we have real values (not fallback)
      if (userInfo?.editcount !== undefined) user.wikimediaOAuth1.editCount = userInfo.editcount;
      if (userInfo?.groups) user.wikimediaOAuth1.groups = userInfo.groups;
      if (userInfo?.rights) user.wikimediaOAuth1.rights = userInfo.rights;
      // Update ID and username if we have them
      if (fallbackId) user.wikimediaOAuth1.wikimediaId = fallbackId.toString();
      if (fallbackUsername) user.wikimediaOAuth1.username = fallbackUsername;
      await user.save();
    } else {
      // Create new user or find by username
      user = await User.findOne({ username: fallbackUsername });
      
      if (!user) {
        // Create new user with fallback or actual values
        user = await User.create({
          username: fallbackUsername,
          email: `${fallbackUsername}@wikimedia.local`, // Placeholder email
          password: crypto.randomBytes(32).toString('hex'), // Random password (user won't use it)
          country: 'Unknown', // Can be updated later
          wikimediaOAuth1: {
            wikimediaId: fallbackId.toString(),
            username: fallbackUsername,
            accessToken: accessToken, // In production, encrypt this
            accessTokenSecret: accessTokenSecret, // In production, encrypt this
            linkedAt: new Date(),
            editCount: fallbackEditCount,
            groups: fallbackGroups,
            rights: fallbackRights,
          },
        });
      } else {
        // Link existing account (user exists but doesn't have Wikimedia account linked)
        user.wikimediaOAuth1 = {
          wikimediaId: fallbackId.toString(),
          username: fallbackUsername,
          accessToken: accessToken,
          accessTokenSecret: accessTokenSecret,
          linkedAt: new Date(),
          editCount: fallbackEditCount,
          groups: fallbackGroups,
          rights: fallbackRights,
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
      console.log('✅ OAuth 1.0a flow completed successfully');
      console.log('👤 User:', user.username);
    }

    res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('❌ OAuth 1.0a callback error:', error);
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
    if (!config.wikimediaOAuth1.consumerKey || !config.wikimediaOAuth1.consumerSecret) {
      return res.status(503).json({
        success: false,
        message: 'Wikimedia OAuth 1.0a is not configured.',
      });
    }

    // Generate state with user ID
    const state = crypto.randomBytes(32).toString('hex');
    
    const { oauthToken, oauthTokenSecret, authorizeUrl } = await getRequestToken();
    
    requestTokenStore.set(oauthToken, {
      oauthTokenSecret,
      state,
      timestamp: Date.now(),
      userId: req.user.id,
    });

    res.json({
      success: true,
      authorizationUrl: authorizeUrl,
      state: state,
    });
  } catch (error) {
    next(error);
  }
};


