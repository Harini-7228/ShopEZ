import apiClient from './apiClient';

export const getReorderSuggestions = async () => {
  const res = await apiClient.get('/reorders');
  return res.data;
};

export const runReorderAction = async (id, data) => {
  const res = await apiClient.post(`/reorders/${id}/action`, data);
  return res.data;
};
