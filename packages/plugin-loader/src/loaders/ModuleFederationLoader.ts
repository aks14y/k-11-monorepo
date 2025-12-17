/**
 * Module Federation Runtime Loader
 *
 * Loads Module Federation remotes dynamically at runtime using webpack's container API.
 * This works with webpack's ModuleFederationPlugin sharing scope to ensure React is shared correctly.
 *
 * Uses webpack's built-in container API (not enhanced runtime) to:
 * - Load remoteEntry.js scripts dynamically
 * - Initialize containers with webpack's sharing scope
 * - Load exposed modules from remote containers
 *
 * This ensures compatibility with webpack's ModuleFederationPlugin and proper React sharing.
 */

// Type declarations for webpack Module Federation runtime
declare const __webpack_require__: any;
declare const __webpack_init_sharing__: (scope: string) => Promise<void>;
declare const __webpack_share_scopes__: { default: any };

interface RemoteConfig {
  name: string; // e.g., "k11Inbox"
  url: string;  // e.g., "https://customer-a.example.com/inbox/remoteEntry.js"
  scope?: string; // Optional: module scope, defaults to name
}

export class ModuleFederationLoader {
  private loadedContainers = new Map<string, Promise<any>>();
  private sharingInitialized = false;

  /**
   * Initialize webpack's sharing scope.
   * This must be called before loading any remotes to ensure React is shared correctly.
   */
  private async initializeSharing(): Promise<void> {
    if (this.sharingInitialized) {
      return;
    }

    if (typeof __webpack_init_sharing__ === "function") {
      await __webpack_init_sharing__("default");
    }
    this.sharingInitialized = true;
  }

  /**
   * Load a remote container dynamically at runtime.
   * Uses webpack's container API to ensure proper React sharing.
   */
  private async loadRemoteContainer(scope: string, url: string): Promise<any> {
    await this.initializeSharing();

    // Check if container is already loaded
    const globalScope = window as any;
    const containerKey = scope;

    if (globalScope[containerKey]) {
      const container = globalScope[containerKey];
      // Initialize with sharing scope
      if (container.init && __webpack_share_scopes__?.default) {
        await container.init(__webpack_share_scopes__.default);
      }
      return container;
    }

    // Load the remoteEntry.js script
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = url;
      script.type = "text/javascript";
      script.async = true;
      script.crossOrigin = "anonymous";

      const timeout = setTimeout(() => {
        script.remove();
        reject(new Error(`Timeout loading remote script: ${url}`));
      }, 30000);

      script.onload = async () => {
        clearTimeout(timeout);
        
        // Wait a bit for the container to be registered
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Try multiple possible container locations
        let container = globalScope[containerKey] || 
                        globalScope[`${containerKey}_container`] ||
                        globalScope[scope];
        
        // If still not found, log available globals for debugging
        if (!container) {
          const availableGlobals = Object.keys(globalScope)
            .filter(k => k.toLowerCase().includes(scope.toLowerCase()) || k.includes("Inbox") || k.includes("Monitoring"))
            .slice(0, 10)
            .join(", ");
          
          // eslint-disable-next-line no-console
          console.warn(`[ModuleFederationLoader] Container ${scope} not found. Available globals:`, availableGlobals);
          
          reject(
            new Error(
              `Remote container ${scope} not found after loading ${url}. ` +
              `Searched for: ${containerKey}, ${containerKey}_container, ${scope}. ` +
              `Available globals: ${availableGlobals}`
            )
          );
          return;
        }

        // Initialize container with webpack's sharing scope
        try {
          if (typeof container.init === "function" && __webpack_share_scopes__?.default) {
            const initResult = container.init(__webpack_share_scopes__.default);
            // Handle both Promise and non-Promise returns
            if (initResult && typeof initResult === "object" && typeof initResult.then === "function") {
              await initResult;
            }
            // If initResult is undefined or not a Promise, that's fine - init() might be synchronous
          }
          resolve(container);
        } catch (err: any) {
          reject(new Error(`Failed to initialize container ${scope}: ${err?.message || String(err)}`));
        }
      };

      script.onerror = () => {
        clearTimeout(timeout);
        script.remove();
        reject(new Error(`Failed to load remote script: ${url}`));
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Load a specific module from a remote container
   * 
   * @param config Remote configuration
   * @param modulePath Path to the module (e.g., "./InboxApp")
   * @returns Promise that resolves to the module
   */
  async loadModule(config: RemoteConfig, modulePath: string): Promise<any> {
    const { name, url, scope } = config;
    const remoteScope = scope || name;
    const remoteKey = `${remoteScope}@${url}`;

    // Return cached promise if already loading/loaded
    if (this.loadedContainers.has(remoteKey)) {
      const container = await this.loadedContainers.get(remoteKey)!;
      const factory = await container.get(modulePath);
      return factory();
    }

    // Load the container
    const loadPromise = this.loadRemoteContainer(remoteScope, url);
    this.loadedContainers.set(remoteKey, loadPromise);

    try {
      const container = await loadPromise;
      
      // Get the module factory from the container
      const factory = await container.get(modulePath);
      
      if (!factory) {
        throw new Error(
          `Module ${modulePath} not found in remote ${name}`
        );
      }

      // Execute the factory to get the module
      const Module = factory();
      
      // Debug: log what we got
      if (typeof window !== "undefined") {
        // eslint-disable-next-line no-console
        console.log(`[ModuleFederationLoader] Loaded module from ${remoteScope}/${modulePath}:`, {
          type: typeof Module,
          isFunction: typeof Module === "function",
          isObject: typeof Module === "object",
          keys: typeof Module === "object" && Module !== null ? Object.keys(Module) : null,
        });
      }

      return Module;
    } catch (error: any) {
      // Remove from cache on error so it can be retried
      this.loadedContainers.delete(remoteKey);
      throw new Error(
        `Failed to load remote module ${modulePath} from ${name} at ${url}: ${
          error?.message || String(error)
        }`
      );
    }
  }
}

