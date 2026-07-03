import apiClient from './apiClient';

export const subscribeAlert = async (data) => {
  const res = await apiClient.post('/alerts/subscribe', data);
  return res.data;
};

export const listAlerts = async () => {
  const res = await apiClient.get('/alerts');
  return res.data;
};

export const unsubscribeAlert = async (id) => {
  const res = await apiClient.delete(`/alerts/${id}`);
  return res.data;
};
