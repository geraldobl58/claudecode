"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface MockUser {
  name: string;
}

interface AuthContextValue {
  user: MockUser | null;
  signIn: (name: string) => void;
  signOut: () => void;
}

const STORAGE_KEY = "av_user";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      // ignore malformed storage
    }
  }, []);

  const signIn = (name: string) => {
    const mockUser: MockUser = { name: (name || "PLAYER1").toUpperCase().slice(0, 10) };
    setUser(mockUser);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser));
    } catch {
      // localStorage unavailable (private mode, etc.) — session just won't persist
    }
  };

  const signOut = () => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // localStorage unavailable — nothing to clean up
    }
  };

  return <AuthContext.Provider value={{ user, signIn, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
