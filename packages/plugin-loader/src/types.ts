import React from "react";
import type { Plugin } from "plugin-registry";

export type LoadedReactPlugin = {
  kind: "react";
  component: React.ComponentType<any>;
};

export type LoadedHtmlPlugin = {
  kind: "html";
  html: string;
};

export type LoadedAngularPlugin = {
  kind: "angular";
  iframeSrc: string;
};

export type LoadedPlugin = LoadedReactPlugin | LoadedHtmlPlugin | LoadedAngularPlugin;

export type PluginLoaderOptions = {
  htmlContainerId?: string;
};

export type PluginLoadResult = {
  plugin: Plugin;
  loaded: LoadedPlugin;
};

