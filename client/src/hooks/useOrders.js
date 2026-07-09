import { useState, useCallback } from 'react';
import { checkout, getMyOrders, getOrderById, updateOrderStatus, cancelOrder } from '../api/ordersApi';

export const useOrders = () => {
  const [orders, setOrders] = useState([]);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMyOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyOrders();
      if (data?.success) {
        setOrders(data.data || []);
      } else {
        setError(data?.message || 'Failed to fetch orders');
      }
      return data;
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOrderById = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOrderById(id);
      if (data?.success) {
        setOrder(data.data);
      } else {
        setError(data?.message || 'Failed to fetch order details');
      }
      return data;
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const performCheckout = useCallback(async (checkoutData) => {
    setLoading(true);
    setError(null);
    try {
      const data = await checkout(checkoutData);
      return data;
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'An error occurred during checkout');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    orders,
    order,
    loading,
    error,
    fetchMyOrders,
    fetchOrderById,
    performCheckout,
    updateOrderStatus,
    cancelOrder,
  };
};
