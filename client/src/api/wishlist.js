import apiClient from './apiClient';

export const getWishlist = async () => {
  const res = await apiClient.get('/wishlist');
  return res.data;
};

export const toggleWishlistItem = async (productId) => {
  const res = await apiClient.post('/wishlist/toggle', { productId });
  return res.data;
};

export const moveWishlistItemToCart = async (productId) => {
  const res = await apiClient.post('/wishlist/move-to-cart', { productId });
  return res.data;
};
