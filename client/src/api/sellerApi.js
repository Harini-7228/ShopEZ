import apiClient from './apiClient';

export const getSellerDashboard = async () => {
  const res = await apiClient.get('/seller/dashboard');
  return res.data;
};
