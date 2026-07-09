import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
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

// Import background jobs
import { runPriceAlertJob } from './jobs/priceAlertJob.js';
import { runReorderReminderJob } from './jobs/reorderReminderJob.js';

// Initialize Express App
const app = express();
let server;
let jobInterval;

// Trust the first proxy to ensure proper client IP extraction behind deployments
app.set('trust proxy', 1);

// Global Middlewares
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get('/healthz', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'live',
    environment: config.env,
  });
});

app.get('/readyz', (req, res) => {
  const isDbReady = mongoose.connection.readyState === 1;
  res.status(isDbReady ? 200 : 503).json({
    success: isDbReady,
    status: isDbReady ? 'ready' : 'not_ready',
    database: isDbReady ? 'connected' : 'disconnected',
  });
});

// Mount API Routes
app.use('/api/v1/auth',          authRoutes);
app.use('/api/v1/products',      productRoutes);
app.use('/api/v1/categories',    categoryRoutes);
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

const startServer = async () => {
  await connectDB();

  server = app.listen(config.port, () => {
    console.log(`Server running in ${config.env} mode on port ${config.port}`);

    // Run background jobs immediately on startup
    // setTimeout(() => {
    //   runPriceAlertJob();
    //   runReorderReminderJob();
    // }, 3000);

    // Run background tasks periodically, ensuring rejections are caught properly
    jobInterval = setInterval(async () => {
      try {
        await runPriceAlertJob();
        await runReorderReminderJob();
      } catch (jobErr) {
        console.error('[JOBS] Unhandled job error:', jobErr.message);
      }
    }, 12 * 60 * 60 * 1000);
  });
};

startServer().catch((err) => {
  console.error(`Failed to start server: ${err.message}`);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
  shutdown(1);
});

const shutdown = async (exitCode = 0) => {
  if (jobInterval) {
    clearInterval(jobInterval);
  }

  await mongoose.disconnect().catch((err) => {
    console.error(`MongoDB disconnect error: ${err.message}`);
  });

  if (server) {
    server.close(() => process.exit(exitCode));
    return;
  }

  process.exit(exitCode);
};

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  shutdown(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  shutdown(0);
});
