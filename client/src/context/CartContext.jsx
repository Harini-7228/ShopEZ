import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import apiClient from '../api/apiClient';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);

  // useCallback gives fetchCart a stable reference so it can safely be
  // listed in useEffect deps and passed to child components without
  // triggering cascading re-renders.
  const fetchCart = useCallback(async () => {
    if (!user || user.role !== 'customer') {
      setCart(null);
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.get('/cart');
      if (res.data?.success) setCart(res.data.data);
    } catch (err) {
      console.error('Failed to load user cart:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addToCart = useCallback(async (productId, quantity = 1) => {
    // Validate input parameters before dispatching request
    const parsedQty = parseInt(quantity, 10);
    if (isNaN(parsedQty) || parsedQty < 1) {
      toast.error('Quantity must be at least 1');
      return { success: false, error: 'Invalid quantity' };
    }
    setLoading(true);
    try {
      const res = await apiClient.post('/cart/items', { productId, quantity: parsedQty });
      if (res.data?.success) {
        setCart(res.data.data);
        toast.success('Product added to cart');
        return { success: true };
      }
      // Handle 2xx responses containing error flags
      const msg = res.data?.message || 'Could not add product to cart';
      toast.error(msg);
      return { success: false, error: msg };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Could not add product to cart';
      toast.error(errMsg);
      return { success: false, error: errMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateQuantity = useCallback(async (productId, quantity) => {
    setLoading(true);
    try {
      const res = await apiClient.put(`/cart/items/${productId}`, { quantity });
      if (res.data?.success) {
        setCart(res.data.data);
        return { success: true };
      }
      // Handle 2xx responses containing error flags
      const msg = res.data?.message || 'Could not update quantity';
      toast.error(msg);
      return { success: false, error: msg };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Could not update quantity';
      toast.error(errMsg);
      return { success: false, error: errMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const removeFromCart = useCallback(async (productId) => {
    setLoading(true);
    try {
      const res = await apiClient.delete(`/cart/items/${productId}`);
      if (res.data?.success) {
        setCart(res.data.data);
        toast.success('Product removed from cart');
        return { success: true };
      }
      // Handle 2xx responses containing error flags
      const msg = res.data?.message || 'Could not remove product from cart';
      toast.error(msg);
      return { success: false, error: msg };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Could not remove product from cart';
      toast.error(errMsg);
      return { success: false, error: errMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const clearCart = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.delete('/cart');
      if (res.data?.success) {
        setCart(res.data.data);
        return { success: true };
      }
      // Handle 2xx responses containing error flags
      const msg = res.data?.message || 'Could not clear cart';
      toast.error(msg);
      return { success: false, error: msg };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Could not clear cart';
      toast.error(errMsg);
      return { success: false, error: errMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]); // stable ref — only re-runs when user changes

  // Derived value: computed once per cart update, not on every consumer render
  const cartItemCount = cart?.items?.reduce((total, item) => total + item.quantity, 0) ?? 0;

  const value = {
    cart,
    cartItemCount,
    loading,
    fetchCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
