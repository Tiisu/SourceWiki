
import dotenv from 'dotenv';

dotenv.config();

<<<<<<< HEAD
const config = {
  port: process.env.PORT || 5000,
  // Fallback to local Mongo for development if env var is not set
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wsv',
  // Development defaults; override in production via environment variables
  jwtSecret: process.env.JWT_SECRET || 'dev_jwt_secret_change_me',
  jwtExpire: process.env.JWT_EXPIRE || '30d',
=======
// Validation function for required environment variables
const validateEnvVars = () => {
  const required = [
    'MONGODB_URI',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing.join(', '));
    console.error('Please check your .env file or environment configuration.');
    console.error('See .env.example for reference.');
    process.exit(1);
  }
  
  // Validate JWT secret strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.error('JWT_SECRET must be at least 32 characters long for security.');
    process.exit(1);
  }
  
  if (process.env.JWT_REFRESH_SECRET && process.env.JWT_REFRESH_SECRET.length < 32) {
    console.error('JWT_REFRESH_SECRET must be at least 32 characters long for security.');
    process.exit(1);
  }
>>>>>>> 4533f89 (enhance form validation)
};

// Validate environment variables on import
validateEnvVars();

const config = {
  // Server Configuration
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database Configuration
  mongodbUri: process.env.MONGODB_URI,
  
  // JWT Configuration
  jwtSecret: process.env.JWT_SECRET,
  jwtExpire: process.env.JWT_EXPIRE || '15m',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtRefreshExpire: process.env.JWT_REFRESH_EXPIRE || '7d',
  
  // CORS Configuration
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  
  // Rate Limiting Configuration
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100, // limit each IP to 100 requests per windowMs
  
  // Security flags
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
};

export default config;
