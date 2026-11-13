import { env } from './env.js';

export const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);

    if (
      env.ALLOWED_ORIGINS.includes(origin) ||
      origin === env.CLIENT_URL ||
      origin === env.FRONTEND_URL ||
      env.NODE_ENV === 'development'
    ) {
      return callback(null, true);
    }

    return callback(new Error(`CORS policy does not allow access from origin ${origin}`), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400,
};

export default corsOptions;
