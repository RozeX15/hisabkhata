import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { api, setAuthToken, getAuthToken } from './api';
import { signInWithGoogle, firebaseSignOut, auth } from './firebase';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<User>;
  loginWithGoogle: (fallbackEmail?: string) => Promise<User>;
  loginWithDirectEmail: (email: string, name?: string) => Promise<User>;
  register: (nameOrData: any, email?: string, password?: string) => Promise<User>;
  updateUserProfile: (data: any) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  loginDemoUser: () => Promise<User>;
  loginDemoAdmin: () => Promise<User>;
  loginSultanAdmin: () => Promise<User>;
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

  const login = async (email: string, password: string): Promise<User> => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.login({ identifier: email, email, password });
      setAuthToken(res.token);
      setTokenState(res.token);
      setUser(res.user);
      return res.user;
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithDirectEmail = async (email: string, name?: string): Promise<User> => {
    setLoading(true);
    setError(null);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await api.loginWithGoogle({
        email: cleanEmail,
        name: name || cleanEmail.split('@')[0],
      });
      setAuthToken(res.token);
      setTokenState(res.token);
      setUser(res.user);
      return res.user;
    } catch (err: any) {
      setError(err.message || 'Direct sign-in failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (fallbackEmail?: string): Promise<User> => {
    setLoading(true);
    setError(null);

    // If fallbackEmail is provided and user requested direct Google sign-in
    if (fallbackEmail) {
      return await loginWithDirectEmail(fallbackEmail);
    }

    try {
      const fbResult = await signInWithGoogle();
      const fbUser = fbResult.user;
      if (!fbUser.email) {
        throw new Error('No email found with this Google account.');
      }
      const res = await api.loginWithGoogle({
        email: fbUser.email,
        name: fbUser.displayName || undefined,
        avatarUrl: fbUser.photoURL || undefined,
        firebaseUid: fbUser.uid,
        idToken: fbResult.idToken,
      });
      setAuthToken(res.token);
      setTokenState(res.token);
      setUser(res.user);
      return res.user;
    } catch (err: any) {
      const errMsg = err?.message || '';
      const isConfigOrNotFound =
        errMsg.includes('Requested resource was not found') ||
        err?.code === 'auth/configuration-not-found' ||
        err?.code === 'auth/operation-not-allowed' ||
        err?.code === 'auth/internal-error';

      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setError(null);
      } else if (isConfigOrNotFound) {
        const friendlyMsg = 'Google Authentication is currently unavailable via popup in this environment. Please sign in with your email & password or direct ID.';
        setError(friendlyMsg);
        const wrappedErr = new Error(friendlyMsg);
        (wrappedErr as any).isProviderMissing = true;
        throw wrappedErr;
      } else {
        setError(err.message || 'Google Sign-In failed');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (nameOrData: any, email?: string, password?: string): Promise<User> => {
    setLoading(true);
    setError(null);
    const data = typeof nameOrData === 'string'
      ? {
          name: nameOrData,
          email,
          phone: email && !email.includes('@') ? email : undefined,
          password,
        }
      : nameOrData;
    try {
      const res = await api.register(data);
      setAuthToken(res.token);
      setTokenState(res.token);
      setUser(res.user);
      return res.user;
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
    try {
      firebaseSignOut(auth).catch(() => {});
    } catch {}
    setAuthToken(null);
    setTokenState(null);
    setUser(null);
  };

  const loginDemoUser = async (): Promise<User> => {
    return await login('user@hishabkhata.com', 'password123');
  };

  const loginDemoAdmin = async (): Promise<User> => {
    return await login('admin@hishabkhata.com', 'admin123');
  };

  const loginSultanAdmin = async (): Promise<User> => {
    return await login('sultanitbangladesh@gmail.com', 'admin123');
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
      loginWithGoogle,
      loginWithDirectEmail,
      register,
      updateUserProfile,
      logout,
      refreshUser,
      loginDemoUser,
      loginDemoAdmin,
      loginSultanAdmin,
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
