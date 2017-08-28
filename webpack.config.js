var CopyWebpackPlugin = require("copy-webpack-plugin");
var webpack = require("webpack");
var SassPlugin = require("sass-webpack-plugin");
var StringReplacePlugin = require("string-replace-webpack-plugin");
var FileSystem = require("fs");
var path = require("path");
var archiver = require("archiver");
var publisher = require("./dev/lib/publisher");
var tokens = require("./tokens");

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
        // new webpack.ContextReplacementPlugin(
        //     /\.\/locale$/,
        //     "empty-module",
        //     false,
        //     /js$/
        // ),
        new webpack.optimize.UglifyJsPlugin({
            compress: { warnings: false },
            output: { comments: false },
            sourceMap: true
        }),

        //new SassPlugin("dev/css/themes/dark.scss"),
        new CopyWebpackPlugin(
            [
                // {output}/file.txt
                { context: "dev", from: "*", to: "../build/" },
                { context: "dev", from: "public/**/*", to: "../build/" },
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
        ),
        function() {
            this.plugin("done", function(statsData) {
                var stats = statsData.toJson();
                var isDev =
                    process.argv
                        .filter(arg => {
                            return arg == "-p";
                        })
                        .join() != "-p";
                if (!stats.errors.length && !isDev) {
                    var htmlFileName = "dev/popup.html";
                    var html = FileSystem.readFileSync(
                        path.join(__dirname, htmlFileName),
                        "utf8"
                    );
                    var htmlOutput = html
                        .replace("http://localhost:3000/build", "")
                        .replace("development_mode", "prod");
                    FileSystem.writeFileSync(
                        path.join(__dirname, "build", "popup.html"),
                        htmlOutput
                    );
                    console.log("zipping...");
                    // zip it.
                    var output = FileSystem.createWriteStream(
                        path.join(__dirname, "/linkcast.zip")
                    );
                    var archive = archiver("zip");
                    // listen for all archive data to be written
                    output.on("close", function() {
                        console.log(archive.pointer() + " total bytes");
                        console.log(
                            "archiver has been finalized and the output file descriptor has closed."
                        );
                    });
                    archive.pipe(output);
                    archive.directory(path.join(__dirname, "/build/"), false);
                    archive.finalize();

                    publisher.publish({
                        archive: path.join(__dirname, "/linkcast.zip"),
                        tokens: tokens,
                        manifestPath: path.join(__dirname, "/dev/manifest.json")
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
