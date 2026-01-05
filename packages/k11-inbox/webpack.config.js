const path = require("path");
const { ModuleFederationPlugin } = require("webpack").container;
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = (_, argv) => {
  const isProd = argv.mode === "production" || argv.env?.production === true;
  const packagePkg = require("./package.json");
  const port = Number(process.env.PORT) || 3001;

  return {
    entry: path.resolve(__dirname, "src/index.ts"),
    mode: isProd ? "production" : "development",
    devtool: isProd ? "source-map" : "eval-source-map",
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "[name].js",
      library: { type: "var", name: "k11Inbox" },
      clean: false,
      publicPath: "auto",
    },
    devServer: {
      port,
      hot: true,
      historyApiFallback: true,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    },
    resolve: {
      extensions: [".tsx", ".ts", ".jsx", ".js"],
      alias: {
        "@design-system": path.resolve(__dirname, "../../packages/design-system/src"),
        "@api-client": path.resolve(__dirname, "../../packages/api-client/src"),
      },
      modules: [
        path.resolve(__dirname, "node_modules"),
        path.resolve(__dirname, "../../node_modules"),
        "node_modules",
      ],
      symlinks: false,
      fallback: {
        "events": require.resolve("events/"),
      },
    },
    module: {
      rules: [
        {
          test: /\.(ts|tsx|js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: [
                "@babel/preset-env",
                ["@babel/preset-react", { runtime: "automatic" }],
                "@babel/preset-typescript",
              ],
            },
          },
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
        },
      ],
    },
    plugins: [
      new ModuleFederationPlugin({
        name: "k11Inbox",
        filename: "remoteEntry.js",
        exposes: {
          "./InboxApp": "./src/InboxApp",
        },
        shared: {
          react: {
            singleton: true,
            requiredVersion: packagePkg.peerDependencies.react,
            eager: false,
          },
          "react-dom": {
            singleton: true,
            requiredVersion: packagePkg.peerDependencies["react-dom"],
            eager: false,
          },
          "@design-system": {
            singleton: true,
            eager: false,
          },
          "@api-client": {
            singleton: true,
            eager: false,
          },
          "@tanstack/react-query": {
            singleton: true,
            eager: false,
          },
          "@tanstack/query-core": {
            singleton: true,
            eager: false,
          },
          "@mantine/core": { singleton: true, eager: false },
          "@mantine/hooks": { singleton: true, eager: false },
          "@floating-ui/core": { singleton: true, eager: false },
          "@floating-ui/react": { singleton: true, eager: false },
          "@floating-ui/react-dom": { singleton: true, eager: false },
          "@floating-ui/utils": { singleton: true, eager: false },
          "@floating-ui/dom": { singleton: true, eager: false },
          "react-number-format": { singleton: true, eager: false },
          "react-textarea-autosize": { singleton: true, eager: false },
          "@babel/runtime": { singleton: true, eager: false },
          "use-latest": { singleton: true, eager: false },
          "use-composed-ref": { singleton: true, eager: false },
          "use-isomorphic-layout-effect": { singleton: true, eager: false },
          "tabbable": { singleton: true, eager: false },
          "scheduler": { singleton: true, eager: false },
          "react-remove-scroll": { singleton: true, eager: false },
          "react-remove-scroll-bar": { singleton: true, eager: false },
          "react-style-singleton": { singleton: true, eager: false },
          "get-nonce": { singleton: true, eager: false },
          "detect-node-es": { singleton: true, eager: false },
          "use-callback-ref": { singleton: true, eager: false },
          "use-sidecar": { singleton: true, eager: false },
        },
      }),
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, "public/index.html"),
        filename: "index.html",
      }),
    ],
  };
};

