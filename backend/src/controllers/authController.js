import User from '../models/User.js';
import { sendTokenResponse, verifyRefreshToken, generateAccessToken, generateRefreshToken } from '../utils/jwt.js';
import AppError from '../utils/AppError.js';
import { ErrorCodes } from '../utils/errorCodes.js';

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  console.log("RECEIVED BODY:", req.body); 
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
    const user = await User.findOne({ username }).select('+password');

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
    const user = await User.findById(req.user.id);

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

    const user = await User.findById(decoded.id);

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

    const user = await User.findByIdAndUpdate(
      req.user.id,
      fieldsToUpdate,
      { new: true, runValidators: true }
    );

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

    const user = await User.findById(req.user.id).select('+password');


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

export const wikimediaLogin = async (req, res, next) => {
  try {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.WIKIMEDIA_CLIENT_ID,
      redirect_uri: process.env.WIKIMEDIA_CALLBACK_URL
    });
    
    res.redirect(`https://meta.wikimedia.org/w/rest.php/oauth2/authorize?${params.toString()}`);
  } catch (error) {
    next(error);
  }
};

export const wikimediaCallback = async (req, res, next) => {
  try {
    const { code, error: oauthError } = req.query;

    if (oauthError || !code) {
      return res.redirect(`${process.env.FRONTEND_URL}/auth?error=${oauthError || 'No code provided'}`);
    }

    const userAgent = process.env.WIKIMEDIA_USER_AGENT || 'WikiSourceVerifier/1.0 (Open Source Application; admin@localhost)';

    const tokenResponse = await fetch('https://meta.wikimedia.org/w/rest.php/oauth2/access_token', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': userAgent
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: process.env.WIKIMEDIA_CLIENT_ID,
        client_secret: process.env.WIKIMEDIA_CLIENT_SECRET,
        redirect_uri: process.env.WIKIMEDIA_CALLBACK_URL
      })
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      console.error('Token Error:', tokenData);
      return res.redirect(`${process.env.FRONTEND_URL}/auth?error=Authentication failed`);
    }

    const profileResponse = await fetch('https://meta.wikimedia.org/w/rest.php/oauth2/resource/profile', {
      headers: { 
        Authorization: `Bearer ${tokenData.access_token}`,
        'User-Agent': userAgent
      }
    });
    const profile = await profileResponse.json();
    if (!profileResponse.ok) {
      console.error('Profile Error:', profile);
      return res.redirect(`${process.env.FRONTEND_URL}/auth?error=Failed to fetch profile`);
    }

    let user = await User.findOne({ wikimedia_id: profile.sub });
    
    if (!user) {
      let finalUsername = profile.username;
      const existingUser = await User.findOne({ username: profile.username });
      if (existingUser) {
        finalUsername = `${profile.username}_${Math.random().toString(36).substring(7)}`;
      }

      user = await User.create({
        username: finalUsername,
        email: profile.email || `${finalUsername}@example.com`,
        country: 'Global',
        wikimedia_id: profile.sub,
        wikimedia_username: profile.username,
        isActive: true
      });
    } else if (!user.isActive) {
      return res.redirect(`${process.env.FRONTEND_URL}/auth?error=Account deactivated`);
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`);

  } catch (error) {
    console.error('Wikimedia OAuth catch error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/auth?error=Server error`);
  }
};

