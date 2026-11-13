import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import morgan from 'morgan';
import { env } from './config/env.js';
import corsOptions from './config/cors.js';
import { helmetConfig, apiRateLimiter } from './config/security.js';
import { notFoundHandler } from './middlewares/notFound.middleware.js';
import { errorHandler } from './middlewares/error.middleware.js';
import routes from './routes/index.js';

const app = express();

// Security HTTP headers
app.use(helmetConfig);

// CORS configuration
app.use(cors(corsOptions));

// HTTP Request logging
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Compress response bodies
app.use(compression());

// Parse JSON request body with rawBody capture for payment webhooks
app.use(
  express.json({
    limit: '10mb',
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parsing
app.use(cookieParser(env.COOKIE_SECRET));

// Global API rate limiting
app.use(apiRateLimiter);

// Root health check
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to ShopSphere API Gateway',
    version: '1.0.0',
    docs: '/api/v1/health',
  });
});

// Mount modular API routes under API prefix (e.g. /api/v1)
app.use(env.API_PREFIX, routes);

// Handle unknown routes (404)
app.use(notFoundHandler);

// Centralized error handling
app.use(errorHandler);

export { app };
export default app;
