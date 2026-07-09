import apiClient from './apiClient';

export const registerUser = async (userData) => {
  const res = await apiClient.post('/auth/register', userData);
  return res.data;
};

export const loginUser = async (email, password) => {
  const res = await apiClient.post('/auth/login', { email, password });
  return res.data;
};

export const requestPasswordReset = async (email) => {
  const res = await apiClient.post('/auth/forgot-password', { email });
  return res.data;
};

export const resetPassword = async (token, password) => {
  const res = await apiClient.post(`/auth/reset-password/${token}`, { password });
  return res.data;
};

export const logoutUserApi = async () => {
  const res = await apiClient.post('/auth/logout');
  return res.data;
};

export const getMeProfile = async () => {
  const res = await apiClient.get('/auth/me');
  return res.data;
};

export const refreshAuthToken = async () => {
  const res = await apiClient.post('/auth/refresh-token');
  return res.data;
};
