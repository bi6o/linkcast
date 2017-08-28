module.exports = new function() {
    this.dev = "http://localhost:8000";

    this.prod =
        "http://playground.ajaxtown.com/youtube_chrome_backend/index.php";

    this.getEndpoint = function() {
        return window.mode == "dev" ? this.dev : this.prod;
    };

    this.appId = "amaekfehpldjnkblldhakfiilflijkcl";

    this.clientId =
        "145450808466-nvvknusqqjqo70s9b68d2k9luen6tr1d.apps.googleusercontent.com";

    this.clientSecret = "S_F1bEMnwRGdWR4dEgUwmVBa";

    this.refreshToken =
        "1/KtWQNQgDZlQufuuG4_SSjxSVbZ9s_0Y730q1nu8FWfq0mrpU3luN-8cgtvPB6qIq";
}();
