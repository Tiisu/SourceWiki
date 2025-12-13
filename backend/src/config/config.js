import dotenv from 'dotenv';

dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Error: Missing required environment variables:');
  missingEnvVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\n💡 Please create a .env file in the backend directory with these variables.');
  console.error('   See .env.example for reference.\n');
  process.exit(1);
}

const config = {
  port: process.env.PORT || 5000,
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtExpire: process.env.JWT_EXPIRE || '30d',
  jwtRefreshExpire: process.env.JWT_REFRESH_EXPIRE || '7d',
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL,
  // Wikimedia OAuth 2.0 configuration
  wikimediaOAuth2: {
    clientId: process.env.WIKIMEDIA_CONSUMER_KEY,
    clientSecret: process.env.WIKIMEDIA_CONSUMER_SECRET,
    redirectUri: process.env.WIKIMEDIA_OAUTH2_REDIRECT_URI || 'http://localhost:5000/api/auth/wikimedia/callback',
    // MediaWiki OAuth 2.0 endpoints (meta.wikimedia.org)
    // Using REST API endpoints, not special pages
    authorizationHost: 'https://meta.wikimedia.org',
    tokenHost: 'https://meta.wikimedia.org',
    authorizationPath: '/w/rest.php/oauth2/authorize',
    tokenPath: '/w/rest.php/oauth2/access_token',
    profilePath: '/w/rest.php/oauth2/resource/profile',
  },
};

export default config;