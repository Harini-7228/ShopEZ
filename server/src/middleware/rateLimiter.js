import rateLimit from 'express-rate-limit';

/**
 * Three-tier rate limiting strategy:
 *
 *  1. globalLimiter   — safety net for every route (generous limit)
 *  2. publicLimiter   — tighter limit for unauthenticated browsing endpoints
 *                       (product list, categories, search) — the most likely
 *                       scraping / DDoS targets
 *  3. authLimiter     — strict limit on login/register to block brute-force
 */

const windowMs = 15 * 60 * 1000; // 15-minute rolling window

/** Standard JSON response when limit is exceeded */
const handler = (req, res) => {
  res.status(429).json({
    success: false,
    message: 'Too many requests. Please slow down and try again later.',
    data: null,
  });
};

/**
 * Global safety net — 300 requests per 15 min per IP.
 * Applied to every route before anything else.
 */
const globalLimiter = rateLimit({
  windowMs,
  max: 300,
  standardHeaders: true,  // Return RateLimit-* headers so clients can back off
  legacyHeaders: false,
  handler,
  skip: (req) => {
    // Never rate-limit the health-check root route
    return req.path === '/';
  },
});

/**
 * Public browsing limiter — 60 requests per 15 min per IP.
 * Applied to: GET /products, GET /categories, GET /products/:id
 * These endpoints hit MongoDB and are the easiest scraping targets.
 */
const publicLimiter = rateLimit({
  windowMs,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

/**
 * Auth limiter — 10 attempts per 15 min per IP.
 * Applied to: POST /auth/login, POST /auth/register
 * Prevents brute-force and credential-stuffing attacks.
 */
const authLimiter = rateLimit({
  windowMs,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many login attempts. Please wait 15 minutes before trying again.',
      data: null,
    });
  },
});

export { globalLimiter, publicLimiter, authLimiter };
