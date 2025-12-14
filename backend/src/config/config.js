
import dotenv from 'dotenv';

dotenv.config();

// Environment variable validation
const validateEnvVars = () => {
  const requiredVars = ['MONGODB_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\n📋 Please check your .env file and ensure all required variables are set.');
    console.error('💡 You can copy .env.example to .env and fill in the values.');
    process.exit(1);
  }
};

// Validate environment variables on module load
validateEnvVars();

const config = {
  // Server Configuration
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database Configuration
  mongodbUri: process.env.MONGODB_URI,
  
  // JWT Configuration
  jwtSecret: process.env.JWT_SECRET,
  jwtExpire: process.env.JWT_EXPIRE || '30d',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtRefreshExpire: process.env.JWT_REFRESH_EXPIRE || '7d',
  
  // Frontend Configuration
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
};

// Validate critical configuration values
if (!config.mongodbUri) {
  console.error('❌ MONGODB_URI is required but not set');
  process.exit(1);
}

if (!config.jwtSecret) {
  console.error('❌ JWT_SECRET is required but not set');
  process.exit(1);
}

if (!config.jwtRefreshSecret) {
  console.error('❌ JWT_REFRESH_SECRET is required but not set');
  process.exit(1);
}

// Log configuration status (excluding sensitive data)
console.log('✅ Environment configuration loaded successfully:');
console.log(`   - Server Port: ${config.port}`);
console.log(`   - Node Environment: ${config.nodeEnv}`);
console.log(`   - MongoDB URI: ${config.mongodbUri.replace(/\/\/.*@/, '//***:***@')}`); // Mask credentials
console.log(`   - JWT Expire: ${config.jwtExpire}`);
console.log(`   - JWT Refresh Expire: ${config.jwtRefreshExpire}`);
console.log(`   - Frontend URL: ${config.frontendUrl}`);

export default config;
