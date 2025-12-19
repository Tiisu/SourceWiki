
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import { ErrorCodes } from '../utils/errorCodes.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookies
    else if (req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return next(new AppError('Not authorized to access this route', 401, ErrorCodes.UNAUTHORIZED_ACCESS));
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return next(new AppError('User not found', 401, ErrorCodes.AUTHENTICATION_FAILED));
      }

      if (!req.user.isActive) {
        return next(new AppError('User account is deactivated', 401, ErrorCodes.ACCOUNT_INACTIVE));
      }

      next();
    } catch (error) {
      return next(new AppError('Token is invalid or expired', 401, ErrorCodes.TOKEN_INVALID));
    }
  } catch (error) {
    return next(new AppError('Server error during authentication', 500, ErrorCodes.INTERNAL_SERVER_ERROR));
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError(`User role '${req.user.role}' is not authorized to access this route`, 403, ErrorCodes.UNAUTHORIZED_ACCESS));
    }
    next();
  };
};

export const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');
      } catch (error) {
        // Token invalid, but continue without user
        req.user = null;
      }
    }

    next();
  } catch (error) {
    next();
  }
};
