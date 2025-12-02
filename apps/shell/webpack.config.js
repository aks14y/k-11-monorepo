/**
 * Webpack Configuration for Shell App
 * 
 * USAGE EXAMPLES:
 * 
 * Development (uses src/ via workspace linking, includes k11-inbox and k11-monitoring):
 *   pnpm dev:shell
 * 
 * Production (automatically uses dist/ outputs, packages built first via turbo):
 *   pnpm build --filter shell
 *   OR: pnpm build (builds all packages then shell)
 * 
 * Override dist/ usage:
 *   USE_DIST=false pnpm build --filter shell  # Force src/ even in production
 *   USE_DIST=true pnpm dev:shell              # Force dist/ even in development
 * 
 * Include only k11-inbox:
 *   ENABLE_K11_INBOX=true ENABLE_K11_MONITORING=false pnpm build --filter shell
 * 
 * Include only k11-monitoring:
 *   ENABLE_K11_INBOX=false ENABLE_K11_MONITORING=true pnpm build --filter shell
 * 
 * Include both MFEs:
 *   ENABLE_K11_INBOX=true ENABLE_K11_MONITORING=true pnpm build --filter shell
 * 
 * Customer-specific builds:
 *   # Customer A (k11-inbox and k11-monitoring)
 *   ENABLE_K11_INBOX=true ENABLE_K11_MONITORING=true USE_DIST=true pnpm build --filter shell
 *   
 *   # Customer B (k11-inbox only)
 *   ENABLE_K11_INBOX=true ENABLE_K11_MONITORING=false USE_DIST=true pnpm build --filter shell
 */

const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const Dotenv = require("dotenv-webpack");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

const shellNodeModules = path.resolve(__dirname, "node_modules");

module.exports = (_, argv) => {
  const isProd = argv.mode === "production";
  const shouldAnalyze = argv.env?.analyze === true;
  const port = Number(process.env.PORT) || 3000;

  // ============================================================================
  // BUILD CONFIGURATION FLAGS
  // ============================================================================
  // Environment variables are loaded from .env files via dotenv-webpack:
  //   - Development: .env (USE_DIST=false by default)
  //   - Production: .env.production (USE_DIST=true by default)
  //   - Can be overridden with command-line env vars: USE_DIST=true pnpm build
  // 
  // USE_DIST: Controls whether to use compiled dist/ output instead of src/
  //           - Development: defaults to false (uses src/ for faster HMR)
  //           - Production: defaults to true (uses dist/ for optimized builds)
  const USE_DIST = process.env.USE_DIST !== undefined 
    ? process.env.USE_DIST === "true"
    : isProd; // Auto-use dist/ in production, src/ in development

  // MFE FEATURE FLAGS: Set to 'true' to include the MFE in the build
  //                    If false, the MFE won't be bundled (compile-time exclusion)
  const ENABLE_K11_INBOX = process.env.ENABLE_K11_INBOX !== "false"; // Default: true
  const ENABLE_K11_MONITORING = process.env.ENABLE_K11_MONITORING !== "false"; // Default: true

  // ============================================================================
  // ALIAS CONFIGURATION
  // ============================================================================
  // Choose between src/ (development) or dist/ (production) paths
  // 
  // Development: Uses src/ via workspace linking for fast HMR
  // Production: Uses dist/ outputs (packages must be built first via turbo)
  // 
  // Build flow:
  //   1. turbo.json ensures packages build before shell (dependsOn: ["^build"])
  //   2. Packages compile TypeScript src/ → dist/
  //   3. Webpack aliases point to dist/ in production mode
  //   4. Shell bundles everything together into apps/shell/dist/
  const getPackagePath = (packageName, useDist = USE_DIST) => {
    if (useDist) {
      // TypeScript preserves directory structure, so dist files are at dist/packageName/src/
      // Check if nested structure exists, otherwise fall back to dist/
      const nestedPath = path.resolve(__dirname, `../../packages/${packageName}/dist/${packageName}/src`);
      const flatPath = path.resolve(__dirname, `../../packages/${packageName}/dist`);
      try {
        // Check if nested index.js exists
        if (require('fs').existsSync(path.join(nestedPath, 'index.js'))) {
          return nestedPath;
        }
      } catch (e) {
        // Fall through to flat path
      }
      return flatPath;
    }
    return path.resolve(__dirname, `../../packages/${packageName}/src`);
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
  };

  // Conditionally add MFE aliases based on feature flags
  // Uses getPackagePath() which respects USE_DIST env variable from .env files
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
      hot: true
    },
    resolve: {
      extensions: [".tsx", ".ts", ".jsx", ".js"],
      modules: [shellNodeModules, "node_modules"],
      alias: aliases,
      symlinks: false
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
                "@types"
              ];
              
              // Conditionally allow MFEs based on feature flags
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
      // Load environment variables from .env files
      // Automatically loads .env.production in production mode, .env in development
      new Dotenv({
        path: isProd ? "./.env.production" : "./.env",
        safe: false, // Set to true to use .env.example as fallback
        systemvars: true, // Load system environment variables
        defaults: false // Don't load .env.defaults
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

