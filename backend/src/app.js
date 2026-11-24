import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config/index.js';
import routes from './routes/index.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

// Trust proxy for rate limiting if behind reverse proxy (e.g. Render, Vercel, Railway)
app.set('trust proxy', 1);

// Configure CORS securely with multi-origin and Vercel preview support
const allowedOrigins = (config.corsOrigin || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    const isExplicitlyAllowed =
      allowedOrigins.includes(origin) || allowedOrigins.includes('*');
    const isDevLocalhost =
      config.nodeEnv !== 'production' && /^http:\/\/localhost(:\d+)?$/.test(origin);
    const isVercelDeploy = /\.vercel\.app$/.test(origin);

    if (isExplicitlyAllowed || isDevLocalhost || isVercelDeploy) {
      return callback(null, true);
    }

    return callback(new Error(`CORS policy blocked access from origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// Global API rate limiting
app.use('/api', apiLimiter);

// Mount main routes
app.use('/api', routes);

// 404 & Centralized Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
