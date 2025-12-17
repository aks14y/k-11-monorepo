import { ReactNode, useEffect, useState, Suspense } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { LoginPage } from "./components/LoginPage";
import { useAuth } from "./context/AuthContext";
import { Heading, Text, Card, Stack } from "@design-system";
import type { Plugin } from "plugin-registry";
import { PluginRegistry } from "plugin-registry";
import { DynamicRoute } from "./components/DynamicRoute";

const ProtectedRoute = ({ children, isAuthenticated }: { children: ReactNode; isAuthenticated: boolean }) => {
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  return <>{children}</>;
};

const Dashboard = () => (
  <Card>
    <Heading level={2}>Dashboard</Heading>
    <Text>Protected dashboard exposed by the host shell.</Text>
  </Card>
);

export const App = () => {
  const { isAuthenticated } = useAuth();
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loadingPlugins, setLoadingPlugins] = useState(true);
  const [pluginsError, setPluginsError] = useState<string | null>(null);

  useEffect(() => {
    const registry = new PluginRegistry();
    registry
      .fetchPlugins()
      .then((fetched) => {
        setPlugins(fetched);
        setLoadingPlugins(false);
      })
      .catch((err) => {
        console.error("[App] Failed to fetch plugins:", err);
        setPluginsError(err.message);
        setLoadingPlugins(false);
      });
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/auth"
          element={
            isAuthenticated ? (
              <Navigate to="/" replace />
            ) : (
              <LoginPage />
            )
          }
        />
        <Route
          path="/*"
          element={
            <Layout plugins={plugins}>
              <Routes>
                <Route
                  path="/"
                  element={
                    <ProtectedRoute isAuthenticated={isAuthenticated}>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                {plugins.map((plugin) => (
                  <Route
                    key={plugin.id}
                    path={plugin.route}
                    element={
                      <ProtectedRoute isAuthenticated={isAuthenticated}>
                        <Suspense
                          fallback={
                            <Card>
                              <Stack gap="16px">
                                <Heading level={2}>Loading {plugin.metadata.title}…</Heading>
                                <Text variant="muted">Preparing the component.</Text>
                              </Stack>
                            </Card>
                          }
                        >
                          <DynamicRoute plugin={plugin} />
                        </Suspense>
                      </ProtectedRoute>
                    }
                  />
                ))}
                {loadingPlugins && (
                  <Route
                    path="*"
                    element={
                      <Card>
                        <Stack gap="16px">
                          <Heading level={2}>Loading plugins…</Heading>
                          <Text variant="muted">Fetching available modules from backend API.</Text>
                        </Stack>
                      </Card>
                    }
                  />
                )}
                {pluginsError && (
                  <Route
                    path="*"
                    element={
                      <Card>
                        <Stack gap="16px">
                          <Heading level={2}>Error loading plugins</Heading>
                          <Text variant="muted">{pluginsError}</Text>
                          <Text variant="muted">
                            Check browser console for details. Ensure backend API is running or set PLUGINS_ENDPOINT for mock data.
                          </Text>
                        </Stack>
                      </Card>
                    }
                  />
                )}
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

