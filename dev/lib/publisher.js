const chromeWebStore = require("./chrome_web_store");
const extensionVersion = require("./extension_version");
const FileSystem = require("fs");
const path = require("path");
const sprintf = require("sprintf");
const JSZip = require("jszip");

let accessTokenParams = {};

function readManifest(packagePath) {
    let manifest = FileSystem.readFileSync(packagePath, "utf8");
    return JSON.parse(manifest);
}

function compress(zipPath) {
    console.log("zipping...");
    // zip it.
    var output = FileSystem.createWriteStream(path.join(zipPath));
    var archive = archiver("zip", {
        zlib: { level: 9 } // Sets the compression level.
    });
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
}
const store = function(params) {
    const { manifestPath, tokens, archive } = params;
    const { appId, clientId, clientSecret, refreshToken } = tokens;
    console.log("Refreshing Chrome Web Store access token...");
    const appManifest = readManifest(manifestPath);
    chromeWebStore
        .getAccessToken(clientId, clientSecret, refreshToken)
        .then(_accessTokenParams => {
            console.log("Uploading updated package", manifestPath);
            accessTokenParams = _accessTokenParams;
            return chromeWebStore.getPackage(
                appId,
                accessTokenParams.access_token
            );
        })
        .then(result => {
            const response = result[0];
            const body = JSON.parse(result[1]);
            if (body.crxVersion) {
                console.log("Current version on store: '%s'", body.crxVersion);
            }

            if (!extensionVersion.isValid(body.crxVersion)) {
                throw new Error(
                    sprintf(
                        "Existing item version '%s' is not a valid Chrome extension version",
                        body.crxVersion
                    )
                );
            }
            if (!extensionVersion.isValid(appManifest.version)) {
                throw new Error(
                    sprintf(
                        "Version in manifest '%s' is not a valid Chrome extension version",
                        appManifest.version
                    )
                );
            }

            const isManifestVersionNewer = extensionVersion.lessThan(
                body.crxVersion,
                appManifest.version
            );
            console.log(
                body.crxVersion,
                appManifest.version,
                isManifestVersionNewer
            );
            return chromeWebStore.uploadPackage(
                archive,
                appId,
                accessTokenParams.access_token
            );
        })
        .then(result => {
            const response = result[0];
            const body = result[1];

            if (response.statusCode !== 200) {
                throw new Error(
                    sprintf(
                        "Package upload failed: %d %s",
                        response.statusCode,
                        body
                    )
                );
            }
            const uploadResult = JSON.parse(body);
            if (uploadResult.uploadState == "FAILURE") {
                const currentVersionRegex = /larger version in file manifest.json than the published package: ([0-9.]+)/;
                if (uploadResult.itemError) {
                    throw new Error(
                        sprintf(
                            "Package upload error: %s",
                            JSON.stringify(uploadResult)
                        )
                    );
                }
            } else {
                console.log("Publishing updated package", appId);
                return chromeWebStore.publishPackage(
                    appId,
                    accessTokenParams.access_token
                );
            }
        })
        .then(result => {
            const response = result[0];
            const body = result[1];
            if (response.statusCode !== 200) {
                throw new Error(
                    sprintf(
                        "Publishing updated package failed: %d %s",
                        response.statusCode,
                        body
                    )
                );
            }
            const publishResult = JSON.parse(body);
            if (publishResult.itemError) {
                throw new Error(
                    sprintf(
                        "Package publish error: %s",
                        JSON.stringify(publishResult)
                    )
                );
            }
            console.log("Updated package has been queued for publishing");
        })
        .catch(err => {
            console.error("Publishing updated package failed: %s", err);
            fatalError(err);
        });
};

module.exports = {
    publish: function(params) {
        store(params);
    }
};
