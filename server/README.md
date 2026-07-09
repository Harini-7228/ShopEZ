# ShopEZ — Backend API Server

Express.js API backend connected to MongoDB via Mongoose. Uses ES Modules, JWT dual-cookie authentication, Razorpay payment integration, background cron jobs, and atomic inventory management.

---

## Project Structure

```
server/src/
├── config/         # DB connection, env validation, Razorpay setup
├── controllers/    # Route handlers (auth, products, cart, orders, etc.)
├── jobs/           # Cron jobs (price alerts, reorder reminders)
├── middleware/     # JWT auth guard, error handler, validator
├── models/         # Mongoose schemas (User, Product, Order, Payment, etc.)
├── routes/         # API route mounts under /api/v1/
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

---

## Auth Flow

- **Register / Login** — issues a short-lived access token (15 min) and long-lived refresh token (7 days), both stored as HttpOnly cookies
- **Token refresh** — silent refresh via `/auth/refresh`; the frontend Axios interceptor retries automatically on 401
- **Forgot Password** — generates a signed reset token sent by email; the token is single-use and expires in 1 hour
- **Reset Password** — validates the token, hashes the new password, invalidates the token

---

## API Endpoints

Base URL: `http://localhost:5000/api/v1`

| Prefix | Description |
|---|---|
| `/auth` | Register, login, logout, refresh token, forgot/reset password |
| `/products` | Browse, search, filter, sort products |
| `/categories` | Category listing with parent/child hierarchy |
| `/cart` | Cart CRUD |
| `/wishlist` | Wishlist management |
| `/orders` | Checkout, order history, delivery status updates |
| `/payments` | Razorpay order creation and signature verification |
| `/reviews` | Product reviews and ratings |
| `/alerts` | Price drop and back-in-stock subscriptions |
| `/reorders` | Reorder reminder listings |
| `/coupons` | Available coupon codes |
| `/seller` | Seller dashboard, product management |
| `/admin` | Admin panel — users, orders, categories, tickets |
| `/support` | Customer support tickets |
