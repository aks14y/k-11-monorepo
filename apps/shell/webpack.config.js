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
  // Check both argv.mode and argv.env.production for production mode
  // argv.mode is set by --mode production
  // argv.env.production is set by --env production
  const isProd = argv.mode === "production" || argv.env?.production === true;
  const shouldAnalyze = argv.env?.analyze === true;
  const port = Number(process.env.PORT) || 3000;
  
  // Load environment-specific .env file if it exists
  const envPath = isProd 
    ? path.resolve(__dirname, ".env.production")
    : path.resolve(__dirname, ".env");
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
  }

  // ============================================================================
  // BUILD CONFIGURATION
  // ============================================================================
  // Automatically use dist/ in production, src/ in development
  const shouldUseDist = isProd;
  
  // Debug logging
  console.log("[Webpack Config] Mode:", argv.mode || "undefined", "| env.production:", argv.env?.production, "| isProd:", isProd);
  console.log("[Webpack Config] Using:", shouldUseDist ? "dist/" : "src/");

  // ============================================================================
  // ALIAS CONFIGURATION
  // ============================================================================
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
      historyApiFallback: {
        // Don't fallback to index.html for .json files
        disableDotRule: false,
        htmlAcceptHeaders: ['text/html', 'application/xhtml+xml'],
      },
      hot: true,
    },
    resolve: {
      extensions: [".tsx", ".ts", ".jsx", ".js"],
      modules: [shellNodeModules, "node_modules"],
      alias: aliases,
      symlinks: false
    },
    externals: {},
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
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
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
          "styled-components": { 
            singleton: true, 
            requiredVersion: shellPkg.dependencies["styled-components"],
            eager: true
          },
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

