var webpack = require("webpack");
var SassPlugin = require("sass-webpack-plugin");
var StringReplacePlugin = require("string-replace-webpack-plugin");
var FileSystem = require("fs");
var path = require("path");
var watch = require("node-watch");

watch(path.join(__dirname, "../dev/view"), { recursive: true }, function(
    evt,
    name
) {
    console.log("%s changed.", name);
    producePopup();
});

function producePopup() {
    // replace html
    var template = FileSystem.readFileSync(
        path.join(__dirname, "../dev/view/popup_dev.html"),
        "utf8"
    );
    var reg = /<!--include (.*?) -->/gi;
    var data = template.replace(reg, function(text, match, idx) {
        var view = path.join(__dirname, "../dev", match.trim());
        //get contents of view
        var contents = FileSystem.readFileSync(view, "utf8");
        return contents;
    });
    FileSystem.writeFileSync(path.join(__dirname, "../dev/popup.html"), data);
}
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
        // //new SassPlugin("dev/css/themes/dark.scss"),
        function() {
            this.plugin("done", function(statsData) {
                producePopup();
            });
        }
    ],
    module: {
        rules: [
            {
                test: /\.html$/,
                use: [{ loader: "raw-loader" }]
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
