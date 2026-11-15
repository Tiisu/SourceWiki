import crypto from 'crypto';
import config from '../config/config.js';

import User from '../models/User.js';
import { sendTokenResponse, verifyRefreshToken, generateAccessToken, generateRefreshToken } from '../utils/jwt.js';import AppError from '../utils/AppError.js';
import { ErrorCodes } from '../utils/errorCodes.js';

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { username, email, password, country } = req.body;

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      country
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Find user and include password
    const user = await User.scope('withPassword').findOne({ where: { username: username ?? null } });

    if (!user) {
      return next(new AppError('Invalid credentials', 401, ErrorCodes.INVALID_CREDENTIALS));
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return next(new AppError('Invalid credentials', 401, ErrorCodes.INVALID_CREDENTIALS));
    }

    // Check if user is active
    if (!user.isActive) {
      return next(new AppError('Account is deactivated', 401, ErrorCodes.ACCOUNT_INACTIVE));
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res, next) => {
  try {
    res
      .status(200)
      .cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
      })
      .cookie('refreshToken', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
      })
      .json({
        success: true,
        message: 'Logged out successfully'
      });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);

    res.status(200).json({
      success: true,
      user: user.getPublicProfile()
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;


    if (!refreshToken) {
      return next(new AppError('Refresh token is required', 401, ErrorCodes.AUTH_TOKEN_MISSING));
    }

    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded) {
      return next(new AppError('Invalid refresh token', 401, ErrorCodes.AUTH_TOKEN_INVALID));
    }

    const user = await User.findByPk(decoded.id);

    if (!user || !user.isActive) {
      return next(new AppError('User not found or inactive', 401, ErrorCodes.AUTH_TOKEN_INVALID));
    }

    const accessToken = generateAccessToken(user._id);

    res.status(200).json({
      success: true,
      accessToken,
      user: user.getPublicProfile()
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    const { email, country } = req.body;

    const fieldsToUpdate = {};
    if (email) fieldsToUpdate.email = email;
    if (country) fieldsToUpdate.country = country;

    const user = await User.findByPk(req.user.id);
    await user.update(fieldsToUpdate);

    res.status(200).json({
      success: true,
      user: user.getPublicProfile()
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.scope('withPassword').findByPk(req.user.id);


    // Check current password
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return next(new AppError('Current password is incorrect', 401, ErrorCodes.INVALID_CREDENTIALS));
    }

    user.password = newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Start Wikimedia OAuth login (redirect to Wikimedia)
// @route   GET /api/auth/wikimedia
// @access  Public
export const wikimediaLogin = (req, res, next) => {
  const { clientId, clientSecret, redirectUri, baseUrl } = config.wikimedia;

  if (!clientId || !clientSecret) {
    return next(new AppError('Wikimedia login is not configured', 500, ErrorCodes.INTERNAL_SERVER_ERROR));
  }

  // Random secret word, kept in a short-lived cookie and checked again in the callback
  const state = crypto.randomBytes(32).toString('hex');

  res.cookie('wikimedia_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // must be lax: strict cookies are not sent when Wikimedia redirects back
    maxAge: 10 * 60 * 1000 // 10 minutes
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    state
  });

  res.redirect(`${baseUrl}/w/rest.php/oauth2/authorize?${params.toString()}`);
};

const WIKIMEDIA_USER_AGENT = 'SourceWiki/1.0 (WikiIndaba hackathon; https://github.com/Tiisu/SourceWiki)';

// Read one cookie, whether or not cookie-parser is installed
const getCookie = (req, name) => {
  if (req.cookies?.[name]) return req.cookies[name];
  for (const part of (req.headers.cookie || '').split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return null;
};

// SourceWiki usernames are unique and 3-30 chars; Wikimedia names can be longer or clash
const buildUniqueUsername = async (wikimediaName) => {
  const base = wikimediaName.trim().replace(/\s+/g, '_').slice(0, 30).padEnd(3, '_');
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = attempt === 0
      ? base
      : `${base.slice(0, 23)}_${crypto.randomBytes(3).toString('hex')}`;
    const taken = await User.findOne({ where: { username: candidate } });
    if (!taken) return candidate;
  }
  throw new Error('Could not generate a unique username');
};

// @desc    Wikimedia redirects the browser back here after login
// @route   GET /api/auth/wikimedia/callback
// @access  Public
export const wikimediaCallback = async (req, res) => {
  const { clientId, clientSecret, redirectUri, baseUrl } = config.wikimedia;

  // This is a browser navigation, so failures redirect to the frontend instead of sending JSON
  const fail = (reason) =>
    res.redirect(`${config.frontendUrl}/auth?wikimedia=error&reason=${encodeURIComponent(reason)}`);

  // Always clear the state cookie: it is single use
  res.clearCookie('wikimedia_oauth_state', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });

  try {
    if (req.query.error) return fail('access_denied');

    // 1. Check the sticky note (CSRF protection)
    const { code, state } = req.query;
    const savedState = getCookie(req, 'wikimedia_oauth_state');
    if (!code || !state || !savedState) return fail('invalid_state');

    const a = Buffer.from(String(state));
    const b = Buffer.from(String(savedState));
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return fail('invalid_state');

    // 2. Exchange the code for an access token (the client secret stays on the backend)
    const tokenRes = await fetch(`${baseUrl}/w/rest.php/oauth2/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': WIKIMEDIA_USER_AGENT
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: String(code),
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret
      })
    });
    if (!tokenRes.ok) {
      console.error(`Wikimedia token exchange failed: HTTP ${tokenRes.status}`);
      return fail('token_exchange_failed');
    }
    const { access_token: wikimediaToken } = await tokenRes.json();
    if (!wikimediaToken) return fail('token_exchange_failed');

    // 3. Ask Wikimedia who this is
    const profileRes = await fetch(`${baseUrl}/w/rest.php/oauth2/resource/profile`, {
      headers: {
        Authorization: `Bearer ${wikimediaToken}`,
        'User-Agent': WIKIMEDIA_USER_AGENT
      }
    });
    if (!profileRes.ok) {
      console.error(`Wikimedia profile request failed: HTTP ${profileRes.status}`);
      return fail('profile_failed');
    }
    const profile = await profileRes.json();
    if (!profile.sub || !profile.username) return fail('profile_failed');

    // 4. Find by wikimediaId (never by username, which can change), or create
    const wikimediaId = String(profile.sub);
    let user = await User.findOne({ where: { wikimediaId } });

    if (user) {
      if (!user.isActive) return fail('account_inactive');
      if (user.wikimediaUsername !== profile.username) {
        await user.update({ wikimediaUsername: profile.username });
      }
    } else {
      user = await User.create({
        username: await buildUniqueUsername(profile.username),
        wikimediaId,
        wikimediaUsername: profile.username
      });
    }

    // 5. Issue the normal SourceWiki cookies, then send the visitor into the app
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    };
    res
      .cookie('token', generateAccessToken(user._id), cookieOptions)
      .cookie('refreshToken', generateRefreshToken(user._id), cookieOptions);

    const needsCountry = user.country ? '' : '&needsCountry=1';
    return res.redirect(`${config.frontendUrl}/auth?wikimedia=success${needsCountry}`);
  } catch (error) {
    console.error('Wikimedia callback error:', error.message);
    return fail('server_error');
  }
};