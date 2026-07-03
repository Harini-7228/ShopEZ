import React, { createContext, useState, useEffect, useContext } from 'react';
import apiClient from '../api/apiClient';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchCart = async () => {
    if (!user || user.role !== 'customer') {
      setCart(null);
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.get('/cart');
      if (res.data && res.data.success) {
        setCart(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load user cart:', err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    setLoading(true);
    try {
      const res = await apiClient.post('/cart/items', { productId, quantity });
      if (res.data && res.data.success) {
        setCart(res.data.data);
        toast.success('Product added to cart');
        return { success: true };
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Could not add product to cart';
      toast.error(errMsg);
      return { success: false, error: errMsg };
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId, quantity) => {
    try {
      const res = await apiClient.put(`/cart/items/${productId}`, { quantity });
      if (res.data && res.data.success) {
        setCart(res.data.data);
        return { success: true };
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Could not update quantity';
      toast.error(errMsg);
      return { success: false, error: errMsg };
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const res = await apiClient.delete(`/cart/items/${productId}`);
      if (res.data && res.data.success) {
        setCart(res.data.data);
        toast.success('Product removed from cart');
        return { success: true };
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Could not remove product from cart';
      toast.error(errMsg);
      return { success: false, error: errMsg };
    }
  };

  const clearCart = async () => {
    try {
      const res = await apiClient.delete('/cart');
      if (res.data && res.data.success) {
        setCart(res.data.data);
        return { success: true };
      }
    } catch (err) {
      console.error('Could not clear cart:', err);
    }
  };

  // Automatically fetch cart when user logs in as customer
  useEffect(() => {
    fetchCart();
  }, [user]);

  const cartItemCount = cart?.items?.reduce((total, item) => total + item.quantity, 0) || 0;

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
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
