import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAppContext } from "./AppContext";
import type { AuthUser } from "@types";
import {
  initializeApi,
  apiFetch,
  setAuthTokens,
  clearSessionStorage,
  getUserEmail,
  isAuthenticated as checkIsAuthenticated,
  getApiConfig,
  shouldUseMockAuth,
  getMockAuthResponse,
} from "@api-client";

type AuthContextValue = {
  isAuthenticated: boolean;
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { setAuthToken } = useAppContext();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize API and restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        setLoading(true);
        setError(null);

        // Initialize API (restores from sessionStorage or authenticates)
        await initializeApi();

        // Check if we have valid tokens
        if (checkIsAuthenticated()) {
          const config = getApiConfig();
          const userEmail = getUserEmail();

          // Restore user from sessionStorage or API
          if (userEmail) {
            setUser({ email: userEmail });
            setAuthToken(config.authToken);
          } else {
            // Try to fetch user info from API
            try {
              const userData = await apiFetch("/k11/api/v1.0/user/me");
              if (userData?.email) {
                setUser({ email: userData.email });
                setAuthToken(config.authToken);
              }
            } catch (err) {
              // If API call fails, user might not be authenticated
              console.warn("[AuthContext] Failed to fetch user info:", err);
            }
          }
        }
      } catch (err) {
        console.error("[AuthContext] Failed to restore session:", err);
        setError(err instanceof Error ? err.message : "Failed to restore session");
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, [setAuthToken]);

  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        let response;

        if (shouldUseMockAuth()) {
          // Use mock response when CORS is blocking API calls
          console.log("[AuthContext] Using mock authentication (CORS workaround)");
          
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Return mock response
          response = getMockAuthResponse(email);
        } else {
          // Call real login API endpoint
          response = await apiFetch("/k11/api/v1.0/authenticate", {
            method: "POST",
            body: JSON.stringify({
              user: email,
              password,
              csrfTokenNeeded: true,
            }),
          });
        }

        // Extract tokens from response
        const csrfToken = response.csrfToken || null;
        const authToken = response.token || null;
        const hostUrl = response.hostUrl || getApiConfig().hostUrl;

        if (!csrfToken || !authToken) {
          throw new Error("Invalid response: missing tokens");
        }

        // Save tokens to sessionStorage and memory
        setAuthTokens(csrfToken, authToken, hostUrl, email);

        // Update state
        setUser({ email });
        setAuthToken(authToken);
        
        // Update shellData in AppContext (userEmail will be synced via shellData)
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Login failed";
        setError(errorMessage);
        throw err; // Re-throw so LoginPage can handle it
      } finally {
        setLoading(false);
      }
    },
    [setAuthToken]
  );

  const logout = useCallback(() => {
    try {
      // Optionally call logout API endpoint
      // await apiFetch("/k11/api/v1.0/logout", { method: "POST" });
    } catch (err) {
      console.warn("[AuthContext] Logout API call failed:", err);
    } finally {
      // Clear all tokens and state
      clearSessionStorage();
      setUser(null);
      setAuthToken(null);
      setError(null);
    }
  }, [setAuthToken]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: Boolean(user) && checkIsAuthenticated(),
      user: user ? { email: user.email } : null,
      loading,
      login,
      logout,
      error,
    }),
    [user, loading, login, logout, error]
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

