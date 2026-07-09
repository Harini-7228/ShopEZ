import apiClient from './apiClient';

export const createReview = async (data) => {
  const res = await apiClient.post('/reviews', data);
  return res.data;
};

/**
 * Fetch paginated reviews for a product.
 * @param {string} productId
 * @param {object} params - Optional: { page, limit }
 */
export const getProductReviews = async (productId, params = {}) => {
  const res = await apiClient.get(`/reviews/product/${productId}`, { params });
  return res.data;
};

export const deleteReview = async (reviewId) => {
  const res = await apiClient.delete(`/reviews/${reviewId}`);
  return res.data;
};
