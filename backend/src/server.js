import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import connectDB from './config/database.js';
import errorHandler from './middleware/errorHandler.js';
import { optionalAuth } from './middleware/auth.js';
import { userRateLimiter } from './middleware/rateLimiter.js';
import authRoutes from './routes/authRoutes.js';
import wikimediaOAuth1Routes from './routes/wikimediaOAuth1Routes.js';
import submissionRoutes from './routes/submissionRoutes.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import countryRoutes from './routes/countryRoutes.js';
import systemRoutes from './routes/systemRoutes.js';
import reportsRoutes from './routes/reportsRoutes.js';
//importing the config file where all the environment variables are stored and loaded
import config from './config/config.js';


// Connect to database
connectDB();

const app = express();

// Security middleware - configure helmet for production
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin resources
  contentSecurityPolicy: false, // Disable CSP for API (can be enabled with proper config)
}));

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In development, allow localhost on any port
    if (process.env.NODE_ENV === 'development' && origin.startsWith('http://localhost')) {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Cookie parser (needed before auth middleware)
app.use(cookieParser());

// Optional authentication middleware (populates req.user if token exists)
// This must run before rate limiting so user info is available
app.use(optionalAuth);

// User-based rate limiting with role-specific limits
// Applied to all API routes
app.use('/api/', userRateLimiter);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

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

const PORT = config.port;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${config.nodeEnv} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});

export default app;
