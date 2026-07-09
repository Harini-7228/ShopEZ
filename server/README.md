# ⚙️ ShopEZ — Backend API Server

This directory contains the Express.js API backend for the ShopEZ E-Commerce platform, connected to MongoDB with Mongoose ODM. It is written using modern ES Modules, implements dual-cookie JWT authentication, strict security policies, background cron jobs, and atomic inventory mutations.

---

## 🚀 Key Modules & Codebase Architecture

The backend application structure is organized under `src/` as follows:

```
server/src/
├── config/               # Platform and third-party setups
│   ├── db.js             # MongoDB connection client
│   ├── env.js            # Environment variable validation wrapper
│   └── razorpay.js       # Razorpay gateway credentials & refund helper
│
├── controllers/          # Business logic handlers
│   ├── authController.js # Handles registration, login, dual-cookie verification, and secure token refreshes
│   ├── productController.js# Catalogs, reviews, and stock updates
│   ├── cartController.js # Shopping cart item increments and checks
│   ├── orderController.js# Order placement, status transitions, and tracking
│   ├── sellerController.js# Merchant listings management
│   ├── adminController.js# Stats dashboards and user management
│   └── ...
│
├── jobs/                 # Recurring background tasks
│   ├── priceAlertJob.js  # Scans and triggers email alerts on price-drops
│   └── reorderReminderJob.js# Reminds customers of consumable reorders
│
├── middleware/           # Pipeline filters & controllers guards
│   ├── auth.js           # JWT validation and role-based policy enforcement
│   ├── rateLimiter.js    # Express-rate-limit layers (global, public, auth brute-force)
│   ├── errorHandler.js   # Centralized express error handler
│   └── validate.js       # express-validator result checker
│
├── models/               # MongoDB Mongoose schemas
│   ├── User.js           # Users (Customer, Seller, Delivery, Admin roles)
│   ├── Product.js        # Catalog entries and customer ratings
│   ├── Order.js          # Cart item snapshots and shipment updates
│   └── ...
│
├── routes/               # API route maps
│   ├── auth.js           # /api/v1/auth mounts
│   ├── products.js       # /api/v1/products mounts
│   └── ...
│
├── scripts/              # Independent utilities
│   ├── seed.js           # Full-platform dev database seeder
│   └── updateDbImages.js # Bulk Unsplash images update tool
│
├── services/             # Third-party integrations
│   ├── reviewService.js  # Ratings calculation triggers
│   └── checkoutService.js# Inventory mutations and checkout coordination
│
├── utils/                # General helpers
│   ├── token.js          # JWT signing and dual-cookie injection helpers
│   └── apiResponse.js    # Uniform API JSON responders
│
└── server.js             # Application entry point & Express setup
```

---

## 🛡️ Security & Architecture Details

1.  **Dual-Cookie JWT Authentication**:
    *   `accessToken` cookie (expires in 15 minutes) is used for active authorization.
    *   `refreshToken` cookie (expires in 7 days) is set as `HttpOnly`, `Secure`, and `SameSite: Strict` to prevent CSRF and XSS.
    *   Logout actions can be performed regardless of access token expiration via context-aware token parsing.
2.  **Razorpay Automatic Refunds**:
    *   Integrates Razorpay gateway payment verification. If stock validations fail after capturing the payment during checkout, the server automatically issues a full refund.
3.  **Atomic Inventory Deductions**:
    *   Stock updates during orders are performed atomically using Mongoose update pipelines, preventing race conditions, negative inventory, or double-sales.
4.  **Custom Mongoose Query Validation**:
    *   Validates custom schemas (like `discountPrice`) correctly across both Query and Document context boundaries to prevent database validation errors.

---

## 🛠️ Scripts & Development

Inside the `server/` folder:

```bash
# Install packages
npm install

# Seed the MongoDB database with initial categories, mock sellers, and products
npm run seed

# Run the bulk database images validation update script
node src/scripts/updateDbImages.js

# Start the Express server on port 5000 (auto-reloading via Nodemon)
npm run dev

# Start the server in production mode
npm run start
```
