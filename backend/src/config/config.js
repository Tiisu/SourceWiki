import dotenv from 'dotenv';

dotenv.config();

const config = {
  port: process.env.PORT || 5000,
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpire: process.env.JWT_EXPIRE || '30d',
<<<<<<< HEAD
=======
  jwtRefreshExpire: process.env.JWT_REFRESH_EXPIRE || '7d',
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL,
  // Wikimedia OAuth 1.0a configuration (Primary - More stable)
  wikimediaOAuth1: {
    consumerKey: process.env.WIKIMEDIA_OAUTH1_CONSUMER_KEY || process.env.WIKIMEDIA_CONSUMER_KEY,
    consumerSecret: process.env.WIKIMEDIA_OAUTH1_CONSUMER_SECRET || process.env.WIKIMEDIA_CONSUMER_SECRET,
    callbackUrl: process.env.WIKIMEDIA_OAUTH1_CALLBACK_URL || 'http://localhost:5000/api/auth/wikimedia/callback',
    // OAuth 1.0a endpoints for meta.wikimedia.org
    // Documentation: https://www.mediawiki.org/wiki/OAuth/For_Developers#OAuth_1.0a
    requestTokenUrl: 'https://meta.wikimedia.org/w/index.php?title=Special:OAuth/initiate',
    accessTokenUrl: 'https://meta.wikimedia.org/w/index.php?title=Special:OAuth/token',
    authorizeUrl: 'https://meta.wikimedia.org/w/index.php?title=Special:OAuth/authorize',
    apiBaseUrl: 'https://meta.wikimedia.org',
  },
  // Wikimedia OAuth 2.0 configuration (Deprecated due to bugs)
  wikimediaOAuth2: {
    clientId: process.env.WIKIMEDIA_CONSUMER_KEY,
    clientSecret: process.env.WIKIMEDIA_CONSUMER_SECRET,
    redirectUri: process.env.WIKIMEDIA_OAUTH2_REDIRECT_URI || 'http://localhost:5000/api/auth/wikimedia/callback',
    authorizationHost: 'https://meta.wikimedia.org',
    tokenHost: 'https://meta.wikimedia.org',
    authorizationPath: '/w/rest.php/oauth2/authorize',
    tokenPath: '/w/rest.php/oauth2/access_token',
    profilePath: '/w/rest.php/oauth2/resource/profile',
  },
>>>>>>> 718cf8f (Add OAuth 1.0a implementation with fallback support)
};

export default config;