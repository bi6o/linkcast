var webpack = require("webpack");
var SassPlugin = require("sass-webpack-plugin");
var StringReplacePlugin = require("string-replace-webpack-plugin");
var path = require("path");
var publisher = require("./dev/lib/publisher");
var tokens = require("./tokens");
var copy = require("./webpack/copy");
var pack = require("./webpack/pack");

module.exports = {
    entry: {
        popup: ["./dev/js/popup.js"]
    },
    output: {
        path: path.join(__dirname, "build"),
        publicPath: "/build",
        filename: "[name].js"
    },
    devServer: {
        host: "localhost", // Your Computer Name
        port: 3000
    },
    plugins: [
        new StringReplacePlugin(),
        new webpack.optimize.UglifyJsPlugin({
            compress: { warnings: false },
            output: { comments: false },
            sourceMap: true
        }),
        copy(),
        //new SassPlugin("dev/css/themes/dark.scss"),
        pack({
            src: path.join(__dirname, "build/"),
            target: path.join(__dirname, "/linkcast.zip"),
            callback: params => {
                publisher.publish({
                    archive: params.target,
                    tokens: tokens,
                    manifestPath: path.join(__dirname, "/dev/manifest.json")
                });
            }
        })
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
