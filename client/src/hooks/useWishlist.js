import { useWishlist as useWishlistFromContext } from '../context/WishlistContext';

export const useWishlist = () => {
  return useWishlistFromContext();
};
