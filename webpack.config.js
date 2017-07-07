var CopyWebpackPlugin = require("copy-webpack-plugin");
var webpack = require("webpack");
var ReplacePlugin = require("replace-webpack-plugin");
var path = require("path");
var glob = require("glob");

module.exports = {
    entry: {
        app: "./dev/js/popup.js"
    },
    output: {
        path: path.join(__dirname, "dev"),
        filename: "[name].entry.js"
    },
    plugins: [
        new webpack.ContextReplacementPlugin(
            /\.\/locale$/,
            "empty-module",
            false,
            /js$/
        ),
        new webpack.optimize.UglifyJsPlugin({
            compress: { warnings: false },
            output: { comments: false },
            sourceMap: true
        }),
        new webpack.DefinePlugin({
            "process.env": {
                NODE_ENV: '"dev"'
            }
        }),
        // new ReplacePlugin({
        //     skip: process.env.NODE_ENV === "development",
        //     entry: "dev/popup.html",
        //     hash: "[hash]",
        //     output: "/build/popup.html",
        //     data: {
        //         css:
        //             '<link type="text/css" rel="stylesheet" href="styles.css">',
        //         js: '<script src="bundle.js"></script>'
        //     }
        // }),
        new CopyWebpackPlugin(
            [
                // {output}/file.txt
                { context: "dev", from: "*", to: "../build/" },
                { context: "dev", from: "assets/*", to: "../build/" },
                { context: "dev", from: "sound/*", to: "../build/" },
                { context: "dev", from: "css/*", to: "../build/" },
                { context: "dev", from: "js/lib/*", to: "../build/" }
            ],
            {
                ignore: ["webpack.config.js", "*.json", "popup.html"]
            }
        )
    ],
    module: {
        loaders: [
            { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" }
        ]
    }
};
