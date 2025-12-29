import { Suspense, useEffect, useState, useRef, useMemo } from "react";
import { Card, Stack, Heading, Text } from "@design-system";
import type { Plugin } from "plugin-registry";
import { PluginLoader } from "plugin-loader";
import type { LoadedPlugin } from "plugin-loader";
import { useAuth } from "../context/AuthContext";
import { useAppContext, type ShellData } from "../context/AppContext";
import styles from "./DynamicRoute.module.css";

type DynamicRouteProps = {
  plugin: Plugin;
  userEmail?: string;
};

export const DynamicRoute = ({ plugin, userEmail }: DynamicRouteProps) => {
  const [loaded, setLoaded] = useState<LoadedPlugin | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { user } = useAuth();
  const { authToken, csrfToken, shellData } = useAppContext();

  // Prepare shell data to pass to feature modules
  const shellDataForModules: ShellData = useMemo(
    () => ({
      authToken,
      csrfToken,
      userEmail: user?.email || userEmail || null,
      hostUrl: shellData.hostUrl,
    }),
    [authToken, csrfToken, user?.email, userEmail, shellData.hostUrl]
  );

  useEffect(() => {
    const loader = new PluginLoader();
    setLoading(true);
    setError(null);

    loader
      .load(plugin)
      .then((result) => {
        setLoaded(result.loaded);
        setLoading(false);
      })
      .catch((err) => {
        console.error(`[DynamicRoute] Failed to load plugin ${plugin.id}:`, err);
        setError(err.message);
        setLoading(false);
      });
  }, [plugin]);

  // Send data to iframe when it loads (for client/external apps)
  // IMPORTANT: All hooks must be called before any conditional returns
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || loaded?.kind !== "angular") return;

    const sendDataToIframe = () => {
      try {
        if (loaded.kind !== "angular") return;
        const iframeOrigin = new URL(loaded.iframeSrc).origin;
        iframe.contentWindow?.postMessage(
          {
            type: "SHELL_INIT",
            payload: {
              token: authToken,
              csrfToken: csrfToken,
              userEmail: shellDataForModules.userEmail,
              user: user,
              hostUrl: shellDataForModules.hostUrl,
              timestamp: Date.now(),
            },
          },
          iframeOrigin
        );
      } catch (err) {
        console.warn(`[DynamicRoute] Failed to send data to iframe:`, err);
      }
    };

    // Send data when iframe loads
    iframe.addEventListener("load", sendDataToIframe);
    
    // Also send after a short delay (in case iframe loads before listener is ready)
    const timeout = setTimeout(sendDataToIframe, 1000);

    return () => {
      iframe.removeEventListener("load", sendDataToIframe);
      clearTimeout(timeout);
    };
  }, [loaded, authToken, csrfToken, user, userEmail, shellDataForModules]);

  // Listen for messages FROM iframe (two-way communication)
  useEffect(() => {
    if (loaded?.kind !== "angular") return;

    const handleMessage = (event: MessageEvent) => {
      try {
        if (loaded.kind !== "angular") return;
        const allowedOrigin = new URL(loaded.iframeSrc).origin;
        
        // Security: Validate origin
        if (event.origin !== allowedOrigin) {
          console.warn(`[DynamicRoute] Invalid origin: ${event.origin}, expected: ${allowedOrigin}`);
          return;
        }

        switch (event.data?.type) {
          case "IFRAME_READY":
            // Iframe is ready, resend data
            iframeRef.current?.contentWindow?.postMessage(
              {
                type: "SHELL_INIT",
                payload: {
                  token: authToken,
                  csrfToken: csrfToken,
                  userEmail: shellDataForModules.userEmail,
                  user: user,
                  hostUrl: shellDataForModules.hostUrl,
                },
              },
              allowedOrigin
            );
            break;
          case "TOKEN_REFRESH_REQUEST":
            // Iframe requests token refresh
            // You can implement token refresh logic here
            console.log("[DynamicRoute] Token refresh requested by iframe");
            // Example: Refresh token and send new one
            // const newToken = await refreshToken();
            // iframeRef.current?.contentWindow?.postMessage(
            //   { type: "TOKEN_UPDATE", payload: { token: newToken } },
            //   allowedOrigin
            // );
            break;
          case "IFRAME_NAVIGATE":
            // Iframe wants to navigate (optional)
            console.log("[DynamicRoute] Navigation requested:", event.data.payload);
            break;
          case "IFRAME_ERROR":
            // Iframe reports an error
            console.error("[DynamicRoute] Iframe error:", event.data.payload);
            break;
        }
      } catch (err) {
        console.warn(`[DynamicRoute] Error handling iframe message:`, err);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [loaded, authToken, csrfToken, user, userEmail, shellDataForModules]);

  // Conditional returns AFTER all hooks
  if (loading) {
    return (
      <Card>
        <Stack gap="16px">
          <Heading level={2}>Loading {plugin.metadata.title}…</Heading>
          <Text variant="muted">Preparing the component.</Text>
        </Stack>
      </Card>
    );
  }

  if (error || !loaded) {
    return (
      <Card>
        <Stack gap="16px">
          <Heading level={2}>Error Loading {plugin.metadata.title}</Heading>
          <Text variant="muted">{error ?? "Component not available."}</Text>
          {plugin.entryUrl && (
            <Text variant="muted">
              Entry URL: {plugin.entryUrl}
            </Text>
          )}
        </Stack>
      </Card>
    );
  }

  switch (loaded.kind) {
    case "html":
      return <div dangerouslySetInnerHTML={{ __html: loaded.html }} />;
    case "angular":
      return (
        <iframe
          ref={iframeRef}
          src={loaded.iframeSrc}
          className={styles.iframe}
          title={plugin.metadata.title}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        />
      );
    case "react": {
      // Lazy load the React component
      const Component = loaded.component;
      return (
        <Suspense
          fallback={
            <Card>
              <Stack gap="16px">
                <Heading level={2}>Loading {plugin.metadata.title}…</Heading>
                <Text variant="muted">Initializing component.</Text>
              </Stack>
            </Card>
          }
        >
          <Component shellData={shellDataForModules} />
        </Suspense>
      );
    }
    default:
      return null;
  }
};
