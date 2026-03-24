"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getApiBaseUrl } from "@/lib/api-base";
import { apiFetch, ApiError } from "@/lib/api-client";
import {
  clearTokens,
  getAccessToken,
  setTokens,
} from "@/lib/auth-storage";

export type MeUser = {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  hat_name: string | null;
  district_name: string | null;
  is_provincial_official: boolean;
  /** Ana Kademe vb. koordinasyon hattı (il/ilçe kapsamı API ile genişler) */
  hat_is_coordination: boolean;
};

type AuthContextValue = {
  user: MeUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MeUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await apiFetch<MeUser>("/api/auth/me/");
      setUser(me);
    } catch {
      setUser(null);
      clearTokens();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch(`${getApiBaseUrl()}/api/auth/token/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const raw = await res.text();
    let data: Record<string, unknown> = {};
    try {
      data = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    } catch {
      data = {};
    }
    if (!res.ok) {
      const detail = data.detail;
      const nfe = data.non_field_errors;
      let msg = "Giriş başarısız. Kullanıcı adı ve şifreyi kontrol edin.";
      if (typeof detail === "string") msg = detail;
      else if (Array.isArray(nfe) && typeof nfe[0] === "string") msg = nfe[0];
      throw new Error(msg);
    }
    const access = data.access as string | undefined;
    const refresh = data.refresh as string | undefined;
    if (!access || !refresh) {
      throw new Error("Sunucu yanıtı geçersiz.");
    }
    setTokens(access, refresh);
    setLoading(true);
    try {
      const me = await apiFetch<MeUser>("/api/auth/me/");
      setUser(me);
    } catch (e) {
      clearTokens();
      setUser(null);
      if (e instanceof ApiError) {
        throw new Error("Oturum bilgisi alınamadı.");
      }
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      refreshUser,
    }),
    [user, loading, login, logout, refreshUser],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth AuthProvider icinde kullanilmali");
  }
  return ctx;
}
