const path = require("path");
const { ModuleFederationPlugin } = require("webpack").container;
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = (_, argv) => {
  const isProd = argv.mode === "production" || argv.env?.production === true;
  const packagePkg = require("./package.json");
  const port = Number(process.env.PORT) || 3002;

  return {
    entry: path.resolve(__dirname, "src/index.ts"),
    mode: isProd ? "production" : "development",
    devtool: isProd ? "source-map" : "eval-source-map",
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "[name].js",
      library: { type: "var", name: "k11Monitoring" },
      // Don't clean - preserve TypeScript output for local bundling
      // Webpack outputs: remoteEntry.js, main.js, chunks
      // TypeScript outputs: index.js, index.d.ts (for local bundling)
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
          test: /\.css$/,
          use: ["style-loader", "css-loader"],
        },
      ],
    },
    plugins: [
      new ModuleFederationPlugin({
        name: "k11Monitoring",
        filename: "remoteEntry.js",
        exposes: {
          "./MonitoringApp": "./src/MonitoringApp",
        },
        shared: {
          react: {
            singleton: true,
            requiredVersion: packagePkg.peerDependencies.react,
            eager: false,  // Consume from host, don't provide eagerly
          },
          "react-dom": {
            singleton: true,
            requiredVersion: packagePkg.peerDependencies["react-dom"],
            eager: false,  // Consume from host, don't provide eagerly
          },
          "styled-components": {
            singleton: true,
            requiredVersion: packagePkg.peerDependencies["styled-components"],
            eager: false,  // Consume from host, don't provide eagerly
          },
        },
      }),
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, "public/index.html"),
        filename: "index.html",
      }),
    ],
  };
};

