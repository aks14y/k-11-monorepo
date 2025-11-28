import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { useAppContext } from "./AppContext";
import type { AuthUser } from "@types";

type AuthContextValue = {
  isAuthenticated: boolean;
  user: AuthUser | null;
  login: (email: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { setAuthToken } = useAppContext();
  const [user, setUser] = useState<AuthUser | null>(null);

  const login = (email: string) => {
    const token = `token:${email}`;
    setUser({ email });
    setAuthToken(token);
  };

  const logout = () => {
    setUser(null);
    setAuthToken(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: Boolean(user),
      user: user ? { email: user.email } : null,
      login,
      logout
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};

