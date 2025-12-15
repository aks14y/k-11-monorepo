import type { Plugin } from "plugin-registry";
import { AngularLoader } from "./loaders/AngularLoader";
import { HtmlLoader } from "./loaders/HtmlLoader";
import { ReactLoader } from "./loaders/ReactLoader";
import type { LoadedPlugin, PluginLoadResult } from "./types";

export class PluginLoader {
  async load(plugin: Plugin): Promise<PluginLoadResult> {
    const loaded = await this.loadByFramework(plugin);
    return { plugin, loaded };
  }

  private async loadByFramework(plugin: Plugin): Promise<LoadedPlugin> {
    switch (plugin.framework) {
      case "react":
      case "vue": {
        // Vue can expose a default component similarly if built appropriately
        const reactLoader = new ReactLoader();
        return reactLoader.load(plugin);
      }
      case "angular": {
        const angularLoader = new AngularLoader();
        return angularLoader.load(plugin);
      }
      case "html": {
        const htmlLoader = new HtmlLoader();
        return htmlLoader.load(plugin);
      }
      default:
        throw new Error(`Unsupported framework: ${plugin.framework}`);
    }
  }
}


