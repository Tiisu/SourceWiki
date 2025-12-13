import rateLimit from 'express-rate-limit';

/**
 * Rate limit configuration based on user roles
 * Limits are per 15-minute window
 */
const RATE_LIMITS = {
  // Unauthenticated users (IP-based)
  default: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // 50 requests per 15 minutes
  },
  // Contributor role
  contributor: {
    windowMs: 15 * 60 * 1000,
    max: 100, // 100 requests per 15 minutes
  },
  // Verifier role
  verifier: {
    windowMs: 15 * 60 * 1000,
    max: 200, // 200 requests per 15 minutes
  },
  // Admin role
  admin: {
    windowMs: 15 * 60 * 1000,
    max: 500, // 500 requests per 15 minutes
  },
};

/**
 * Creates a rate limiter instance with role-based limits
 * @param {Object} options - Rate limiter options
 * @returns {Function} Express middleware
 */
const createRateLimiter = (options = {}) => {
  const {
    windowMs = RATE_LIMITS.default.windowMs,
    max = RATE_LIMITS.default.max,
    message = 'Too many requests, please try again later.',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = options;

  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers (RFC 7231)
    legacyHeaders: true, // Also return `X-RateLimit-*` headers for backward compatibility
    // Custom key generator: use user ID if authenticated, otherwise use IP
    keyGenerator: (req) => {
      // If user is authenticated, use user ID + role for rate limiting
      if (req.user && req.user._id) {
        return `user:${req.user._id.toString()}:${req.user.role}`;
      }
      // Fallback to IP for unauthenticated requests
      return req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
    },
    // Custom handler for rate limit exceeded
    handler: (req, res) => {
      const rateLimitInfo = req.rateLimit || {};
      const remaining = rateLimitInfo.remaining ?? 0;
      const limit = rateLimitInfo.limit ?? max;
      const resetTime = rateLimitInfo.resetTime ?? new Date(Date.now() + windowMs);
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);

      // Ensure rate limit headers are set (express-rate-limit should set these automatically, but we ensure they're there)
      res.set({
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': Math.max(0, remaining).toString(),
        'X-RateLimit-Reset': new Date(resetTime).toISOString(),
        'Retry-After': retryAfter.toString(),
      });

      res.status(429).json({
        success: false,
        message,
        rateLimit: {
          limit,
          remaining: Math.max(0, remaining),
          reset: new Date(resetTime).toISOString(),
          retryAfter,
        },
      });
    },
    // Custom skip function
    skip: (req) => {
      if (skipSuccessfulRequests && req.statusCode < 400) {
        return true;
      }
      if (skipFailedRequests && req.statusCode >= 400) {
        return true;
      }
      return false;
    },
    // Store rate limit info in request for custom headers
    store: options.store, // Allow custom store (e.g., Redis) to be passed
  });
};

// Create all rate limiters at module initialization (required by express-rate-limit)
// This ensures they are created before any requests are handled
const rateLimiters = {
  default: createRateLimiter({
    windowMs: RATE_LIMITS.default.windowMs,
    max: RATE_LIMITS.default.max,
    message: 'Too many requests from this IP, please try again later.',
  }),
  contributor: createRateLimiter({
    windowMs: RATE_LIMITS.contributor.windowMs,
    max: RATE_LIMITS.contributor.max,
    message: 'Too many requests for contributor role, please try again later.',
  }),
  verifier: createRateLimiter({
    windowMs: RATE_LIMITS.verifier.windowMs,
    max: RATE_LIMITS.verifier.max,
    message: 'Too many requests for verifier role, please try again later.',
  }),
  admin: createRateLimiter({
    windowMs: RATE_LIMITS.admin.windowMs,
    max: RATE_LIMITS.admin.max,
    message: 'Too many requests for admin role, please try again later.',
  }),
};

/**
 * Middleware that applies rate limiting based on user role
 * This middleware should be used after optionalAuth to have req.user available
 * All rate limiters are pre-created at module initialization
 */
export const roleBasedRateLimiter = (req, res, next) => {
  // Determine which rate limiter to use based on user role
  let limiterKey;
  
  if (req.user && req.user.role) {
    // User is authenticated, use role-based limits
    limiterKey = req.user.role;
    // Fallback to contributor if role is not recognized
    if (!rateLimiters[limiterKey]) {
      limiterKey = 'contributor';
    }
  } else {
    // User is not authenticated, use default IP-based limits
    limiterKey = 'default';
  }

  // Use the pre-created rate limiter
  const limiter = rateLimiters[limiterKey];
  limiter(req, res, next);
};

/**
 * Rate limiter for authenticated users only
 * Falls back to IP-based limiting if user is not authenticated
 * Note: This should be used after optionalAuth middleware
 */
export const userRateLimiter = roleBasedRateLimiter;

/**
 * Rate limiter for specific roles
 * @param {string|string[]} roles - Role(s) to apply this limiter to
 * @param {Object} customLimits - Custom rate limit configuration (not used, kept for API compatibility)
 */
export const roleSpecificRateLimiter = (roles, customLimits = {}) => {
  const roleArray = Array.isArray(roles) ? roles : [roles];
  
  return (req, res, next) => {
    // Check if user has one of the specified roles
    if (req.user && roleArray.includes(req.user.role)) {
      // Use the pre-created limiter for the user's role
      const limiterKey = rateLimiters[req.user.role] ? req.user.role : 'contributor';
      return rateLimiters[limiterKey](req, res, next);
    }
    
    // If user doesn't have the role, use default limiter
    return rateLimiters.default(req, res, next);
  };
};

/**
 * Strict rate limiter for unauthenticated requests (IP-based)
 * Pre-created at module initialization
 */
export const ipRateLimiter = rateLimiters.default;

/**
 * Export rate limit configurations for reference
 */
export { RATE_LIMITS };

