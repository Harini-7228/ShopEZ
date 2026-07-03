# 🛍️ ShopEZ — Full-Stack E-Commerce Platform

A premium, production-ready MERN stack e-commerce application with role-based access control, real-time price alerts, atomic inventory management, and a rich modern UI.

---

## 🚀 Features

### Customer
- Browse products with category filter bar, search, price range & attribute filters
- Add to cart with stock validation and quantity controls
- Full checkout flow with shipping address & simulated payment gateway
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
| **Frontend** | React 18, Vite, React Bootstrap, React Router v6, React Hot Toast |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB with Mongoose ODM |
| **Auth** | JWT (dual-cookie: accessToken + refreshToken), role-based guards |
| **Jobs** | Node-cron background jobs (price alerts, reorder reminders) |
| **Styling** | Custom CSS design system (Earthy theme), CSS variables, glassmorphism |

---

## 📁 Project Structure

```
SHOPEZ/
├── client/               # React + Vite frontend
│   ├── src/
│   │   ├── api/          # Axios API modules (orders, products, wishlist…)
│   │   ├── components/   # Navbar, shared layout components
│   │   ├── context/      # AuthContext, CartContext
│   │   ├── pages/        # All page components (Home, Cart, Checkout…)
│   │   └── routes/       # ProtectedRoute guard
│   └── .env.example      # Copy to .env and configure
│
├── server/               # Express + MongoDB backend
│   ├── controllers/      # Route handler logic
│   ├── models/           # Mongoose schemas
│   ├── routes/           # API route definitions
│   ├── middlewares/      # Auth guard, error handler, rate limiter
│   ├── jobs/             # Cron jobs (price alerts, reorder reminders)
│   ├── utils/            # Token helpers, response helpers
│   └── .env.example      # Copy to .env and configure
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

### 4. Seed the database (optional)

```bash
cd server
node seed.js
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

> **Note:** The `delivery` role is admin-assigned only — it cannot be self-registered.

---

## 🛡️ Security Highlights

- JWT access tokens expire in 15 minutes; refresh tokens in 7 days
- HttpOnly cookies for both tokens (XSS protection)
- Admin self-registration blocked at the controller level
- Atomic stock deduction using MongoDB `findOneAndUpdate` with conditions (prevents race conditions)
- Rate limiting on the API server
- Input validation with `express-validator` on all auth routes

---

## 📝 License

MIT — feel free to use, modify, and distribute.
