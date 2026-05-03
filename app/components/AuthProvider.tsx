"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";

import {
  loginWithGoogleToken,
  loginWithEmailPassword,
  type AuthUser,
} from "../lib/auth";
import { useLocale } from "./LocaleProvider";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  login: (idToken: string) => Promise<AuthUser>;
  loginEmail: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = "event_manager_auth";

function getStoredAuthUser(): AuthUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredAuthUser());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { locale, t } = useLocale();

  function persistUser(authUser: AuthUser): void {
    setUser(authUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
    localStorage.setItem("token", authUser.token);
    // Set cookie for middleware
    document.cookie = `token=${authUser.token}; path=/; SameSite=Lax`;
  }

  const login = useCallback(async (idToken: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const authUser = await loginWithGoogleToken(idToken, locale);
      persistUser(authUser);
      return authUser;
    } catch (err) {
      const message = err instanceof Error ? err.message : t("errors.auth.sign_in_failed");
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, [locale, t]);

  const loginEmail = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const authUser = await loginWithEmailPassword(email, password, locale);
      persistUser(authUser);
      return authUser;
    } catch (err) {
      const message = err instanceof Error ? err.message : t("errors.auth.sign_in_failed");
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, [locale, t]);

  const logout = useCallback(() => {
    setUser(null);
    setError(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("token");
    // Clear cookie
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, loginEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
