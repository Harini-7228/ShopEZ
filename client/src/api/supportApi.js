import apiClient from './apiClient';

export const createTicket = async (ticketData) => {
  const response = await apiClient.post('/support', ticketData);
  return response.data;
};

export const getMyTickets = async () => {
  const response = await apiClient.get('/support/my');
  return response.data;
};

export const getAllTickets = async (params = {}) => {
  const response = await apiClient.get('/support/all', { params });
  return response.data;
};

export const getTicketById = async (id) => {
  const response = await apiClient.get(`/support/${id}`);
  return response.data;
};

export const replyToTicket = async (id, message) => {
  const response = await apiClient.post(`/support/${id}/reply`, { message });
  return response.data;
};

export const updateTicketStatus = async (id, status) => {
  const response = await apiClient.patch(`/support/${id}/status`, { status });
  return response.data;
};
