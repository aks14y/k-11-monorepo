import { createContext, ReactNode, useContext, useMemo, useState } from "react";

type SharedData = Record<string, unknown>;

type AppContextValue = {
  authToken: string | null;
  setAuthToken: (token: string | null) => void;
  sharedData: SharedData;
  mergeSharedData: (patch: SharedData) => void;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [sharedData, setSharedData] = useState<SharedData>({});

  const mergeSharedData = (patch: SharedData) => {
    setSharedData((prev) => ({ ...prev, ...patch }));
  };

  const value = useMemo<AppContextValue>(
    () => ({
      authToken,
      setAuthToken,
      sharedData,
      mergeSharedData
    }),
    [authToken, sharedData]
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

