import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
import connectDB from './config/database.js';
import errorHandler from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
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

// Security middleware
// Configure Helmet to allow iframe embedding from frontend origins
const frontendOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

// Apply Helmet with CSP that allows framing from frontend
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Swagger UI needs unsafe-eval
      imgSrc: ["'self'", "data:", "https:"],
      frameAncestors: ["'self'", ...frontendOrigins], // Allow framing from frontend origins
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for Swagger UI compatibility
}));

// Disable CSP for Swagger UI route (we'll set it manually with frame-ancestors)
app.use('/api/docs', helmet({
  contentSecurityPolicy: false,
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
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [System]
 *     description: Check if the server is running
 *     responses:
 *       200:
 *         description: Server is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Server is running
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Swagger API Documentation
// Middleware to allow iframe embedding for Swagger UI
app.use('/api/docs', (req, res, next) => {
  // Remove restrictive headers
  res.removeHeader('X-Frame-Options');
  
  // Override CSP to allow framing from frontend origins
  const frontendUrls = [
    'http://localhost:3000',
    'http://localhost:5173',
    process.env.FRONTEND_URL
  ].filter(Boolean);
  
  // Build CSP with frame-ancestors that allows frontend origins
  const cspDirectives = [
    "default-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "img-src 'self' data: https:",
    `frame-ancestors 'self' ${frontendUrls.join(' ')}`
  ].join('; ');
  
  res.setHeader('Content-Security-Policy', cspDirectives);
  next();
}, swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'WikiSource Verifier API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true
  }
}));

// Swagger JSON endpoint
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/countries', countryRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/reports', reportsRoutes);

/**
 * @swagger
 * /:
 *   get:
 *     summary: API root endpoint
 *     tags: [System]
 *     description: Get API information and available endpoints
 *     responses:
 *       200:
 *         description: API information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: WikiSource Verifier API
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *                 documentation:
 *                   type: object
 *                   properties:
 *                     swagger:
 *                       type: string
 *                       example: /api/docs
 *                     json:
 *                       type: string
 *                       example: /api/docs.json
 *                 endpoints:
 *                   type: object
 *                   description: Available API endpoints
 */
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'WikiSource Verifier API',
    version: '1.0.0',
    documentation: {
      swagger: '/api/docs',
      json: '/api/docs.json'
    },
    endpoints: {
      auth: '/api/auth',
      submissions: '/api/submissions',
      users: '/api/users',
      admin: '/api/admin',
      countries: '/api/countries',
      system: '/api/system',
      reports: '/api/reports'
    }
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
