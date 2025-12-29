import React from "react";
import { createRoot } from "react-dom/client";
import { MantineProvider, createTheme } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@mantine/core/styles.css";
import "./index.css";
import { App } from "./App";
import { AuthProvider } from "./context/AuthContext";
import { AppProvider } from "./context/AppContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { colors, typography } from "@design-system/design-tokens";

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root container not found");
}

// Create Mantine theme from design tokens
// Mantine requires color arrays with 10 shades (0-9)
// We'll use the primary colors and generate intermediate shades
const mantineTheme = createTheme({
  primaryColor: "blue",
  colors: {
    blue: [
      colors.primary,        // shade 0 (lightest)
      colors.primary,        // shade 1
      colors.primary,        // shade 2
      colors.primary,        // shade 3
      colors.primary,        // shade 4
      colors.primary,        // shade 5
      colors.primaryDark,    // shade 6
      colors.primaryDark,    // shade 7
      colors.primaryDark,    // shade 8
      colors.primaryDark,    // shade 9 (darkest)
    ],
    green: [
      colors.secondary,      // shade 0
      colors.secondary,      // shade 1
      colors.secondary,      // shade 2
      colors.secondary,      // shade 3
      colors.secondary,      // shade 4
      colors.secondary,      // shade 5
      colors.success,        // shade 6
      colors.success,        // shade 7
      colors.success,        // shade 8
      colors.success,        // shade 9
    ],
  },
  fontFamily: typography.fontFamily,
  defaultRadius: "md",
});

// Wrapper component to access theme from ThemeContext and sync with Mantine
const MantineThemeWrapper = ({ children }: { children: React.ReactNode }) => {
  const { theme } = useTheme();
  
  return (
    <MantineProvider 
      theme={mantineTheme} 
      defaultColorScheme={theme === "dark" ? "dark" : "light"}
      forceColorScheme={theme === "dark" ? "dark" : "light"}
    >
      {children}
    </MantineProvider>
  );
};

// Create React Query client with default options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

const root = createRoot(container!);

root.render(
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <MantineThemeWrapper>
        <AppProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </AppProvider>
      </MantineThemeWrapper>
    </ThemeProvider>
  </QueryClientProvider>
);
