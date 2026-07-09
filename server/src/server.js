import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import config from './config/env.js';
import connectDB from './config/db.js';
import errorHandler from './middleware/errorHandler.js';

// Import routes
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import categoryRoutes from './routes/categories.js';
import cartRoutes from './routes/cart.js';
import wishlistRoutes from './routes/wishlist.js';
import orderRoutes from './routes/orders.js';
import paymentRoutes from './routes/payments.js';
import reviewRoutes from './routes/reviews.js';
import alertRoutes from './routes/alerts.js';
import reorderRoutes from './routes/reorders.js';
import sellerRoutes from './routes/seller.js';
import adminRoutes from './routes/admin.js';
import supportRoutes from './routes/support.js';
import couponRoutes from './routes/coupons.js';

// Import rate limiters
import { globalLimiter, publicLimiter, authLimiter } from './middleware/rateLimiter.js';

// Import background jobs
import { runPriceAlertJob } from './jobs/priceAlertJob.js';
import { runReorderReminderJob } from './jobs/reorderReminderJob.js';

// Initialize Express App
const app = express();

// Trust the first proxy to ensure proper client IP extraction under rate limiters
app.set('trust proxy', 1);

// Connect to MongoDB
connectDB();

// Global Middlewares
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Apply global rate limiter to all routes
app.use(globalLimiter);

// Mount API Routes
// Apply auth rate limiter strictly to login and registration paths
app.use('/api/v1/auth/login',    authLimiter);
app.use('/api/v1/auth/register', authLimiter);
app.use('/api/v1/auth',          authRoutes);
app.use('/api/v1/products',      publicLimiter, productRoutes);
app.use('/api/v1/categories',    publicLimiter, categoryRoutes);
app.use('/api/v1/cart',          cartRoutes);
app.use('/api/v1/wishlist',      wishlistRoutes);
app.use('/api/v1/orders',        orderRoutes);
app.use('/api/v1/payments',      paymentRoutes);
app.use('/api/v1/reviews',       reviewRoutes);
app.use('/api/v1/alerts',        alertRoutes);
app.use('/api/v1/reorders',      reorderRoutes);
app.use('/api/v1/seller',        sellerRoutes);
app.use('/api/v1/admin',         adminRoutes);
app.use('/api/v1/support',       supportRoutes);
app.use('/api/v1/coupons',       couponRoutes);

// Base Route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ShopEZ E-Commerce API is running...',
    version: 'v1',
    environment: config.env,
  });
});

// Catch 404 routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Endpoint not found: ${req.method} ${req.originalUrl}`,
    data: null,
  });
});

// Centralized Error Handler
app.use(errorHandler);

// Start server
const server = app.listen(config.port, () => {
  console.log(`Server running in ${config.env} mode on port ${config.port}`);

  // Run background jobs immediately on startup
  // setTimeout(() => {
  //   runPriceAlertJob();
  //   runReorderReminderJob();
  // }, 3000);

  // Run background tasks periodically, ensuring rejections are caught properly
  setInterval(async () => {
    try {
      await runPriceAlertJob();
      await runReorderReminderJob();
    } catch (jobErr) {
      console.error('[JOBS] Unhandled job error:', jobErr.message);
    }
  }, 12 * 60 * 60 * 1000);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
