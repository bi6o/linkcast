const FileSystem = require("fs");

function readManifest(packagePath) {
    let manifest = fs.readFileSync(packagePath, "utf8");
    return JSON.parse(manifest);
}

module.exports = readManifest;
