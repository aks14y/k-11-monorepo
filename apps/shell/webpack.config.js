/**
 * Webpack Configuration for Shell App
 * 
 * USAGE EXAMPLES:
 * 
 * Development (automatically uses src/ for fast HMR):
 *   pnpm dev:shell
 * 
 * Production (automatically uses dist/ outputs, packages built first via turbo):
 *   pnpm build --filter shell
 *   OR: pnpm build (builds all packages then shell)
 * 
 * Module Loading Options:
 *   - Remote Module Federation: Set REMOTE_INBOX_URL and REMOTE_MONITORING_URL in .env
 *   - Local Bundling: Leave REMOTE_*_URL empty (uses src/ in dev, dist/ in prod automatically)
 * 
 * Include only k11-inbox:
 *   ENABLE_K11_INBOX=true ENABLE_K11_MONITORING=false pnpm build --filter shell
 * 
 * Include only k11-monitoring:
 *   ENABLE_K11_INBOX=false ENABLE_K11_MONITORING=true pnpm build --filter shell
 * 
 * Include both feature modules:
 *   ENABLE_K11_INBOX=true ENABLE_K11_MONITORING=true pnpm build --filter shell
 */

const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const Dotenv = require("dotenv-webpack");
const { ModuleFederationPlugin } = require("webpack").container;
const shellPkg = require("./package.json");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
// Load dotenv directly to ensure env vars are available when reading process.env
// (dotenv-webpack only loads vars during webpack compilation, not during config evaluation)
const dotenv = require("dotenv");
const fs = require("fs");

const shellNodeModules = path.resolve(__dirname, "node_modules");

module.exports = (_, argv) => {
  // Check both argv.mode and argv.env.production for production mode
  // argv.mode is set by --mode production
  // argv.env.production is set by --env production
  const isProd = argv.mode === "production" || argv.env?.production === true;
  const shouldAnalyze = argv.env?.analyze === true;
  const port = Number(process.env.PORT) || 3000;
  
  // Load environment-specific .env file if it exists
  // This ensures REMOTE_INBOX_URL and REMOTE_MONITORING_URL are available
  // Load .env for development, .env.production for production
  const envPath = isProd 
    ? path.resolve(__dirname, ".env.production")
    : path.resolve(__dirname, ".env");
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
  }

  // ============================================================================
  // BUILD CONFIGURATION FLAGS
  // ============================================================================
  // Automatically use dist/ in production, src/ in development
  // This is automatic based on build mode - no configuration needed
  // For feature modules (k11-inbox, k11-monitoring):
  //   - If REMOTE_*_URL is set → Uses remote Module Federation (this setting doesn't apply)
  //   - If REMOTE_*_URL is NOT set → Uses local bundling (src/ in dev, dist/ in prod)
  // For other packages (design-system, plugin-registry, etc.):
  //   - Always uses local bundling (src/ in dev, dist/ in prod)
  const shouldUseDist = isProd; // Automatic: false in development, true in production
  
  // Debug logging
  console.log("[Webpack Config] Mode:", argv.mode || "undefined", "| env.production:", argv.env?.production, "| isProd:", isProd);
  console.log("[Webpack Config] Using:", shouldUseDist ? "dist/" : "src/");
  console.log("[Webpack Config] Loading .env from:", envPath, fs.existsSync(envPath) ? "✓" : "✗ (file not found)");

  // Feature module flags: Control which modules are included in the build
  // If false, the module won't be bundled (compile-time exclusion)
  // These can also be loaded dynamically at runtime via ModuleFederationLoader
  const ENABLE_K11_INBOX = process.env.ENABLE_K11_INBOX !== "false"; // Default: true
  const ENABLE_K11_MONITORING = process.env.ENABLE_K11_MONITORING !== "false"; // Default: true
  const REMOTE_INBOX_URL = process.env.REMOTE_INBOX_URL;
  const REMOTE_MONITORING_URL = process.env.REMOTE_MONITORING_URL;

  // ============================================================================
  // ALIAS CONFIGURATION
  // ============================================================================
  // Automatically chooses src/ (development) or dist/ (production) based on build mode
  // 
  // Development: Uses src/ for fast HMR and immediate feedback
  // Production: Uses dist/ for optimized, compiled code
  // 
  // Note: This only affects local workspace packages. Remote Module Federation
  // modules (when REMOTE_*_URL is set) are always loaded from their remote servers.
  const getPackagePath = (packageName, useDist = shouldUseDist) => {
    const srcPath = path.resolve(__dirname, `../../packages/${packageName}/src`);
    
    if (useDist) {
      // TypeScript preserves directory structure, so dist files are at dist/packageName/src/
      // Check if nested structure exists, otherwise fall back to dist/
      const nestedPath = path.resolve(__dirname, `../../packages/${packageName}/dist/${packageName}/src`);
      const flatPath = path.resolve(__dirname, `../../packages/${packageName}/dist`);
      
      // Check if nested index.js exists
      if (fs.existsSync(path.join(nestedPath, 'index.js'))) {
        return nestedPath;
      }
      
      // Check if flat dist/index.js exists
      if (fs.existsSync(path.join(flatPath, 'index.js'))) {
        return flatPath;
      }
      
      // If dist doesn't exist, fall back to src (for packages that haven't been built yet)
      if (!fs.existsSync(flatPath)) {
        return srcPath;
      }
      
      return flatPath;
    }
    return srcPath;
  };

  // Base aliases (always included)
  const aliases = {
    react: path.resolve(shellNodeModules, "react"),
    "react-dom": path.resolve(shellNodeModules, "react-dom"),
    "styled-components": path.resolve(shellNodeModules, "styled-components"),
    "react/jsx-runtime": path.resolve(shellNodeModules, "react/jsx-runtime.js"),
    "react/jsx-dev-runtime": path.resolve(shellNodeModules, "react/jsx-dev-runtime.js"),
    "@design-system": getPackagePath("design-system"),
    "@types": getPackagePath("types"),
    "plugin-registry": getPackagePath("plugin-registry"),
    "plugin-loader": getPackagePath("plugin-loader"),
  };

  // Conditionally add feature module aliases based on feature flags
  // Note: These aliases are only used when REMOTE_*_URL is NOT set (local bundling)
  // When REMOTE_*_URL is set, modules are loaded from remote servers instead
  if (ENABLE_K11_INBOX) {
    aliases["k11-inbox"] = getPackagePath("k11-inbox");
  }

  if (ENABLE_K11_MONITORING) {
    aliases["k11-monitoring"] = getPackagePath("k11-monitoring");
  }

  // ============================================================================
  // WEBPACK CONFIG
  // ============================================================================
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
      historyApiFallback: true,
      hot: true,
      // Serve remoteEntry.js files for development (only if modules are enabled)
      static: [
        ...(ENABLE_K11_INBOX
          ? [
              {
                directory: path.resolve(__dirname, "../../packages/k11-inbox/dist"),
                publicPath: "/inbox",
              },
            ]
          : []),
        ...(ENABLE_K11_MONITORING
          ? [
              {
                directory: path.resolve(__dirname, "../../packages/k11-monitoring/dist"),
                publicPath: "/monitoring",
              },
            ]
          : []),
      ],
    },
    resolve: {
      extensions: [".tsx", ".ts", ".jsx", ".js"],
      modules: [shellNodeModules, "node_modules"],
      alias: aliases,
      symlinks: false
    },
    // Externals: Prevent webpack errors when remote modules are imported but not configured
    // Only needed when modules are enabled but remote URLs are not provided
    externals: {
      ...(ENABLE_K11_INBOX && !REMOTE_INBOX_URL
        ? { "k11Inbox/InboxApp": "commonjs k11Inbox/InboxApp" }
        : {}),
      ...(ENABLE_K11_MONITORING && !REMOTE_MONITORING_URL
        ? { "k11Monitoring/MonitoringApp": "commonjs k11Monitoring/MonitoringApp" }
        : {}),
    },
    module: {
      rules: [
        {
          test: /\.(ts|tsx|js|jsx)$/,
          exclude: (modulePath) => {
            // Exclude node_modules but allow workspace packages
            if (modulePath.includes("node_modules")) {
              const allowedPackages = [
                "@design-system",
                "@types",
                "plugin-registry",
                "plugin-loader"
              ];
              
              // Conditionally allow feature modules based on feature flags
              if (ENABLE_K11_INBOX) allowedPackages.push("k11-inbox");
              if (ENABLE_K11_MONITORING) allowedPackages.push("k11-monitoring");
              
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
          test: /\.css$/,
          use: ["style-loader", "css-loader"]
        }
      ]
    },
    optimization: {
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          // Vendor chunk: React, styled-components, react-router, etc.
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            reuseExistingChunk: true,
          },
          // Shared code between feature modules (design-system, types, etc.)
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
        // Remotes can be configured here for build-time, OR loaded dynamically at runtime
        // Runtime remotes are loaded via ModuleFederationLoader based on backend API config
        // (similar to Angular setup.xml pattern)
        remotes: {
          // Build-time remotes (optional - for development or static configs)
          ...(ENABLE_K11_INBOX && REMOTE_INBOX_URL
            ? { 
                k11Inbox: REMOTE_INBOX_URL.startsWith("http")
                  ? `k11Inbox@${REMOTE_INBOX_URL}`
                  : `k11Inbox@${isProd ? REMOTE_INBOX_URL : `http://localhost:${port}${REMOTE_INBOX_URL.startsWith("/") ? REMOTE_INBOX_URL : `/${REMOTE_INBOX_URL}`}`}`
              }
            : {}),
          ...(ENABLE_K11_MONITORING && REMOTE_MONITORING_URL
            ? { 
                k11Monitoring: REMOTE_MONITORING_URL.startsWith("http")
                  ? `k11Monitoring@${REMOTE_MONITORING_URL}`
                  : `k11Monitoring@${isProd ? REMOTE_MONITORING_URL : `http://localhost:${port}${REMOTE_MONITORING_URL.startsWith("/") ? REMOTE_MONITORING_URL : `/${REMOTE_MONITORING_URL}`}`}`
              }
            : {}),
        },
        shared: {
          react: { 
            singleton: true, 
            requiredVersion: shellPkg.dependencies.react,
            eager: true  // Required: Host must provide eagerly so remotes can consume
          },
          "react-dom": { 
            singleton: true, 
            requiredVersion: shellPkg.dependencies["react-dom"],
            eager: true  // Required: Host must provide eagerly so remotes can consume
          },
          "styled-components": { 
            singleton: true, 
            requiredVersion: shellPkg.dependencies["styled-components"],
            eager: true  // Required: Host must provide eagerly so remotes can consume
          },
        },
      }),
      // Load environment variables from .env files into the bundle
      // Note: process.env vars are already loaded above via dotenv for config evaluation
      // This plugin makes them available in the application code at runtime
      new Dotenv({
        path: isProd ? "./.env.production" : "./.env",
        safe: false, // Set to true to use .env.example as fallback
        systemvars: true, // Load system environment variables
        defaults: false, // Don't load .env.defaults
      }),
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, "public/index.html")
      }),
      // Bundle analyzer (only when --env analyze is passed)
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

