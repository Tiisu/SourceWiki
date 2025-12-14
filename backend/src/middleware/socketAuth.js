import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Socket.io authentication middleware
 * Verifies JWT token from handshake auth or query parameters
 */
const socketAuth = async (socket, next) => {
  try {
    let token = null;

    // Try to get token from handshake auth (for Socket.io client auth)
    if (socket.handshake.auth && socket.handshake.auth.token) {
      token = socket.handshake.auth.token;
    }
    // Try to get token from query parameters (fallback)
    else if (socket.handshake.query && socket.handshake.query.token) {
      token = socket.handshake.query.token;
    }

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new Error('User not found'));
      }

      if (!user.isActive) {
        return next(new Error('User account is deactivated'));
      }

      // Attach user to socket
      socket.user = user;
      socket.userId = user._id.toString();
      socket.userRole = user.role;
      socket.userCountry = user.country;

      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return next(new Error('Invalid token'));
      }
      if (error.name === 'TokenExpiredError') {
        return next(new Error('Token expired'));
      }
      return next(new Error('Token verification failed'));
    }
  } catch (error) {
    next(new Error('Authentication error'));
  }
};

export default socketAuth;

