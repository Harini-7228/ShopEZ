import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import apiClient, { setAccessToken, setLogoutCallback } from '../api/apiClient';
import { toast } from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const isLoggingOutRef = useRef(false);

  // Fix #12: Use useCallback so logoutUser has a stable reference.
  // Fix #20: Removed console.warn that fired on every unauthenticated page load.
  const logoutUser = useCallback(async () => {
    // Guard: prevent multiple concurrent logout calls from showing duplicate toasts
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;
    try {
      await apiClient.post('/auth/logout');
    } catch (err) {
      // Silently ignore — server-side logout error should not block client cleanup
    } finally {
      setAccessToken('');
      setUser(null);
      setLoading(false);
      toast.dismiss(); // clear any stacked toasts first
      toast.success('Logged out successfully', { duration: 2000 });
      // Reset flag after a short delay so future logouts work
      setTimeout(() => { isLoggingOutRef.current = false; }, 2500);
    }
  }, []);

  // Fix #12: Store logoutUser in a ref so the interceptor always has the latest version
  const logoutUserRef = useRef(logoutUser);
  useEffect(() => {
    logoutUserRef.current = logoutUser;
  }, [logoutUser]);

  const loginUser = async (email, password) => {
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      if (res.data && res.data.success) {
        const { user: loggedUser, accessToken } = res.data.data;
        setAccessToken(accessToken);
        setUser(loggedUser);
        toast.success(res.data.message || 'Logged in successfully');
        return { success: true, user: loggedUser };
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Login failed. Please check credentials.';
      toast.error(errMsg);
      return { success: false, error: errMsg };
    }
  };

  const registerUser = async (userData) => {
    try {
      const res = await apiClient.post('/auth/register', userData);
      if (res.data && res.data.success) {
        const { user: registeredUser, accessToken } = res.data.data;
        setAccessToken(accessToken);
        setUser(registeredUser);
        toast.success('Registered successfully');
        return { success: true, user: registeredUser };
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Registration failed';
      toast.error(errMsg);
      return { success: false, error: errMsg };
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const res = await apiClient.get('/auth/me');
      if (res.data && res.data.success) {
        setUser(res.data.data);
      }
    } catch (err) {
      // Fix #20: Removed console.warn — this fires silently on every unauthenticated visit
      setAccessToken('');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Perform silent refresh and load profile details on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Silently hit refresh first
        const res = await apiClient.post('/auth/refresh-token');
        if (res.data && res.data.success) {
          const { accessToken } = res.data.data;
          setAccessToken(accessToken);
          await fetchCurrentUser();
        } else {
          setLoading(false);
        }
      } catch (err) {
        setLoading(false);
      }
    };

    // Fix #12: Pass a stable wrapper so interceptor always calls the latest logoutUser
    setLogoutCallback(() => logoutUserRef.current());
    initializeAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const value = {
    user,
    loading,
    loginUser,
    registerUser,
    logoutUser,
    refreshUser: fetchCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
