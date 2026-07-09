import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file.
// quiet avoids noisy dotenv tips in production logs.
dotenv.config({ path: path.join(__dirname, '../../.env'), quiet: true });

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/shopez',
  dbConnectTimeoutMs: parseInt(process.env.DB_CONNECT_TIMEOUT_MS, 10) || 15000,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'shopez_access_token_secret_key_12345',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'shopez_refresh_token_secret_key_67890',
  jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
};

// Hard-fail on missing production secrets — never allow startup with known-weak defaults
if (config.env === 'production') {
  const missing = [];
  if (!process.env.JWT_ACCESS_SECRET)  missing.push('JWT_ACCESS_SECRET');
  if (!process.env.JWT_REFRESH_SECRET) missing.push('JWT_REFRESH_SECRET');
  if (!process.env.MONGO_URI)          missing.push('MONGO_URI');
  if (missing.length > 0) {
    console.error(
      `FATAL: Missing required environment variables: ${missing.join(', ')}. ` +
      'Server will not start with insecure defaults in production.'
    );
    process.exit(1);
  }
}

export default config;
