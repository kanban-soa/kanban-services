import cors from 'cors';
import config from '../config/env';

const allowAllInDev = config.nodeEnv === 'development' && config.cors.origins.includes('*');

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowAllInDev) {
      callback(null, true);
      return;
    }

    if (config.cors.origins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'X-Request-ID', 'X-API-Version'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset', 'X-Request-ID'],
  credentials: true,
  maxAge: 86400,
});

