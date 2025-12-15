export type PluginFramework = "react" | "angular" | "vue" | "html";

export type PluginMetadata = {
  title: string;
  icon?: string;
  description?: string;
};

export type Plugin = {
  id: string;
  name: string;
  route: string;
  framework: PluginFramework;
  entryUrl: string; // For Module Federation: URL to remoteEntry.js (e.g., "https://customer-a.example.com/inbox/remoteEntry.js")
  modulePath?: string; // For Module Federation: path to module (e.g., "./InboxApp")
  remoteName?: string; // For Module Federation: remote name (e.g., "k11Inbox")
  manifestUrl?: string;
  version?: string;
  enabled: boolean;
  metadata: PluginMetadata;
};


