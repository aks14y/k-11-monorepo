import { createContext, ReactNode, useContext, useMemo, useState, useEffect } from "react";
import { getApiConfig, getUserEmail } from "api-client";

type SharedData = Record<string, unknown>;

export type ShellData = {
  authToken: string | null;
  csrfToken: string | null;
  userEmail: string | null;
  hostUrl: string | null;
};

type AppContextValue = {
  authToken: string | null;
  setAuthToken: (token: string | null) => void;
  csrfToken: string | null;
  shellData: ShellData;
  sharedData: SharedData;
  mergeSharedData: (patch: SharedData) => void;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [sharedData, setSharedData] = useState<SharedData>({});

  // Sync tokens and userEmail from api-client and sessionStorage
  useEffect(() => {
    const syncData = () => {
      const config = getApiConfig();
      setCsrfToken(config.csrfToken);
      const email = getUserEmail();
      if (email) {
        setUserEmail(email);
      }
    };

    // Initial sync
    syncData();

    // Sync periodically (in case tokens are updated elsewhere)
    const interval = setInterval(syncData, 1000);

    return () => clearInterval(interval);
  }, []);

  const mergeSharedData = (patch: SharedData) => {
    setSharedData((prev) => ({ ...prev, ...patch }));
  };

  const shellData: ShellData = useMemo(
    () => ({
      authToken,
      csrfToken,
      userEmail,
      hostUrl: getApiConfig().hostUrl || null,
    }),
    [authToken, csrfToken, userEmail]
  );

  const value = useMemo<AppContextValue>(
    () => ({
      authToken,
      setAuthToken,
      csrfToken,
      shellData,
      sharedData,
      mergeSharedData
    }),
    [authToken, csrfToken, shellData, sharedData]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return ctx;
};

