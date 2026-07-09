import apiClient from './apiClient';

export const checkout = async (data) => {
  const res = await apiClient.post('/orders/checkout', data);
  return res.data;
};

export const getMyOrders = async () => {
  const res = await apiClient.get('/orders');
  return res.data;
};

export const getOrderById = async (id) => {
  const res = await apiClient.get(`/orders/${id}`);
  return res.data;
};

export const updateOrderStatus = async (id, data) => {
  const res = await apiClient.patch(`/orders/${id}/status`, data);
  return res.data;
};

export const cancelOrder = async (id) => {
  const res = await apiClient.patch(`/orders/${id}/cancel`);
  return res.data;
};
