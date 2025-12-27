import auditRoutes from './routes/auditRoutes.js';


import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import connectDB from './config/database.js';
import errorHandler from './middleware/errorHandler.js';
import { optionalAuth } from './middleware/auth.js';
import { userRateLimiter } from './middleware/rateLimiter.js';
import authRoutes from './routes/authRoutes.js';
import submissionRoutes from './routes/submissionRoutes.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import countryRoutes from './routes/countryRoutes.js';
import systemRoutes from './routes/systemRoutes.js';
import reportsRoutes from './routes/reportsRoutes.js';
//importing the config file where all the environment variables are stored and loaded
import config from './config/config.js';



import crypto from 'crypto';

// Connect to database
connectDB();

const app = express();

// Request ID middleware
app.use((req, res, next) => {
  req.requestId = crypto.randomUUID();
  next();
});

// Security middleware
app.use(helmet());

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"]
    }
  })
);


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
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));


// Body parser
app.use(express.json());
app.use((req, res, next) => {
  console.log('--------------------------------');
  console.log('DEBUG CHECK:');
  console.log('Content-Type:', req.get('Content-Type'));
  console.log('Req Body:', req.body);
  console.log('--------------------------------');
  next();
});
app.use(express.urlencoded({ extended: true }));
// Cookie parser (needed before auth middleware)
app.use(cookieParser());
// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.'
});

// Cookie parser (needed before auth middleware)
// app.use(cookieParser());

// Optional authentication middleware (populates req.user if token exists)
// This must run before rate limiting so user info is available
app.use(optionalAuth);


// User-based rate limiting with role-specific limits
// Applied to all API routes
app.use('/api/', userRateLimiter);

// Body parser
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

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
app.use('/api/submissions', submissionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
// Audit logs route (mounted after app is created)
app.use('/api/admin/audit-logs', auditRoutes);
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

const PORT = process.env.PORT || config.port || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});

export default app;
