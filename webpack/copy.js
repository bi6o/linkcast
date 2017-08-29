var CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = function(isDev) {
    if (!isDev) {
        return new CopyWebpackPlugin(
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
        );
    }
};
