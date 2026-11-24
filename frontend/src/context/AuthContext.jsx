import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('queuepulse_token');
    const storedUser = localStorage.getItem('queuepulse_user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('queuepulse_token');
        localStorage.removeItem('queuepulse_user');
      }
    }
    setLoading(false);
  }, []);

  // Login handler
  const login = async (email, password) => {
    const data = await authService.login(email, password);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('queuepulse_token', data.token);
    localStorage.setItem('queuepulse_user', JSON.stringify(data.user));
    return data.user;
  };

  // Register handler
  const register = async (userData) => {
    const data = await authService.register(userData);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('queuepulse_token', data.token);
    localStorage.setItem('queuepulse_user', JSON.stringify(data.user));
    return data.user;
  };

  // Logout handler
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('queuepulse_token');
    localStorage.removeItem('queuepulse_user');
  }, []);

  // Refresh profile from server
  const refreshProfile = async () => {
    if (!token) return null;
    try {
      const freshUser = await authService.getProfile();
      setUser(freshUser);
      localStorage.setItem('queuepulse_user', JSON.stringify(freshUser));
      return freshUser;
    } catch (err) {
      if (err.response && err.response.status === 401) {
        logout();
      }
      return null;
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(user && token),
    isAdmin: user?.role === 'ADMIN',
    isStaff: user?.role === 'STAFF',
    login,
    register,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
