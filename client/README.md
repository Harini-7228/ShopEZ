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
├── pages/          # Page components (Home, Cart, Checkout, Admin, etc.)
├── routes/         # ProtectedRoute role-based guard
├── utils/          # Helper functions
├── index.css       # Global CSS design system and theme variables
└── main.jsx        # App entry point
```

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
