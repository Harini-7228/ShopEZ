# 🛍️ ShopEZ — Full-Stack E-Commerce Platform

A premium, production-ready MERN stack e-commerce application with role-based access control, real-time price alerts, atomic inventory management, and a rich modern UI.

---

## 🚀 Features

### Customer
- Browse products with category filter bar, search, price range & attribute filters
- Add to cart with stock validation and quantity controls
- Full checkout flow with shipping address & Razorpay payment gateway
- Order history with live status tracking timeline
- Wishlist management with move-to-cart
- Price drop & restock alert subscriptions
- Reorder reminders for repeat purchases
- Editable profile (name, phone)

### Seller
- Dashboard with product listings overview
- Create / Edit / Delete product listings with specifications builder
- Inventory stock management

### Delivery Manager
- Delivery board to update shipment status

### Admin
- Platform statistics dashboard
- Category CRUD management (parent/child hierarchy)
- User management
- Platform-wide order management

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 8, React Bootstrap, React Router v7, React Hot Toast |
| **Backend** | Node.js, Express.js (Refactored to ES Modules) |
| **Database** | MongoDB with Mongoose ODM |
| **Auth** | JWT (dual-cookie: accessToken + refreshToken), role-based guards |
| **Jobs** | Node-cron background jobs (price alerts, reorder reminders) |
| **Styling** | Custom CSS design system (Earthy theme), CSS variables, glassmorphism |

---

## 📁 Project Structure

```
SHOPEZ/
├── client/               # React 19 + Vite frontend
│   ├── src/
│   │   ├── api/          # Axios API modules (authApi, productsApi, wishlistApi…)
│   │   ├── components/   # UI components (common/, product/, Navbar.jsx, Layout.jsx)
│   │   ├── context/      # AuthContext, CartContext, WishlistContext
│   │   ├── hooks/        # Custom React hooks (useCart, useWishlist…)
│   │   ├── pages/        # All page components (Home, Cart, Checkout…)
│   │   ├── routes/       # ProtectedRoute guard
│   │   └── utils/        # Formatters, helper functions
│   └── .env.example      # Copy to .env and configure
│
├── server/               # Express + MongoDB backend (ES Modules)
│   ├── src/
│   │   ├── config/       # Database, environment, and Razorpay configurations
│   │   ├── controllers/  # Route handlers (auth, product, cart, orders…)
│   │   ├── jobs/         # Cron jobs (price alerts, reorder reminders)
│   │   ├── middleware/   # Auth guard, error handler, rate limiter
│   │   ├── models/       # Mongoose schemas (User, Product, Order, Review…)
│   │   ├── routes/       # API route definitions (auth, products, categories…)
│   │   ├── scripts/      # Database seeding and utility scripts
│   │   ├── services/     # Third-party integrations & database updates
│   │   ├── utils/        # Token, response, and coupon helpers
│   │   └── server.js     # Express app startup & configuration
│   └── package.json
│
└── .gitignore
```

---

## ⚙️ Local Setup

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/shopez.git
cd shopez
```

### 2. Configure environment variables

```bash
# Server
cp server/.env.example server/.env
# Edit server/.env — add your MONGO_URI and JWT secrets

# Client
cp client/.env.example client/.env
# Default VITE_API_URL=/api/v1 works for local dev
```

### 3. Install dependencies

```bash
# Server
cd server && npm install

# Client
cd ../client && npm install
```

### 4. Seed the database

```bash
cd server
npm run seed
```

### 5. Run the development servers

```bash
# Terminal 1 — Start backend (port 5000)
cd server && npm run dev

# Terminal 2 — Start frontend (port 5173)
cd client && npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔐 Default Roles

| Role | Access |
|---|---|
| `customer` | Browse, cart, checkout, wishlist, alerts |
| `seller` | Product listings dashboard |
| `delivery` | Delivery board (admin-assigned) |
| `admin` | Full platform control |

---

## 🛡️ Security Highlights

- **ES Modules**: Fully migrated from CommonJS to native ES Modules.
- **Strict Cart Validation**: Restricts cart operations to clean positive integers, preventing schema-casting errors.
- **State-Safe Status Alignment**: Updates stock levels atomically using aggregation update pipelines, keeping product statuses synchronized.
- **Razorpay Refund Fallback**: Triggers automatic refunds if checking out fails after payment capture, eliminating payment-order mismatch.
- **Non-blocking Logout Flow**: Decodes tokens ignoring expiration, enabling successful cookie clearing and DB token revocation under any state.
- **JWT Authorization**: Dual-cookie configuration utilizing HttpOnly credentials to secure access and refresh states.
- **Brute-Force Rate Limiting**: Dedicated endpoint request quotas.

---

## 📝 License

MIT — feel free to use, modify, and distribute.
