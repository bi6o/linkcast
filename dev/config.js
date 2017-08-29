module.exports = new function() {
    this.dev = "http://localhost:8000";

    this.prod =
        "http://playground.ajaxtown.com/youtube_chrome_backend/index.php";

    this.getEndpoint = function() {
        return window.mode == "dev" ? this.dev : this.prod;
    };
}();
