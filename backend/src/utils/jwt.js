import jwt from 'jsonwebtoken';
import config from '../config/config.js';

export const generateAccessToken = (userId) => {
  return jwt.sign(
    { id: userId },
    config.jwtSecret,
    { expiresIn: config.jwtExpire }
  );
};

export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    config.jwtRefreshSecret,
    { expiresIn: config.jwtRefreshExpire }
  );
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, config.jwtRefreshSecret);
  } catch (error) {
    return null;
  }
};

export const sendTokenResponse = (user, statusCode, res) => {
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  const cookieOptions = {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: config.nodeEnv === 'production' ? 'none' : 'lax', // 'none' requires secure in production (HTTPS)
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/'
  };

  res
    .status(statusCode)
    .cookie('token', accessToken, cookieOptions)
    .cookie('refreshToken', refreshToken, cookieOptions)
    .json({
      success: true,
      accessToken,
      refreshToken,
      user: user.getPublicProfile()
    });
};
