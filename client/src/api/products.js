import apiClient from './apiClient';

export const getProducts = async (params = {}) => {
  const res = await apiClient.get('/products', { params });
  return res.data;
};

export const getProductById = async (id) => {
  const res = await apiClient.get(`/products/${id}`);
  return res.data;
};

export const createProduct = async (data) => {
  const res = await apiClient.post('/products', data);
  return res.data;
};

export const updateProduct = async (id, data) => {
  const res = await apiClient.put(`/products/${id}`, data);
  return res.data;
};

export const deleteProduct = async (id) => {
  const res = await apiClient.delete(`/products/${id}`);
  return res.data;
};

export const updateProductStock = async (id, stock) => {
  const res = await apiClient.patch(`/products/${id}/stock`, { stock });
  return res.data;
};
