import type { Plugin } from "plugin-registry";
import type { LoadedAngularPlugin } from "../types";

export class AngularLoader {
  async load(plugin: Plugin): Promise<LoadedAngularPlugin> {
    // For isolation and simplicity, load Angular apps in an iframe
    return { kind: "angular", iframeSrc: plugin.entryUrl };
  }
}


