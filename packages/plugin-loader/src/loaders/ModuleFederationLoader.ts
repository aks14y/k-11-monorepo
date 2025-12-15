/**
 * Module Federation Runtime Loader
 * 
 * Loads Module Federation remotes dynamically at runtime.
 * This allows remotes to be configured from backend API (like setup.xml in Angular)
 * instead of being hardcoded at build time.
 * 
 * Uses webpack's Container API for runtime remote loading.
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
  private initialized = false;

  /**
   * Initialize Module Federation sharing scope
   */
  private async initializeSharing(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (typeof __webpack_init_sharing__ === "function") {
      await __webpack_init_sharing__("default");
    }
    this.initialized = true;
  }

  /**
   * Load a Module Federation remote container dynamically at runtime
   * 
   * @param config Remote configuration
   * @returns Promise that resolves to the remote container
   */
  async loadRemote(config: RemoteConfig): Promise<any> {
    const { name, url, scope } = config;
    const remoteScope = scope || name;
    const remoteKey = `${remoteScope}@${url}`;

    // Return cached promise if already loading/loaded
    if (this.loadedContainers.has(remoteKey)) {
      return this.loadedContainers.get(remoteKey)!;
    }

    // Create promise to load remote
    const loadPromise = this.loadRemoteContainer(remoteScope, url);
    this.loadedContainers.set(remoteKey, loadPromise);

    try {
      return await loadPromise;
    } catch (error) {
      // Remove from cache on error so it can be retried
      this.loadedContainers.delete(remoteKey);
      throw error;
    }
  }

  /**
   * Load a specific module from a remote container
   * 
   * @param config Remote configuration
   * @param modulePath Path to the module (e.g., "./InboxApp")
   * @returns Promise that resolves to the module
   */
  async loadModule(config: RemoteConfig, modulePath: string): Promise<any> {
    const container = await this.loadRemote(config);
    
    // Get the module factory from the container
    const factory = await container.get(modulePath);
    
    if (!factory) {
      throw new Error(
        `Module ${modulePath} not found in remote ${config.name}`
      );
    }

    // Execute the factory to get the module
    const Module = factory();
    return Module;
  }

  /**
   * Initialize and load a remote container
   */
  private async loadRemoteContainer(
    scope: string,
    url: string
  ): Promise<any> {
    // Initialize sharing scope
    await this.initializeSharing();

    // Load the remote script dynamically
    const containerUrl = url;
    const containerName = scope;

    // Use webpack's container loading mechanism
    // The remoteEntry.js exposes a global function that returns the container
    return new Promise((resolve, reject) => {
      // Check if already loaded in window
      const globalScope = window as any;
      
      // Module Federation creates a global with the pattern: [scope]_[hash]
      // We need to find it or load it
      const containerGlobal = `${containerName}_container`;
      const containerGlobalAlt = containerName;

      // If container is already loaded
      if (globalScope[containerGlobal] || globalScope[containerGlobalAlt]) {
        const container = globalScope[containerGlobal] || globalScope[containerGlobalAlt];
        // Initialize the container with shared modules
        if (container && container.init && __webpack_share_scopes__?.default) {
          container.init(__webpack_share_scopes__.default);
        }
        resolve(container);
        return;
      }

      // Load the remoteEntry.js script
      const script = document.createElement("script");
      script.src = containerUrl;
      script.type = "text/javascript";
      script.async = true;
      script.crossOrigin = "anonymous";

      const timeout = setTimeout(() => {
        script.remove();
        reject(new Error(`Timeout loading remote script: ${containerUrl}`));
      }, 30000); // 30 second timeout

      script.onload = () => {
        clearTimeout(timeout);
        try {
          // Wait a bit for the global to be set
          setTimeout(() => {
            // Get the container from the global scope
            // Module Federation sets it as window[scope] or window[scope + "_container"]
            const container = globalScope[containerGlobal] || 
                             globalScope[containerGlobalAlt] ||
                             globalScope[scope];

            if (!container) {
              reject(
                new Error(
                  `Remote container ${containerName} not found after loading ${containerUrl}. ` +
                  `Available globals: ${Object.keys(globalScope).filter(k => k.includes(containerName)).join(", ")}`
                )
              );
              return;
            }

            // Initialize the container with shared modules
            if (container.init && __webpack_share_scopes__?.default) {
              container.init(__webpack_share_scopes__.default);
            }

            resolve(container);
          }, 100);
        } catch (error) {
          clearTimeout(timeout);
          reject(
            new Error(
              `Failed to initialize remote container ${containerName}: ${error instanceof Error ? error.message : String(error)}`
            )
          );
        }
      };

      script.onerror = () => {
        clearTimeout(timeout);
        script.remove();
        reject(
          new Error(`Failed to load remote script: ${containerUrl}`)
        );
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Check if a remote is already loaded
   */
  isRemoteLoaded(name: string, url: string): boolean {
    const remoteKey = `${name}@${url}`;
    return this.loadedContainers.has(remoteKey);
  }
}

