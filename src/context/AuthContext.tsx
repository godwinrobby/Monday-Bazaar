import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { ecommerce } from '../db/ecommerce';
import { EcCustomer } from '../types/ecommerce';
import { loadSession, saveSession, clearSession } from '../utils/auth';

interface AuthContextType {
  customer: EcCustomer | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { name?: string; email: string; phone?: string; password: string }) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
  updateProfile: (patch: Partial<EcCustomer>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customer, setCustomer] = useState<EcCustomer | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount.
  useEffect(() => {
    let active = true;
    (async () => {
      const session = loadSession();
      if (session?.customerId) {
        try {
          const c = await ecommerce.getCustomer(session.customerId);
          if (active && c && c.status === 'active') {
            delete (c as any).password_hash;
            delete (c as any).password_salt;
            setCustomer(c);
          } else if (active && c) {
            clearSession();
          }
        } catch {
          if (active) clearSession();
        }
      }
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const c = await ecommerce.loginCustomer(email, password);
    if (!c) throw new Error('Invalid email or password');
    setCustomer(c);
    saveSession({ customerId: c.id, email: c.email, name: c.name });
  }, []);

  const register = useCallback(async (input: { name?: string; email: string; phone?: string; password: string }) => {
    const c = await ecommerce.registerCustomer(input);
    setCustomer(c);
    saveSession({ customerId: c.id, email: c.email, name: c.name });
  }, []);

  const logout = useCallback(() => {
    setCustomer(null);
    clearSession();
  }, []);

  const refresh = useCallback(async () => {
    const session = loadSession();
    if (session?.customerId) {
      try {
        const c = await ecommerce.getCustomer(session.customerId);
        if (c) {
          delete (c as any).password_hash;
          delete (c as any).password_salt;
          setCustomer(c);
        }
      } catch { /* keep current */ }
    }
  }, []);

  const updateProfile = useCallback(async (patch: Partial<EcCustomer>) => {
    if (!customer) throw new Error('Not logged in');
    const updated = await ecommerce.updateCustomer(customer.id, patch);
    setCustomer(updated);
    const session = loadSession();
    if (session) saveSession({ ...session, name: updated.name, email: updated.email });
  }, [customer]);

  const value = useMemo<AuthContextType>(() => ({
    customer,
    loading,
    isAuthenticated: !!customer,
    login,
    register,
    logout,
    refresh,
    updateProfile,
  }), [customer, loading, login, register, logout, refresh, updateProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
