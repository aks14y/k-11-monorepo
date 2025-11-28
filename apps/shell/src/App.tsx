import {
  type ComponentType,
  type LazyExoticComponent,
  ReactNode,
  Suspense,
  lazy
} from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { LoginPage } from "./components/LoginPage";
import { useAuth } from "./context/AuthContext";
import { Heading, Text, Card, Stack } from "@design-system";

const ENABLE_K11_INBOX = process.env.ENABLE_K11_INBOX !== "false";
const ENABLE_K11_MONITORING = process.env.ENABLE_K11_MONITORING !== "false";

const InboxApp: LazyExoticComponent<ComponentType<any>> | undefined = ENABLE_K11_INBOX
  ? lazy(() =>
      import("@mfes/k11-inbox").then((mod) => ({
        default: mod.InboxApp
      }))
    )
  : undefined;

const MonitoringApp: LazyExoticComponent<ComponentType<any>> | undefined = ENABLE_K11_MONITORING
  ? lazy(() =>
      import("@mfes/k11-monitoring").then((mod) => ({
        default: mod.MonitoringApp
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
  const { isAuthenticated } = useAuth();

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
                {ENABLE_K11_INBOX && InboxApp && (
                  <Route
                    path="/inbox"
                    element={
                      <ProtectedRoute isAuthenticated={isAuthenticated}>
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
                          <InboxApp />
                        </Suspense>
                      </ProtectedRoute>
                    }
                  />
                )}
                {ENABLE_K11_MONITORING && MonitoringApp && (
                  <Route
                    path="/monitoring"
                    element={
                      <ProtectedRoute isAuthenticated={isAuthenticated}>
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
                          <MonitoringApp />
                        </Suspense>
                      </ProtectedRoute>
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

