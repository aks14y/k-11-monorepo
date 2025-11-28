import React from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@design-system";
import { App } from "./App";
import { AuthProvider } from "./context/AuthContext";
import { AppProvider } from "./context/AppContext";

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root container not found");
}

const root = createRoot(container);

root.render(
  <ThemeProvider>
    <AppProvider>
    <AuthProvider>
      <App />
    </AuthProvider>
    </AppProvider>
  </ThemeProvider>
);

