/**
 * Webpack Configuration for Shell App
 * 
 * Architecture:
 * - All remotes are loaded dynamically at runtime via ModuleFederationLoader
 * - Remotes come from separate Docker containers (production) or local dev servers (development)
 * - For local development: Update MOCK_PLUGINS in PluginRegistry.ts with entryUrl when feature module is running
 * 
 * USAGE:
 * - Development: pnpm dev:shell (uses src/ for fast HMR)
 * - Production: pnpm build --filter shell (uses dist/ outputs)
 */

const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const Dotenv = require("dotenv-webpack");
const { ModuleFederationPlugin } = require("webpack").container;
const webpack = require("webpack");
const shellPkg = require("./package.json");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
const dotenv = require("dotenv");
const fs = require("fs");

const shellNodeModules = path.resolve(__dirname, "node_modules");

module.exports = (_, argv) => {
  const isProd = argv.mode === "production" || argv.env?.production === true;
  const shouldAnalyze = argv.env?.analyze === true;
  const port = Number(process.env.PORT) || 3000;
  
  const envPath = isProd 
    ? path.resolve(__dirname, ".env.production")
    : path.resolve(__dirname, ".env");
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
  }

  const shouldUseDist = isProd;
  
  console.log("[Webpack Config] Mode:", argv.mode || "undefined", "| env.production:", argv.env?.production, "| isProd:", isProd);
  console.log("[Webpack Config] Using:", shouldUseDist ? "dist/" : "src/");
  const getPackagePath = (packageName, useDist = shouldUseDist) => {
    const srcPath = path.resolve(__dirname, `../../packages/${packageName}/src`);
    
    if (useDist) {
      const nestedPath = path.resolve(__dirname, `../../packages/${packageName}/dist/${packageName}/src`);
      const flatPath = path.resolve(__dirname, `../../packages/${packageName}/dist`);
      
      if (fs.existsSync(path.join(nestedPath, 'index.js'))) {
        return nestedPath;
      }
      
      if (fs.existsSync(path.join(flatPath, 'index.js'))) {
        return flatPath;
      }
      
      if (!fs.existsSync(flatPath)) {
        return srcPath;
      }
      
      return flatPath;
    }
    return srcPath;
  };

  const aliases = {
    react: path.resolve(shellNodeModules, "react"),
    "react-dom": path.resolve(shellNodeModules, "react-dom"),
    "react/jsx-runtime": path.resolve(shellNodeModules, "react/jsx-runtime.js"),
    "react/jsx-dev-runtime": path.resolve(shellNodeModules, "react/jsx-dev-runtime.js"),
    "@design-system": getPackagePath("design-system"),
    "@types": getPackagePath("types"),
    "api-client": getPackagePath("api-client"),
    "plugin-registry": getPackagePath("plugin-registry"),
    "plugin-loader": getPackagePath("plugin-loader"),
  };

  return {
    entry: path.resolve(__dirname, "src/bootstrap.tsx"),
    output: {
      filename: "[name].[contenthash].js",
      path: path.resolve(__dirname, "dist"),
      publicPath: "auto",
      clean: true
    },
    mode: isProd ? "production" : "development",
    devtool: isProd ? "source-map" : "eval-source-map",
    devServer: {
      port,
      historyApiFallback: {
        disableDotRule: false,
        htmlAcceptHeaders: ['text/html', 'application/xhtml+xml'],
      },
      hot: true,
    },
    resolve: {
      extensions: [".tsx", ".ts", ".jsx", ".js", ".mjs"],
      modules: [shellNodeModules, "node_modules"],
      alias: aliases,
      symlinks: false,
      conditionNames: ["import", "require", "default"]
    },
    externals: {},
    module: {
      rules: [
        {
          test: /\.(ts|tsx|js|jsx)$/,
          exclude: (modulePath) => {
            if (modulePath.includes("node_modules")) {
              const allowedPackages = [
                "@design-system",
                "@types",
                "api-client",
                "plugin-registry",
                "plugin-loader"
              ];
              
              return !allowedPackages.some(pkg => modulePath.includes(pkg));
            }
            return false;
          },
          use: {
            loader: "babel-loader",
            options: {
              presets: [
                "@babel/preset-env",
                ["@babel/preset-react", { runtime: "automatic" }],
                "@babel/preset-typescript"
              ]
            }
          }
        },
        {
          test: /\.module\.css$/,
          use: [
            "style-loader",
            {
              loader: "css-loader",
              options: {
                modules: {
                  localIdentName: "[local]--[hash:base64:5]",
                },
              },
            },
          ],
        },
        {
          test: /\.css$/,
          exclude: /\.module\.css$/,
          use: [
            "style-loader",
            "css-loader",
          ],
        }
      ]
    },
    optimization: {
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            reuseExistingChunk: true,
          },
          mantine: {
            test: /[\\/]node_modules[\\/]@mantine[\\/]/,
            name: 'vendors',
            priority: 15,
            reuseExistingChunk: true,
          },
          common: {
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      },
    },
    plugins: [
      new ModuleFederationPlugin({
        name: "shell",
        remotes: {},
        shared: {
          react: { 
            singleton: true, 
            requiredVersion: shellPkg.dependencies.react,
            eager: true
          },
          "react-dom": { 
            singleton: true, 
            requiredVersion: shellPkg.dependencies["react-dom"],
            eager: true
          },
          "@design-system": {
            singleton: true,
            eager: true
          },
          "api-client": {
            singleton: true,
            eager: true
          },
          "@tanstack/react-query": {
            singleton: true,
            eager: true
          },
          "@tanstack/query-core": {
            singleton: true,
            eager: true
          },
          "@mantine/core": { singleton: true, eager: true },
          "@mantine/hooks": { singleton: true, eager: true },
          "@floating-ui/core": { singleton: true, eager: true },
          "@floating-ui/react": { singleton: true, eager: true },
          "@floating-ui/react-dom": { singleton: true, eager: true },
          "@floating-ui/utils": { singleton: true, eager: true },
          "@floating-ui/dom": { singleton: true, eager: true },
          "react-number-format": { singleton: true, eager: true },
          "react-textarea-autosize": { singleton: true, eager: true },
          "@babel/runtime": { singleton: true, eager: true },
          "use-latest": { singleton: true, eager: true },
          "use-composed-ref": { singleton: true, eager: true },
          "use-isomorphic-layout-effect": { singleton: true, eager: true },
          "tabbable": { singleton: true, eager: true },
          "scheduler": { singleton: true, eager: true },
          "react-remove-scroll": { singleton: true, eager: true },
          "react-remove-scroll-bar": { singleton: true, eager: true },
          "react-style-singleton": { singleton: true, eager: true },
          "get-nonce": { singleton: true, eager: true },
          "detect-node-es": { singleton: true, eager: true },
          "use-callback-ref": { singleton: true, eager: true },
          "use-sidecar": { singleton: true, eager: true },
        },
      }),
      new Dotenv({
        path: isProd ? "./.env.production" : "./.env",
        safe: false,
        systemvars: true,
        defaults: false,
        allowEmptyValues: true,
      }),
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, "public/index.html")
      }),
      ...(shouldAnalyze
        ? [
            new BundleAnalyzerPlugin({
              analyzerMode: "static",
              openAnalyzer: true,
              reportFilename: "bundle-report.html",
            }),
          ]
        : [])
    ]
  };
};

