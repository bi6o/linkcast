var appConfig = require("../app.config.json");

module.exports = new function() {
    this.getEndpoint = function() {
        return window.APP_ENV == "dev" ? appConfig.dev : appConfig.prod;
    };
}();
