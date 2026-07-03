import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Layout & Guards
import Layout from './components/Layout';
import ProtectedRoute from './routes/ProtectedRoute';

// Public & Customer Pages
import Home from './pages/Home';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Wishlist from './pages/Wishlist';
import Checkout from './pages/Checkout';
import OrderHistory from './pages/OrderHistory';
import OrderDetail from './pages/OrderDetail';
import MyAlerts from './pages/MyAlerts';
import Reorders from './pages/Reorders';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';

// Seller Pages
import SellerDashboard from './pages/seller/SellerDashboard';
import ProductForm from './pages/seller/ProductForm';

// Delivery Pages
import DeliveryDashboard from './pages/delivery/DeliveryDashboard';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import CategoryCrud from './pages/admin/CategoryCrud';
import UserManagement from './pages/admin/UserManagement';
import AllOrders from './pages/admin/AllOrders';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* Primary Layout Wrapping Route */}
            <Route path="/" element={<Layout />}>
              {/* Public Views */}
              <Route index element={<Home />} />
              <Route path="products" element={<Home />} />
              <Route path="products/:id" element={<ProductDetail />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />

              {/* Shared Protected Profile */}
              <Route
                path="profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* Customer Protected Views */}
              <Route
                path="cart"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <Cart />
                  </ProtectedRoute>
                }
              />
              <Route
                path="wishlist"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <Wishlist />
                  </ProtectedRoute>
                }
              />
              <Route
                path="checkout"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <Checkout />
                  </ProtectedRoute>
                }
              />
              <Route
                path="orders/history"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <OrderHistory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="orders/:id"
                element={
                  <ProtectedRoute allowedRoles={['customer', 'seller', 'delivery', 'admin']}>
                    <OrderDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="alerts"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <MyAlerts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="reorders"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <Reorders />
                  </ProtectedRoute>
                }
              />

              {/* Seller Protected Portal */}
              <Route
                path="seller"
                element={
                  <ProtectedRoute allowedRoles={['seller']}>
                    <SellerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="seller/products"
                element={
                  <ProtectedRoute allowedRoles={['seller']}>
                    <SellerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="seller/orders"
                element={
                  <ProtectedRoute allowedRoles={['seller']}>
                    <SellerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="seller/products/new"
                element={
                  <ProtectedRoute allowedRoles={['seller']}>
                    <ProductForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="seller/products/:id/edit"
                element={
                  <ProtectedRoute allowedRoles={['seller']}>
                    <ProductForm />
                  </ProtectedRoute>
                }
              />

              {/* Delivery Protected Board */}
              <Route
                path="delivery"
                element={
                  <ProtectedRoute allowedRoles={['delivery']}>
                    <DeliveryDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Admin Protected Suite */}
              <Route
                path="admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/categories"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <CategoryCrud />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/users"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <UserManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/orders"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AllOrders />
                  </ProtectedRoute>
                }
              />

              {/* Fallback to Home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
