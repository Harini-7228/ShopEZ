const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const config = require('./config/env');
const connectDB = require('./config/db');
const errorHandler = require('./middlewares/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const cartRoutes = require('./routes/cart');
const wishlistRoutes = require('./routes/wishlist');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const reviewRoutes = require('./routes/reviews');
const alertRoutes = require('./routes/alerts');
const reorderRoutes = require('./routes/reorders');
const sellerRoutes = require('./routes/seller');
const adminRoutes = require('./routes/admin');

// Import background jobs
const { runPriceAlertJob } = require('./jobs/priceAlertJob');
const { runReorderReminderJob } = require('./jobs/reorderReminderJob');

// Initialize Express App
const app = express();

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

// Mount API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/wishlist', wishlistRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/alerts', alertRoutes);
app.use('/api/v1/reorders', reorderRoutes);
app.use('/api/v1/seller', sellerRoutes);
app.use('/api/v1/admin', adminRoutes);

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
  setTimeout(() => {
    runPriceAlertJob();
    runReorderReminderJob();
  }, 3000);

  // Set jobs to run every 12 hours (43200000 ms)
  setInterval(() => {
    runPriceAlertJob();
    runReorderReminderJob();
  }, 12 * 60 * 60 * 1000);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
