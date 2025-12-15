import type { Plugin } from "./types";

type FetchPluginsOptions = {
  endpoint?: string;
};

export class PluginRegistry {
  async fetchPlugins(options: FetchPluginsOptions = {}): Promise<Plugin[]> {
    const endpoint = options.endpoint ?? "/api/plugins";
    const response = await fetch(endpoint);

    if (!response.ok) {
      throw new Error(`Failed to fetch plugins (${response.status})`);
    }

    const data = (await response.json()) as Plugin[];
    return data.filter((plugin) => plugin.enabled);
  }
}


