# ShopEZ — Backend API Server

Express.js API backend connected to MongoDB via Mongoose. Uses ES Modules, JWT dual-cookie authentication, Razorpay payment integration, background cron jobs, and atomic inventory management.

---

## Project Structure

```
server/src/
├── config/         # DB connection, env validation, Razorpay setup
├── controllers/    # Route handlers (auth, products, cart, orders, etc.)
├── jobs/           # Cron jobs (price alerts, reorder reminders)
├── middleware/     # JWT auth guard, rate limiter, error handler, validator
├── models/         # Mongoose schemas (User, Product, Order, Payment, etc.)
├── routes/         # API route mounts
├── scripts/        # Database seeding and image update utilities
├── services/       # Checkout logic, payment, review, and seller services
├── utils/          # JWT helpers, response formatters, coupon utilities
└── server.js       # App entry point
```

---

## Scripts

```bash
# Install dependencies
npm install

# Seed the database with initial data
npm run seed

# Start development server (port 5000, auto-reloading)
npm run dev

# Start production server
npm start
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_uri
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
CORS_ORIGIN=http://localhost:5173
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```
