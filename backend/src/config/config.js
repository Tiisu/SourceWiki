import dotenv from 'dotenv';

dotenv.config();

const config = {
  port: process.env.PORT || 5000,
  // Fallback to local Mongo for development if env var is not set
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wsv',
  // Development defaults; override in production via environment variables
  jwtSecret: process.env.JWT_SECRET || 'dev_jwt_secret_change_me',
  jwtExpire: process.env.JWT_EXPIRE || '30d',
};

export default config;