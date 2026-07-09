# 💻 ShopEZ — Frontend React Application

This directory contains the React frontend for the ShopEZ E-Commerce platform, built using React 19 and Vite 8 for fast hot module replacement (HMR), styled with customized React Bootstrap, and backed by a tailored Earthy-theme CSS design system.

---

## 🚀 Key Modules & Codebase Architecture

The client application structure is organized as follows:

```
client/src/
├── api/                  # Axios-based API client modules
│   ├── apiClient.js      # Base Axios client with authorization headers & automatic silent refreshes
│   ├── authApi.js        # Log in, Register, Token refresh, Logout, Profile update
│   ├── productsApi.js    # Fetch products, specifications, and review handling
│   ├── wishlistApi.js    # Add/remove items from user's wishlist
│   ├── ordersApi.js      # Cart-to-order checkout, orders retrieval
│   ├── sellerApi.js      # Create/update product listings for merchant portal
│   └── supportApi.js     # Create, retrieve, and respond to support tickets
│
├── components/           # Reusable UI components
│   ├── common/           # Common layout items (Spinner, ErrorBoundary, Footer, Layout)
│   ├── product/          # Product visual elements (ProductCard, RatingBuilder)
│   └── Navbar.jsx        # Navigation bar (with context-driven login states)
│
├── context/              # Centralized React Context Providers
│   ├── AuthContext.jsx   # Global user state, login/logout functions, automatic JWT token refreshes
│   ├── CartContext.jsx   # Client-side cart item synchronization and price aggregates
│   └── WishlistContext.jsx# User's wishlist list tracking
│
├── hooks/                # Custom React hook wrappers
│   ├── useCart.js        # Easy access hook for CartContext
│   └── useWishlist.js    # Easy access hook for WishlistContext
│
├── pages/                # Page components
│   ├── admin/            # Admin control panel (user management, category CRUD, support)
│   ├── delivery/         # Courier/Delivery shipment tracking board
│   ├── seller/           # Merchant product editor and inventory dashboard
│   ├── Home.jsx          # Main landing dashboard with compact 5-column product layouts
│   ├── ProductDetail.jsx # Product view (reviews, attributes, specifications)
│   ├── Cart.jsx          # Cart review
│   └── Checkout.jsx      # Multi-step checkout with address inputs and simulation
│
├── routes/
│   └── ProtectedRoute.jsx# Role-based route guard component
│
├── index.css             # Main styling system, CSS tokens, Earthy theme config
└── main.jsx              # App mount point and context initialization
```

---

## 🔐 Authentication & Session Flow
*   **HttpOnly Cookies Setup**: Auth state is initialized and synchronized using secure, dual HttpOnly cookies (`accessToken` and `refreshToken`) set by the backend server.
*   **Automatic Interceptor Refreshes**: The API client automatically handles expired sessions. If a request returns a `401 Unauthorized` response, an Axios response interceptor intercepts the call, hits `/refresh-token` silently in the background, updates the session, and re-triggers the original request seamlessly.

---

## 🎨 Styling System
We use standard CSS variables for styling. The core styles are configured in `src/index.css`:
*   **Theme**: Warm forest tones and organic colors (clay, terracotta, linen backgrounds, text dark contrast).
*   **Categories Scroller**: Smooth, custom drag-to-scroll horizontal row with browser scrollbars hidden on desktop/mobile for maximum sleekness.
*   **Responsive Grid**: A space-efficient 5-column layout on widescreen displays (`row-cols-lg-5`), scaling dynamically to 4, 3, or 2 columns based on screen width.

---

## 🛠️ Scripts & Development

Inside the `client/` folder:

```bash
# Install packages
npm install

# Start Vite local development server (runs on port 5173 by default)
npm run dev

# Lint check files
npm run lint

# Build production bundle
npm run build
```
