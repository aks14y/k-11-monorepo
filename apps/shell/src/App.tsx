import {
  type ComponentType,
  type LazyExoticComponent,
  ReactNode,
  Suspense,
  lazy,
  useEffect,
  useState
} from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { LoginPage } from "./components/LoginPage";
import { useAuth } from "./context/AuthContext";
import { Heading, Text, Card, Stack } from "@design-system";
import type { Plugin } from "plugin-registry";
import { PluginRegistry } from "plugin-registry";
import { DynamicRoute } from "./components/DynamicRoute";
import { RemoteErrorBoundary } from "./components/RemoteErrorBoundary";

// Feature flags: Control whether modules are available (for UI display)
// Note: In production, inbox and monitoring are runtime remote modules loaded via backend API
// (same as external plugins). Their code is in this repo for development convenience.
const ENABLE_K11_INBOX = process.env.ENABLE_K11_INBOX !== "false";
const ENABLE_K11_MONITORING = process.env.ENABLE_K11_MONITORING !== "false";

// Check if remote URLs are configured (ONLY for development testing of Module Federation)
// In production, all modules (inbox, monitoring, external) come from backend API (/api/plugins)
const USE_REMOTE_INBOX = Boolean(process.env.REMOTE_INBOX_URL);
const USE_REMOTE_MONITORING = Boolean(process.env.REMOTE_MONITORING_URL);

// Detect production mode (for disabling local fallback)
// In production, all modules MUST come from backend API - no local bundling fallback
const IS_PRODUCTION = process.env.NODE_ENV === "production";

// Build-time remote imports: Used ONLY when REMOTE_*_URL env vars are set (dev testing)
// In production, these modules are loaded via PluginRegistry/DynamicRoute (runtime remotes)
const InboxAppRemote: LazyExoticComponent<ComponentType<any>> | undefined = 
  ENABLE_K11_INBOX && USE_REMOTE_INBOX
    ? lazy(() =>
        // @ts-ignore - Remote module resolved at runtime by Module Federation
        import(/* webpackPrefetch: true */ "k11Inbox/InboxApp")
          .then((mod: any) => ({
            default: mod.InboxApp ?? mod.default
          }))
          .catch((error) => {
            // Re-throw with more context for error boundary
            throw new Error(
              `Failed to load remote module k11Inbox from ${process.env.REMOTE_INBOX_URL}. ` +
              `Make sure the remote dev server is running. Original error: ${error.message}`
            );
          })
      )
    : undefined;

const MonitoringAppRemote: LazyExoticComponent<ComponentType<any>monitoring> | undefined = 
  ENABLE_K11_MONITORING && USE_REMOTE_MONITORING
    ? lazy(() =>
        // @ts-ignore - Remote module resolved at runtime by Module Federation
        import(/* webpackPrefetch: true */ "k11Monitoring/MonitoringApp")
          .then((mod: any) => ({
            default: mod.MonitoringApp ?? mod.default
          }))
          .catch((error) => {
            // Re-throw with more context for error boundary
            throw new Error(
              `Failed to load remote module k11Monitoring from ${process.env.REMOTE_MONITORING_URL}. ` +
              `Make sure the remote dev server is running. Original error: ${error.message}`
            );
          })
      )
    : undefined;

// Local imports: Used ONLY in development when remote URLs are NOT set
// In production, these modules MUST come from backend API - no local fallback
const InboxAppLocal: LazyExoticComponent<ComponentType<any>> | undefined = 
  ENABLE_K11_INBOX && !USE_REMOTE_INBOX && !IS_PRODUCTION
  ? lazy(() =>
      import(/* webpackPrefetch: true */ "k11-inbox").then((mod: any) => ({
        default: mod.InboxApp ?? mod.default
      }))
    )
  : undefined;

const MonitoringAppLocal: LazyExoticComponent<ComponentType<any>> | undefined = 
  ENABLE_K11_MONITORING && !USE_REMOTE_MONITORING && !IS_PRODUCTION
  ? lazy(() =>
      import(/* webpackPrefetch: true */ "k11-monitoring").then((mod: any) => ({
        default: mod.MonitoringApp ?? mod.default
      }))
    )
  : undefined;

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
  const { isAuthenticated, user } = useAuth();
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
            <Layout
              showInbox={ENABLE_K11_INBOX}
              showMonitoring={ENABLE_K11_MONITORING}
              plugins={plugins}
            >
              <Routes>
                <Route
                  path="/"
                  element={
                    <ProtectedRoute isAuthenticated={isAuthenticated}>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                {/* 
                  Inbox and Monitoring routes:
                  
                  Architecture Note: Inbox and monitoring are runtime remote modules (like external plugins).
                  Their code lives in this repo for development, but in production they run in separate
                  Docker containers and are loaded dynamically via backend API (/api/plugins).
                  
                  Priority order:
                  1. Runtime remotes from PluginRegistry (plugins array) - Production & Docker/CDN
                     - Backend API returns all modules (inbox, monitoring, external) with URLs
                     - All modules loaded the same way via DynamicRoute
                  2. Build-time remotes (when REMOTE_*_URL env vars set) - Dev testing only
                     - For testing Module Federation in development (Option 2 workflow)
                     - NO fallback to local - shows error if remote fails
                  3. Local bundling (when REMOTE_*_URL NOT set) - Dev convenience only
                     - Quick development without separate servers
                */}
                {/* Inbox Route */}
                {ENABLE_K11_INBOX && !plugins.some(p => p.id === "k11-inbox") && (
                  <Route
                    path="/inbox"
                    element={
                      <ProtectedRoute isAuthenticated={isAuthenticated}>
                        {USE_REMOTE_INBOX && InboxAppRemote ? (
                          // Build-time remote: No fallback, show error if fails
                          <RemoteErrorBoundary
                            moduleName="k11-inbox"
                            remoteUrl={process.env.REMOTE_INBOX_URL}
                          >
                            <Suspense
                              fallback={
                                <Card>
                                  <Stack gap="16px">
                                    <Heading level={2}>Loading inbox…</Heading>
                                    <Text variant="muted">
                                      Loading from remote: {process.env.REMOTE_INBOX_URL}
                                    </Text>
                                  </Stack>
                                </Card>
                              }
                            >
                              <InboxAppRemote userEmail={user?.email} />
                            </Suspense>
                          </RemoteErrorBoundary>
                        ) : InboxAppLocal ? (
                          // Local bundling: Only in development when remote URL is NOT set
                        <Suspense
                          fallback={
                            <Card>
                              <Stack gap="16px">
                                <Heading level={2}>Loading inbox…</Heading>
                                <Text variant="muted">
                                  Preparing the notification inbox.
                                </Text>
                              </Stack>
                            </Card>
                          }
                        >
                            <InboxAppLocal userEmail={user?.email} />
                        </Suspense>
                        ) : IS_PRODUCTION ? (
                          // Production: No local fallback - module must come from backend API
                          <Card>
                            <Stack gap="16px">
                              <Heading level={2}>Module Not Available</Heading>
                              <Text variant="muted">
                                k11-inbox module is not available. It should be loaded from the backend API.
                              </Text>
                              {pluginsError && (
                                <Text variant="muted">
                                  API Error: {pluginsError}
                                </Text>
                              )}
                            </Stack>
                          </Card>
                        ) : null}
                      </ProtectedRoute>
                    }
                  />
                )}
                {/* Monitoring Route */}
                {ENABLE_K11_MONITORING && !plugins.some(p => p.id === "k11-monitoring") && (
                  <Route
                    path="/monitoring"
                    element={
                      <ProtectedRoute isAuthenticated={isAuthenticated}>
                        {USE_REMOTE_MONITORING && MonitoringAppRemote ? (
                          // Build-time remote: No fallback, show error if fails
                          <RemoteErrorBoundary
                            moduleName="k11-monitoring"
                            remoteUrl={process.env.REMOTE_MONITORING_URL}
                          >
                            <Suspense
                              fallback={
                                <Card>
                                  <Stack gap="16px">
                                    <Heading level={2}>Loading monitoring…</Heading>
                                    <Text variant="muted">
                                      Loading from remote: {process.env.REMOTE_MONITORING_URL}
                                    </Text>
                                  </Stack>
                                </Card>
                              }
                            >
                              <MonitoringAppRemote userEmail={user?.email} />
                            </Suspense>
                          </RemoteErrorBoundary>
                        ) : MonitoringAppLocal ? (
                          // Local bundling: Only in development when remote URL is NOT set
                        <Suspense
                          fallback={
                            <Card>
                              <Stack gap="16px">
                                <Heading level={2}>Loading monitoring…</Heading>
                                <Text variant="muted">
                                  Preparing the monitoring dashboard.
                                </Text>
                              </Stack>
                            </Card>
                          }
                        >
                            <MonitoringAppLocal userEmail={user?.email} />
                        </Suspense>
                        ) : IS_PRODUCTION ? (
                          // Production: No local fallback - module must come from backend API
                          <Card>
                            <Stack gap="16px">
                              <Heading level={2}>Module Not Available</Heading>
                              <Text variant="muted">
                                k11-monitoring module is not available. It should be loaded from the backend API.
                              </Text>
                              {pluginsError && (
                                <Text variant="muted">
                                  API Error: {pluginsError}
                                </Text>
                              )}
                            </Stack>
                          </Card>
                        ) : null}
                      </ProtectedRoute>
                    }
                  />
                )}
                {/* 
                  Runtime remote modules from backend API (/api/plugins)
                  This includes:
                  - External modules (code not in this repo)
                  - k11-inbox (when not using REMOTE_INBOX_URL env var)
                  - k11-monitoring (when not using REMOTE_MONITORING_URL env var)
                  
                  In production, ALL modules (inbox, monitoring, external) come from here.
                  The REMOTE_*_URL env vars are ONLY for development testing.
                */}
                {plugins.map((plugin) => (
                  <Route
                    key={plugin.id}
                    path={plugin.route}
                    element={
                      <ProtectedRoute isAuthenticated={isAuthenticated}>
                        <DynamicRoute plugin={plugin} />
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
                          <Text variant="muted">Fetching available modules.</Text>
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

