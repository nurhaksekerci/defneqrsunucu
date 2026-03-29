'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';

import {
  fetchCurrentUser,
  loginApi,
  setUnauthorizedHandler,
} from '@/lib/api';
import { clearToken, getToken, setToken as persistToken } from '@/lib/token';
import type { CurrentUser } from '@/lib/types';

type AuthContextValue = {
  ready: boolean;
  authed: boolean;
  user: CurrentUser | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    if (pathname !== '/login') router.replace('/login');
  }, [pathname, router]);

  useEffect(() => {
    setUnauthorizedHandler(() => logout());
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  useEffect(() => {
    const t = getToken();
    if (!t) {
      setReady(true);
      return;
    }
    void fetchCurrentUser()
      .then(setUser)
      .catch(() => {
        clearToken();
        setUser(null);
      })
      .finally(() => setReady(true));
  }, []);

  const refreshUser = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      return;
    }
    try {
      setUser(await fetchCurrentUser());
    } catch {
      setUser(null);
    }
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      const token = await loginApi(username, password);
      persistToken(token);
      const me = await fetchCurrentUser();
      setUser(me);
      router.replace('/feed');
    },
    [router]
  );

  const value = useMemo(
    () => ({
      ready,
      authed: !!getToken() && !!user,
      user,
      login,
      logout,
      refreshUser,
    }),
    [ready, user, login, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth outside AuthProvider');
  return ctx;
}
