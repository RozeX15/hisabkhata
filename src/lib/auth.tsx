import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { api, setAuthToken, getAuthToken } from './api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (nameOrData: any, email?: string, password?: string) => Promise<void>;
  updateUserProfile: (data: any) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  loginDemoUser: () => Promise<void>;
  loginDemoAdmin: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(() => getAuthToken());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const refreshUser = async () => {
    const currentToken = getAuthToken();
    setTokenState(currentToken);
    if (!currentToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      setUser(res.user);
    } catch (err) {
      console.warn('Failed to verify token:', err);
      setAuthToken(null);
      setTokenState(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.login({ email, password });
      setAuthToken(res.token);
      setTokenState(res.token);
      setUser(res.user);
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (nameOrData: any, email?: string, password?: string) => {
    setLoading(true);
    setError(null);
    const data = typeof nameOrData === 'string' ? { name: nameOrData, email, password } : nameOrData;
    try {
      const res = await api.register(data);
      setAuthToken(res.token);
      setTokenState(res.token);
      setUser(res.user);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (data: any) => {
    setLoading(true);
    try {
      const res = await api.updateProfile(data);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setAuthToken(null);
    setTokenState(null);
    setUser(null);
  };

  const loginDemoUser = async () => {
    await login('user@hishabkhata.com', 'password123');
  };

  const loginDemoAdmin = async () => {
    await login('admin@hishabkhata.com', 'admin123');
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      error,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
      login,
      register,
      updateUserProfile,
      logout,
      refreshUser,
      loginDemoUser,
      loginDemoAdmin,
      clearError,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
