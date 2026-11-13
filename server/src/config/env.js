import dotenv from 'dotenv';
dotenv.config();

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://localhost:4173'];

const jwtSecret = process.env.JWT_SECRET || 'shopsphere_super_secure_jwt_access_secret_key_2026_dev';

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  API_PREFIX: process.env.API_PREFIX || '/api/v1',
  APP_NAME: process.env.APP_NAME || 'ShopSphere',

  // Client URLs & CORS
  CLIENT_URL: process.env.CLIENT_URL || corsOrigins[0] || 'http://localhost:5173',
  FRONTEND_URL: process.env.FRONTEND_URL || corsOrigins[0] || 'http://localhost:5173',
  CORS_ORIGIN: process.env.CORS_ORIGIN || corsOrigins.join(','),
  ALLOWED_ORIGINS: corsOrigins,

  // Database
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/shopsphere',
  MONGODB_DB_NAME: process.env.MONGODB_DB_NAME || 'shopsphere',

  // Redis
  REDIS_URL: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  REDIS_ENABLED: process.env.REDIS_ENABLED === 'true',

  // JWT
  JWT_SECRET: jwtSecret,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || jwtSecret,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || `${jwtSecret}_refresh`,
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || process.env.JWT_EXPIRES_IN || '7d',
  COOKIE_SECRET: process.env.COOKIE_SECRET || `${jwtSecret}_cookie_secret_32chars_min`,

  // Razorpay
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || '',

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',

  // Mail / SMTP
  MAIL_SERVICE: process.env.MAIL_SERVICE || '',
  SMTP_HOST: process.env.MAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.MAIL_PORT || process.env.SMTP_PORT, 10) || 587,
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.MAIL_USER || process.env.SMTP_USER || '',
  SMTP_PASS: process.env.MAIL_PASS || process.env.SMTP_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || '"ShopSphere" <no-reply@shopsphere.com>',

  // Google OAuth
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 1000,

  // Initial Admin
  INITIAL_ADMIN_EMAIL: process.env.INITIAL_ADMIN_EMAIL || 'admin@shopsphere.com',
  INITIAL_ADMIN_PASSWORD: process.env.INITIAL_ADMIN_PASSWORD || 'Admin@ShopSphere2026!',
  INITIAL_ADMIN_NAME: process.env.INITIAL_ADMIN_NAME || 'System Administrator',
};

export const validateEnv = () => {
  const required = ['JWT_ACCESS_SECRET'];
  const missing = required.filter((key) => !process.env[key] && !env[key]);
  if (missing.length > 0) {
    console.warn(`[WARN] Missing recommended environment variables: ${missing.join(', ')}`);
  }
};

export default env;
