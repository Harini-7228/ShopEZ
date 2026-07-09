import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { setAccessToken, setLogoutCallback } from '../api/apiClient';
import { registerUser as apiRegister, loginUser as apiLogin, logoutUserApi as apiLogout, getMeProfile, refreshAuthToken } from '../api/authApi';
import { toast } from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const isLoggingOutRef = useRef(false);

  const logoutUser = useCallback(async () => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;
    try {
      await apiLogout();
    } catch (err) {
      // Silently ignore
    } finally {
      setAccessToken('');
      setUser(null);
      setLoading(false);
      toast.dismiss();
      toast.success('Logged out successfully', { duration: 2000 });
      setTimeout(() => { isLoggingOutRef.current = false; }, 2500);
    }
  }, []);

  const logoutUserRef = useRef(logoutUser);
  useEffect(() => {
    logoutUserRef.current = logoutUser;
  }, [logoutUser]);

  const loginUser = async (email, password) => {
    try {
      const data = await apiLogin(email, password);
      if (data && data.success) {
        const { user: loggedUser, accessToken } = data.data;
        setAccessToken(accessToken);
        setUser(loggedUser);
        toast.success(data.message || 'Logged in successfully');
        return { success: true, user: loggedUser };
      }
      const msg = data?.message || 'Login failed. Please try again.';
      toast.error(msg);
      return { success: false, error: msg };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Login failed. Please check credentials.';
      toast.error(errMsg);
      return { success: false, error: errMsg };
    }
  };

  const registerUser = async (userData) => {
    try {
      const data = await apiRegister(userData);
      if (data && data.success) {
        const { user: registeredUser, accessToken } = data.data;
        setAccessToken(accessToken);
        setUser(registeredUser);
        toast.success('Registered successfully');
        return { success: true, user: registeredUser };
      }
      const msg = data?.message || 'Registration failed. Please try again.';
      toast.error(msg);
      return { success: false, error: msg };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Registration failed';
      toast.error(errMsg);
      return { success: false, error: errMsg };
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const data = await getMeProfile();
      if (data && data.success) {
        setUser(data.data);
      }
    } catch (err) {
      setAccessToken('');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const data = await refreshAuthToken();
        if (data && data.success) {
          const { accessToken } = data.data;
          setAccessToken(accessToken);
          await fetchCurrentUser();
        } else {
          setLoading(false);
        }
      } catch (err) {
        setLoading(false);
      }
    };

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
