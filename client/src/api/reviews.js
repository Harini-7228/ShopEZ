import apiClient from './apiClient';

export const createReview = async (data) => {
  const res = await apiClient.post('/reviews', data);
  return res.data;
};

export const getProductReviews = async (productId) => {
  const res = await apiClient.get(`/reviews/product/${productId}`);
  return res.data;
};

export const deleteReview = async (reviewId) => {
  const res = await apiClient.delete(`/reviews/${reviewId}`);
  return res.data;
};
