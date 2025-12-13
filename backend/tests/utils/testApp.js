import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import errorHandler from '../../src/middleware/errorHandler.js';
import { optionalAuth } from '../../src/middleware/auth.js';
import { userRateLimiter } from '../../src/middleware/rateLimiter.js';
import authRoutes from '../../src/routes/authRoutes.js';
import wikimediaOAuth1Routes from '../../src/routes/wikimediaOAuth1Routes.js';
import submissionRoutes from '../../src/routes/submissionRoutes.js';
import userRoutes from '../../src/routes/userRoutes.js';
import adminRoutes from '../../src/routes/adminRoutes.js';
import countryRoutes from '../../src/routes/countryRoutes.js';
import systemRoutes from '../../src/routes/systemRoutes.js';
import reportsRoutes from '../../src/routes/reportsRoutes.js';

/**
 * Create a test Express app instance
 * This is used for integration tests to avoid starting the actual server
 * @returns {Express} Express app instance
 */
export const createTestApp = () => {
  const app = express();

  // Security middleware
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  }));

  // CORS configuration (more permissive for tests)
  app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // Cookie parser
  app.use(cookieParser());

  // Optional authentication middleware
  app.use(optionalAuth);

  // Rate limiting (can be disabled or mocked in tests)
  app.use('/api/', userRateLimiter);

  // Body parser
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Server is running',
      timestamp: new Date().toISOString()
    });
  });

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/auth/wikimedia', wikimediaOAuth1Routes);
  app.use('/api/submissions', submissionRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/countries', countryRoutes);
  app.use('/api/system', systemRoutes);
  app.use('/api/reports', reportsRoutes);

  // Welcome route
  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: 'WikiSource Verifier API',
      version: '1.0.0',
      documentation: '/api/docs'
    });
  });

  // Error handler (must be last)
  app.use(errorHandler);

  // Handle 404
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: 'Route not found'
    });
  });

  return app;
};

