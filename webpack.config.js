var webpack = require("webpack");
var SassPlugin = require("sass-webpack-plugin");
var StringReplacePlugin = require("string-replace-webpack-plugin");
var path = require("path");
var publisher = require("./utils/publisher");
var tokens = require("./tokens");
var copy = require("./utils/copy");
var pack = require("./utils/pack");
var CopyWebpackPlugin = require("copy-webpack-plugin");
var isDev =
    process.argv
        .filter(arg => {
            return arg == "-p";
        })
        .join() != "-p";

module.exports = {
    entry: {
        popup: "./dev/popup.js"
    },
    output: {
        path: path.join(__dirname, "build"),
        publicPath: "/build",
        filename: "[name].js"
    },
    devServer: {
        host: "localhost",
        port: 3000
    },
    plugins: [
        new StringReplacePlugin(),
        new webpack.optimize.UglifyJsPlugin({
            compress: { warnings: false },
            output: { comments: false },
            sourceMap: true
        }),
        new CopyWebpackPlugin(
            [{ context: "dev", from: "**/*", to: "../build" }],
            {
                ignore: ["popup.js", "js", "popup.html", "background.js"]
            }
        ),
        // //new SassPlugin("dev/css/themes/dark.scss"),
        function() {
            this.plugin("done", function(statsData) {
                var stats = statsData.toJson();
                if (!stats.errors.length && !isDev) {
                    //pack the build
                    pack({
                        root: __dirname,
                        src: path.join(__dirname, "build/"),
                        target: path.join(__dirname, "/linkcast.zip"),
                        callback: params => {
                            let manifest = path.join(
                                __dirname,
                                "/dev/manifest.json"
                            );
                            // publish to chrome
                            publisher.publish({
                                archive: params.target,
                                tokens: tokens,
                                manifestPath: manifest
                            });
                        }
                    });
                }
            });
        }
    ],
    module: {
        rules: [
            {
                test: /\.html$/,
                use: [{ loader: "file-loader?name=[path][name].[ext]" }]
            },
            {
                test: /\.js$/,
                use: [
                    {
                        loader: "babel-loader"
                    }
                ]
            },
            {
                test: /\.scss$/,
                use: [
                    {
                        loader: "style-loader"
                    },
                    {
                        loader: "css-loader"
                    },
                    {
                        loader: "sass-loader",
                        options: {
                            includePaths: ["dev/css/themes/dark.scss"]
                        }
                    }
                ]
            }
        ]
    }
};
