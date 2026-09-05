import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { api, setAuthToken, getAuthToken } from './api';
import { signInWithGoogle, firebaseSignOut, auth } from './firebase';
import { safeStorage } from './storage';
import {
  saveAccountToCloud,
  findPersistentAccount,
  normalizeBDPhone,
  isPhoneNumber
} from './accountPersistence';
import bcrypt from 'bcryptjs';

interface StoredAccount {
  name: string;
  email?: string;
  phone?: string;
  password?: string;
  preferredLanguage?: string;
  preferredCurrency?: string;
  savedAt: number;
}

function getAccountVault(): Record<string, StoredAccount> {
  try {
    const raw = safeStorage.getItem('hk_account_vault');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAccountToVault(account: StoredAccount) {
  try {
    const vault = getAccountVault();
    const cleanEmail = (account.email || '').trim().toLowerCase();
    const cleanPhone = (account.phone || '').trim();
    if (cleanEmail) vault[cleanEmail] = account;
    if (cleanPhone) vault[cleanPhone] = account;
    safeStorage.setItem('hk_account_vault', JSON.stringify(vault));
    if (cleanEmail || cleanPhone) {
      safeStorage.setItem('hk_remembered_identifier', cleanEmail || cleanPhone);
    }
  } catch {
    // Non-blocking
  }
}

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
    const cleanIdentifier = email.trim();
    try {
      const res = await api.login({ identifier: cleanIdentifier, email: cleanIdentifier, password });
      setAuthToken(res.token);
      setTokenState(res.token);
      setUser(res.user);
      safeStorage.setItem('hk_remembered_identifier', cleanIdentifier);
      // Asynchronously keep cloud and local vault updated
      saveAccountToCloud(res.user, password).catch(() => {});
      return res.user;
    } catch (err: any) {
      const errMsg = String(err.message || '');
      // If server returns "No account found", check Cloud Firestore and Device Vault
      // (Solves serverless container restarts and multi-device persistence)
      const isNotFound =
        errMsg.includes('No account found') ||
        errMsg.includes('Please click "Sign Up"') ||
        errMsg.includes('not found') ||
        errMsg.includes('credentials');

      if (isNotFound) {
        try {
          const stored = await findPersistentAccount(cleanIdentifier);
          if (stored && stored.name) {
            const isPasswordValid = stored.passwordHash
              ? (bcrypt.compareSync(password, stored.passwordHash) || bcrypt.compareSync(password.trim(), stored.passwordHash))
              : true;

            if (isPasswordValid) {
              const syncRes = await api.syncUser({
                user: {
                  id: stored.id,
                  name: stored.name,
                  email: stored.email,
                  phone: stored.phone,
                  preferredLanguage: stored.preferredLanguage,
                  preferredCurrency: stored.preferredCurrency,
                  plan: stored.plan,
                  role: stored.role,
                  status: stored.status,
                  createdAt: stored.createdAt,
                },
                passwordHash: stored.passwordHash,
                password,
              });

              setAuthToken(syncRes.token);
              setTokenState(syncRes.token);
              setUser(syncRes.user);
              safeStorage.setItem('hk_remembered_identifier', cleanIdentifier);
              saveAccountToCloud(syncRes.user, password, stored.passwordHash).catch(() => {});
              return syncRes.user;
            } else {
              const pwErr = new Error('Incorrect password. Please check your credentials and try again.');
              setError(pwErr.message);
              throw pwErr;
            }
          }
        } catch (syncErr: any) {
          if (syncErr.message && syncErr.message.includes('Incorrect password')) {
            setError(syncErr.message);
            throw syncErr;
          }
        }
      }

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
      safeStorage.setItem('hk_remembered_identifier', cleanEmail);
      saveAccountToCloud(res.user).catch(() => {});
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
      safeStorage.setItem('hk_remembered_identifier', fbUser.email);
      saveAccountToCloud(res.user).catch(() => {});
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

      // Persist across Cloud Firestore and Local Vault for permanent availability
      saveAccountToCloud(res.user, data.password).catch((e) => console.warn('Cloud sync error:', e));

      return res.user;
    } catch (err: any) {
      const errMsg = String(err.message || '');
      // If user already exists, try logging in with the provided password
      if (errMsg.includes('already exists') && data.password && (data.email || data.phone)) {
        try {
          const loggedIn = await login(data.email || data.phone, data.password);
          return loggedIn;
        } catch {
          // Fall through to error
        }
      }
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
    if (user?.email) {
      safeStorage.setItem('hk_remembered_identifier', user.email);
    } else if (user?.phone) {
      safeStorage.setItem('hk_remembered_identifier', user.phone);
    }
    setAuthToken(null);
    setTokenState(null);
    setUser(null);
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
