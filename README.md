# ShopEZ — E-Commerce Platform

ShopEZ is a full-stack e-commerce web app built with the MERN stack. It supports four user roles — customer, seller, delivery manager, and admin — each with their own dedicated interface. The backend is a REST API built with Express.js and MongoDB, and the frontend is a React SPA using Vite.

---

## Features

**Customer**
- Browse products by category, search by name, and filter by price range
- Smart category bar with click-to-scroll navigation to filtered product results
- Flash deals, trending collections, and premium product sections on the home page
- Product detail page with specs, reviews, and related products
- Add to cart, manage quantities, and proceed to checkout
- Pay with Razorpay or a mock card flow
- View order history with a live status timeline
- Wishlist with option to move items directly to cart
- Set price drop and back-in-stock alerts
- Reorder reminders for products bought before
- Raise and track support tickets
- Forgot password / reset password via email link
- Edit profile details (name, phone)

**Seller**
- Dashboard showing all listings, stock levels, and incoming orders
- Create and edit products with a dynamic specifications builder
- Delete listings and manage inventory

**Delivery Manager**
- View all orders assigned for delivery
- Update shipment status (packed → shipped → delivered)

**Admin**
- Platform stats overview
- Manage product categories with parent/child hierarchy
- View and manage all users
- See all platform orders
- Respond to customer support tickets

---

## Tech Stack

**Frontend**
- React 19, Vite 8
- React Router v7
- React Bootstrap + Bootstrap 5
- Axios (with response interceptors for auto token refresh)
- React Hot Toast

**Backend**
- Node.js + Express 5 (ES Modules)
- MongoDB + Mongoose 9
- JWT (access + refresh tokens via HttpOnly cookies)
- bcrypt for password hashing
- express-validator for request validation
- Razorpay SDK
- node-cron background jobs

---

## Project Structure

```
ShopEZ/
├── client/
│   ├── src/
│   │   ├── api/            # One file per API domain (authApi, productsApi, ordersApi, etc.)
│   │   ├── components/
│   │   │   ├── common/     # Layout, Navbar, Footer, Sidebar, ErrorBoundary
│   │   │   └── product/    # ProductCard
│   │   ├── context/        # AuthContext, CartContext, WishlistContext
│   │   ├── hooks/          # useCart, useWishlist, useOrders, useProducts
│   │   ├── pages/
│   │   │   ├── admin/      # AdminDashboard, CategoryCrud, UserManagement, AllOrders, AdminSupportTickets
│   │   │   ├── delivery/   # DeliveryDashboard
│   │   │   ├── seller/     # SellerDashboard, ProductForm
│   │   │   └── ...         # Home, ProductList, ProductDetail, Cart, Checkout, OrderHistory,
│   │   │                   # ForgotPassword, ResetPassword, etc.
│   │   ├── routes/         # ProtectedRoute (role-based guard)
│   │   ├── utils/          # productVariants and other helpers
│   │   └── index.css       # Global styles and CSS variables
│   ├── .env.example
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── config/         # db.js, env.js, razorpay.js
│   │   ├── controllers/    # One file per domain
│   │   ├── jobs/           # priceAlertJob.js, reorderReminderJob.js (run every 12h)
│   │   ├── middleware/     # auth.js, errorHandler.js, validate.js
│   │   ├── models/         # User, Product, Order, Payment, Review, Cart, Wishlist, etc.
│   │   ├── routes/         # Mounted under /api/v1/
│   │   ├── scripts/        # seed.js, updateDbImages.js
│   │   ├── services/       # checkoutService, authService, orderService, reviewService, sellerService
│   │   ├── utils/          # token.js, apiResponse.js, couponUtils.js, asyncHandler.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
│
└── .gitignore
```

---

## Getting Started

### Requirements
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Clone the repo

```bash
git clone https://github.com/Harini-7228/ShopEZ.git
cd ShopEZ
```

### 2. Set up environment variables

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Fill in `server/.env` with your MongoDB URI, JWT secrets, and Razorpay keys.  
The `VITE_API_URL=/api/v1` default in `client/.env` works as-is for local development.

### 3. Install dependencies

```bash
cd server && npm install
cd ../client && npm install
```

### 4. Seed the database

```bash
cd server
npm run seed
```

This creates categories, products, and the default user accounts listed below.

### 5. Start the servers

```bash
# Terminal 1
cd server && npm run dev    # runs on http://localhost:5000

# Terminal 2
cd client && npm run dev    # runs on http://localhost:5173
```

---

## Test Accounts

All accounts are created by the seed script with password `123456`.

| Role | Email | Password |
|---|---|---|
| Customer | customer@shopez.com | 123456 |
| Seller | seller@shopez.com | 123456 |
| Delivery Manager | delivery@shopez.com | 123456 |
| Admin | admin@shopez.com | 123456 |

---

## API

Base URL: `http://localhost:5000/api/v1`

| Prefix | Description |
|---|---|
| `/auth` | Register, login, logout, refresh token, forgot/reset password |
| `/products` | Browse, search, filter products |
| `/categories` | Category listing |
| `/cart` | Cart CRUD |
| `/wishlist` | Wishlist management |
| `/orders` | Checkout, order history, status updates |
| `/payments` | Razorpay order creation and verification |
| `/reviews` | Product reviews |
| `/alerts` | Price and stock alert subscriptions |
| `/reorders` | Reorder reminders |
| `/coupons` | Available coupon codes |
| `/seller` | Seller dashboard and product management |
| `/admin` | Admin panel endpoints |
| `/support` | Support tickets |

---

## Coupons

Two coupons are available at checkout:

| Code | Discount | Minimum Order |
|---|---|---|
| `SAVE10` | 10% off | ₹500 |
| `SHOPEZ15` | 15% off | ₹3000 |

---

## License

MIT
