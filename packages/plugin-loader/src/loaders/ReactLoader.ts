import type { Plugin } from "plugin-registry";
import type { LoadedReactPlugin } from "../types";
import { ModuleFederationLoader } from "./ModuleFederationLoader";

export class ReactLoader {
  private mfLoader = new ModuleFederationLoader();

  async load(plugin: Plugin): Promise<LoadedReactPlugin> {
    // Check if this is a Module Federation remote
    if (plugin.remoteName && plugin.entryUrl) {
      return this.loadModuleFederationRemote(plugin);
    }

    // Fallback: Try direct import (for non-MF remotes)
    try {
    const mod = await import(/* webpackIgnore: true */ plugin.entryUrl);
    const component = mod.default ?? mod.App ?? mod.Component;

    if (!component) {
      throw new Error(`React plugin did not export a component: ${plugin.name}`);
    }

    return { kind: "react", component };
    } catch (error) {
      throw new Error(
        `Failed to load React plugin ${plugin.name}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Load a React component from a Module Federation remote
   */
  private async loadModuleFederationRemote(plugin: Plugin): Promise<LoadedReactPlugin> {
    const { remoteName, entryUrl, modulePath } = plugin;

    if (!remoteName || !entryUrl) {
      throw new Error(
        `Module Federation plugin ${plugin.name} requires remoteName and entryUrl`
      );
    }

    // Default module path if not specified
    const module = modulePath || "./App";

    try {
      // Load the module from the remote container
      const Module = await this.mfLoader.loadModule(
        {
          name: remoteName,
          url: entryUrl,
          module: module,
        },
        module
      );

      // Extract the component
      const component =
        Module.default ?? Module.App ?? Module.Component ?? Module;

      if (!component) {
        throw new Error(
          `Module Federation remote ${remoteName} did not export a component at ${module}`
        );
      }

      return { kind: "react", component };
    } catch (error) {
      throw new Error(
        `Failed to load Module Federation remote ${remoteName}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}


