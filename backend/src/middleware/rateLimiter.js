import rateLimit from 'express-rate-limit';

// Standard rate limiter for general API routes (100 requests per minute)
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      message: 'Too many requests from this IP. Please try again after a minute.',
      status: 429,
    },
  },
});

// Stricter rate limiter for authentication endpoints (20 attempts per 15 minutes)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      message: 'Too many login or registration attempts. Please try again after 15 minutes.',
      status: 429,
    },
  },
});
