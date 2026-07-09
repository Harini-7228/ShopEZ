# 🛍️ ShopEZ — Full-Stack E-Commerce Platform

A full-stack MERN e-commerce application with role-based access, Razorpay payments, price alerts, and a modern UI.

---

## 🚀 Features

### Customer
- Browse products with category filters, search, and price range controls
- Add to cart with stock validation and quantity controls
- Checkout with shipping address and Razorpay payment integration
- Order history with live status tracking
- Wishlist with move-to-cart support
- Price drop and restock alert subscriptions
- Reorder reminders for repeat purchases
- Editable profile (name, phone)

### Seller
- Dashboard with product listings overview
- Create, edit, and delete product listings with a specifications builder
- Inventory and stock management

### Delivery Manager
- Delivery board to update shipment statuses

### Admin
- Platform statistics dashboard
- Category management (parent/child hierarchy)
- User management
- Platform-wide order management
- Support ticket handling

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, React Bootstrap, React Router v7 |
| **Backend** | Node.js, Express.js (ES Modules) |
| **Database** | MongoDB with Mongoose ODM |
| **Auth** | JWT dual-cookie (accessToken + refreshToken), role-based guards |
| **Jobs** | node-cron background jobs (price alerts, reorder reminders) |
| **Payments** | Razorpay payment gateway with automatic refund fallback |
| **Styling** | Custom CSS design system with CSS variables |

---

## 📁 Project Structure

```
SHOPEZ/
├── client/                   # React frontend
│   ├── src/
│   │   ├── api/              # Axios API modules
│   │   ├── components/       # Reusable UI components
│   │   ├── context/          # AuthContext, CartContext, WishlistContext
│   │   ├── hooks/            # Custom React hooks
│   │   ├── pages/            # Page components
│   │   ├── routes/           # ProtectedRoute guard
│   │   └── utils/            # Helper functions
│   └── .env.example
│
├── server/                   # Express + MongoDB backend
│   ├── src/
│   │   ├── config/           # DB, environment, and payment configs
│   │   ├── controllers/      # Route handlers
│   │   ├── jobs/             # Cron jobs
│   │   ├── middleware/       # Auth, error handler, rate limiter
│   │   ├── models/           # Mongoose schemas
│   │   ├── routes/           # API route definitions
│   │   ├── scripts/          # Seeding and utility scripts
│   │   ├── services/         # Business logic and integrations
│   │   ├── utils/            # Token, response, and coupon helpers
│   │   └── server.js         # App entry point
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
git clone https://github.com/Harini-7228/ShopEZ.git
cd ShopEZ
```

### 2. Configure environment variables

```bash
# Server
cp server/.env.example server/.env

# Client
cp client/.env.example client/.env
```

### 3. Install dependencies

```bash
cd server
npm install

cd ../client
npm install
```

### 4. Seed the database

```bash
cd server
npm run seed
```

### 5. Start the development servers

```bash
# Terminal 1 — Backend (port 5000)
cd server
npm run dev

# Terminal 2 — Frontend (port 5173)
cd client
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔐 Default Roles

| Role | Access |
|---|---|
| `customer` | Browse, cart, checkout, wishlist, alerts |
| `seller` | Product listings dashboard |
| `delivery` | Delivery board |
| `admin` | Full platform control |

---

## 📝 License

MIT
