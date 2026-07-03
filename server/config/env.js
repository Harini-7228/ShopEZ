const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/shopez',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'shopez_access_token_secret_key_12345',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'shopez_refresh_token_secret_key_67890',
  jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};

// Simple check to warn about missing production secrets
if (config.env === 'production') {
  if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
    console.warn('WARNING: JWT secrets are not set in environment variables! Using default keys.');
  }
  if (!process.env.MONGO_URI) {
    console.warn('WARNING: MONGO_URI is not set! Using default local URI.');
  }
}

module.exports = config;
