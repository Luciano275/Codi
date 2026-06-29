'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { apiPost, apiGet } from './api-client';

export interface UserProfile {
  id: string;
  cmsUserId: number;
  cmsSource: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl: string;
  role: string;
  xp: number;
  gems: number;
  level: number;
  streak: number;
}

interface LoginResponse {
  token: string;
  user: UserProfile;
}

interface MeResponse {
  user: UserProfile;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = 'codi_token';
const CACHE_KEY = 'codi_user_cache';

function cacheUser(user: UserProfile) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(user));
  } catch {
    /* quota exceeded */
  }
}

function clearCache() {
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch {
    /* noop */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      setLoading(false);
      return;
    }

    setToken(stored);

    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        setUser(JSON.parse(cached) as UserProfile);
      } catch {
        /* invalid cache */
      }
    }

    apiGet<MeResponse>('/api/auth/me', stored)
      .then((res) => {
        setUser(res.user);
        cacheUser(res.user);
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        clearCache();
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await apiPost<LoginResponse>('/api/auth/login', {
      username,
      password,
    });
    localStorage.setItem(TOKEN_KEY, res.token);
    fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: res.token }),
    });
    cacheUser(res.user);
    setToken(res.token);
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    fetch('/api/auth/session', { method: 'DELETE' });
    clearCache();
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
