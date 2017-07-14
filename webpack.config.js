var CopyWebpackPlugin = require("copy-webpack-plugin");
var webpack = require("webpack");
var SassPlugin = require("sass-webpack-plugin");

var path = require("path");
var glob = require("glob");

module.exports = {
    entry: {
        app: ["./dev/js/popup.js"]
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
        //new SassPlugin("dev/css/themes/dark.scss"),
        new CopyWebpackPlugin(
            [
                // {output}/file.txt
                { context: "dev", from: "*", to: "../build/" },
                { context: "dev", from: "assets/*", to: "../build/" },
                { context: "dev", from: "sound/*", to: "../build/" },
                { context: "dev", from: "css/**", to: "../build/" },
                { context: "dev", from: "fonts/**", to: "../build/" },
                {
                    context: "dev",
                    from: "js/background.js",
                    to: "../build/js"
                },
                { context: "dev", from: "js/content.js", to: "../build/js" }
            ],
            {
                ignore: ["webpack.config.js", "package.json"]
            }
        )
    ],
    module: {
        loaders: [
            // js
            {
                test: /\.js$/,
                loaders: ["babel-loader"],
                exclude: /node_modules/
            }
        ],
        rules: [
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
