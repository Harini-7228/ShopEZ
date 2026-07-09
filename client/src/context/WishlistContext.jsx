import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { getWishlist } from '../api/wishlistApi';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchWishlist = useCallback(async () => {
    if (!user || user.role !== 'customer') {
      setWishlist(null);
      return;
    }
    setLoading(true);
    try {
      const res = await getWishlist();
      if (res?.success) setWishlist(res.data);
    } catch (err) {
      console.error('Failed to load wishlist:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]); // stable ref — only re-runs when user changes

  const wishlistItemCount = wishlist?.items?.length ?? 0;

  const value = { wishlist, wishlistItemCount, loading, fetchWishlist };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within a WishlistProvider');
  return context;
};
