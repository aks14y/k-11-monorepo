import type { Plugin } from "./types";

type FetchPluginsOptions = {
  endpoint?: string;
};

// Mock plugins data - loaded when USE_MOCK_PLUGINS is true
// For local development: Update entryUrl here when feature module is running on a separate port
// Example: Start k11-inbox on port 3001, then set entryUrl: "http://localhost:3001/remoteEntry.js"
const MOCK_PLUGINS: Plugin[] = [
  {
    id: "k11-inbox",
    name: "Inbox",
    route: "/inbox",
    framework: "react",
    entryUrl: "http://localhost:3001/remoteEntry.js", // Update this when k11-inbox dev server is running
    remoteName: "k11Inbox",
    modulePath: "./InboxApp",
    enabled: true,
    metadata: {
      title: "Notification Inbox",
      icon: "inbox",
      description: "View and manage notifications.",
    },
  },
  {
    id: "k11-monitoring",
    name: "Monitoring",
    route: "/monitoring",
    framework: "react",
    entryUrl: "http://localhost:3002/remoteEntry.js", // Update this when k11-monitoring dev server is running
    remoteName: "k11Monitoring",
    modulePath: "./MonitoringApp",
    enabled: true,
    metadata: {
      title: "System Monitoring",
      icon: "monitor",
      description: "Live monitoring dashboards.",
    },
  },
  {
    id: "legacy-erp",
    name: "Legacy ERP",
    route: "/legacy-erp",
    framework: "html",
    entryUrl: "https://legacy.example.com/app/",
    enabled: true,
    metadata: {
      title: "Legacy ERP",
      icon: "building",
      description: "Embedded legacy ERP via iframe.",
    },
  },
];

export class PluginRegistry {
  async fetchPlugins(options: FetchPluginsOptions = {}): Promise<Plugin[]> {
    // Check if we should use mock plugins (for local development/testing)
    // Set USE_MOCK_PLUGINS=true in .env to use mock data instead of API
    // Note: dotenv-webpack exposes process.env vars to client bundle at build time
    const useMockPlugins = process.env.USE_MOCK_PLUGINS === "true";

    if (useMockPlugins) {
      // eslint-disable-next-line no-console
      console.log("[PluginRegistry] Using mock plugins (USE_MOCK_PLUGINS=true)");
      const enabledPlugins = MOCK_PLUGINS.filter((plugin) => plugin.enabled);
      // eslint-disable-next-line no-console
      console.log(`[PluginRegistry] Loaded ${enabledPlugins.length} mock plugin(s):`, enabledPlugins.map(p => p.id));
      return enabledPlugins;
    }

    // Otherwise, fetch from API endpoint
    const endpoint = options.endpoint ?? "/api/plugins";

    try {
      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error(`Failed to fetch plugins: ${response.status} ${response.statusText}`);
      }

      // Check if response is actually JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error(
          `Expected JSON but got ${contentType || "unknown"}. Response: ${text.substring(0, 200)}`
        );
      }

      const data = (await response.json()) as Plugin[];
      const enabledPlugins = data.filter((plugin) => plugin.enabled);
      
      // eslint-disable-next-line no-console
      console.log(`[PluginRegistry] Loaded ${enabledPlugins.length} plugin(s) from ${endpoint}:`, enabledPlugins.map(p => p.id));
      
      return enabledPlugins;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[PluginRegistry] Error fetching plugins:", error);
      throw error;
    }
  }
}


