import type { Plugin } from "plugin-registry";
import type { LoadedReactPlugin } from "../types";
import { ModuleFederationLoader } from "./ModuleFederationLoader";

export class ReactLoader {
  private mfLoader = new ModuleFederationLoader();

  async load(plugin: Plugin): Promise<LoadedReactPlugin> {
    if (plugin.remoteName && plugin.entryUrl) {
      return this.loadModuleFederationRemote(plugin);
    }

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
        },
        module
      );

      if (typeof window !== "undefined") {
        // eslint-disable-next-line no-console
        console.log(`[ReactLoader] Module from ${remoteName}:`, {
          type: typeof Module,
          isFunction: typeof Module === "function",
          isObject: typeof Module === "object",
          keys: typeof Module === "object" && Module !== null ? Object.keys(Module) : null,
          hasDefault: Module && typeof Module === "object" && "default" in Module,
        });
      }

      let component: any = null;

      if (typeof Module === "function") {
        component = Module;
      } else if (Module && typeof Module === "object") {
        const moduleName = module.replace(/^.\//, "");
        component = 
          Module.default ?? 
          Module[moduleName] ??  // Try exact match (e.g., Module["InboxApp"])
          Module.App ?? 
          Module.Component ?? 
          Module.InboxApp ?? 
          Module.MonitoringApp;
      }

      if (!component) {
        const availableKeys = Module && typeof Module === "object" ? Object.keys(Module).join(", ") : "N/A";
        throw new Error(
          `Module Federation remote ${remoteName} did not export a valid React component at ${module}. ` +
          `Got: ${typeof Module}, available keys: ${availableKeys}`
        );
      }

      if (typeof component !== "function") {
        if (component && typeof component === "object" && component.$$typeof) {
          throw new Error(
            `Module Federation remote ${remoteName} exported a React element instead of a component. ` +
            `You need to export the component function/class, not render it.`
          );
        }
        throw new Error(
          `Module Federation remote ${remoteName} exported invalid component type: ${typeof component}. ` +
          `Expected function (component), got: ${typeof component}. ` +
          `Available keys: ${Module && typeof Module === "object" ? Object.keys(Module).join(", ") : "N/A"}`
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

