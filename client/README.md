# ShopEZ — Frontend

React frontend built with Vite, React Bootstrap, and a custom CSS design system.

---

## Project Structure

```
client/src/
├── api/            # Axios-based API client modules
├── components/     # Reusable UI components (common/, product/)
├── context/        # AuthContext, CartContext, WishlistContext
├── hooks/          # Custom React hooks (useCart, useWishlist, etc.)
├── pages/          # Page components
│   ├── admin/      # AdminDashboard, CategoryCrud, UserManagement, AllOrders, AdminSupportTickets
│   ├── delivery/   # DeliveryDashboard
│   ├── seller/     # SellerDashboard, ProductForm
│   └── ...         # Home, ProductList, ProductDetail, Cart, Checkout, OrderHistory,
│                   # ForgotPassword, ResetPassword, Wishlist, Profile, etc.
├── routes/         # ProtectedRoute role-based guard
├── utils/          # Helper functions
├── App.jsx         # Route definitions
├── index.css       # Global CSS design system and theme variables
└── main.jsx        # App entry point
```

---

## Key Pages

| Page | Description |
|---|---|
| `Home` | Logged-in home with category bar, flash deals, trending, premium products, and full product grid. Category bar buttons scroll directly to filtered results. |
| `Landing` | Guest landing page with flash deals and trending sections |
| `ProductList` | Filterable, sortable product catalogue with spec filters |
| `ProductDetail` | Product images, specs, reviews, add to cart/wishlist |
| `Cart` | Cart management with coupon input |
| `Checkout` | Address, payment method, Razorpay integration |
| `ForgotPassword` | Request password reset link via email |
| `ResetPassword` | Set a new password from the email link token |
| `OrderHistory` | Full order list with status timeline |
| `Profile` | Edit name, phone; view account info |
| `Wishlist` | Saved products, move to cart |
| `MyAlerts` | Price drop and back-in-stock subscriptions |

---

## Scripts

```bash
# Install dependencies
npm install

# Start development server (port 5173)
npm run dev

# Build for production
npm run build

# Lint
npm run lint
```

---

## Environment Variables

Copy `.env.example` to `.env`:

```
VITE_API_URL=/api/v1
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```
