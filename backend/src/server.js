import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
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
import config from './config/config.js';
import crypto from 'crypto';

// Connect to the database (and create missing tables) before serving requests
await connectDB();

const app = express();

// Behind a reverse proxy (e.g. Toolforge), set TRUST_PROXY (usually "1") so
// req.ip and secure cookies use the X-Forwarded-* headers.
if (process.env.TRUST_PROXY) {
  const value = process.env.TRUST_PROXY;
  app.set('trust proxy', /^\d+$/.test(value) ? parseInt(value, 10) : value === 'true' || value);
}

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
      // The frontend reads country data from Wikidata
      connectSrc: ["'self'", 'https://www.wikidata.org'],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"]
    }
  })
);


// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  "https://source-wiki.vercel.app",
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
app.use(express.urlencoded({ extended: true }));
// Cookie parser (needed before auth middleware)
app.use(cookieParser());
// Optional authentication middleware (populates req.user if token exists)
// This must run before rate limiting so user info is available
app.use(optionalAuth);


// User-based rate limiting with role-specific limits
// Applied to all API routes
app.use('/api/', userRateLimiter);

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
app.use('/api/countries', countryRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/reports', reportsRoutes);

// Serve the built frontend (frontend/dist) when it exists, so the whole app
// runs as one web service. Unknown non-API paths return index.html so
// client-side routes like /directory work on refresh.
const frontendDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../frontend/dist');

if (fs.existsSync(path.join(frontendDist, 'index.html'))) {
  app.use(express.static(frontendDist, { index: false }));
  app.get(/^\/(?!api\/|api$|health$).*/, (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  // API-only mode (e.g. local backend development)
  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: 'WikiSource Verifier API',
      version: '1.0.0'
    });
  });
}

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
  console.log(`Server running in ${config.nodeEnv} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});

export default app;
