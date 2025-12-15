import type { Plugin } from "plugin-registry";
import type { LoadedHtmlPlugin } from "../types";

export class HtmlLoader {
  async load(plugin: Plugin): Promise<LoadedHtmlPlugin> {
    const response = await fetch(plugin.entryUrl);

    if (!response.ok) {
      throw new Error(`Failed to load HTML plugin ${plugin.name}`);
    }

    const html = await response.text();
    return { kind: "html", html };
  }
}


