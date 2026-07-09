import apiClient from './apiClient';

// Dashboard reports
export const getSalesSummary = async () => {
  const res = await apiClient.get('/admin/dashboard/sales-summary');
  return res.data;
};

export const getTopSellers = async () => {
  const res = await apiClient.get('/admin/dashboard/top-sellers');
  return res.data;
};

export const getLowStockReport = async () => {
  const res = await apiClient.get('/admin/dashboard/low-stock');
  return res.data;
};

// User controls
export const getAdminUsers = async () => {
  const res = await apiClient.get('/admin/users');
  return res.data;
};

export const updateUserRole = async (userId, role) => {
  const res = await apiClient.put(`/admin/users/${userId}/role`, { role });
  return res.data;
};

export const deleteUserByAdmin = async (userId) => {
  const res = await apiClient.delete(`/admin/users/${userId}`);
  return res.data;
};

// Global Orders listing
export const getAdminOrders = async (params = {}) => {
  const res = await apiClient.get('/admin/orders', { params });
  return res.data;
};

// Category CRUD
export const createAdminCategory = async (data) => {
  const res = await apiClient.post('/admin/categories', data);
  return res.data;
};

export const updateAdminCategory = async (id, data) => {
  const res = await apiClient.put(`/admin/categories/${id}`, data);
  return res.data;
};

export const deleteAdminCategory = async (id) => {
  const res = await apiClient.delete(`/admin/categories/${id}`);
  return res.data;
};
