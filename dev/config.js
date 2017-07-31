module.exports = new function() {
    this.debug = false;

    this.dev = "http://localhost:8000";

    this.prod =
        "http://playground.ajaxtown.com/youtube_chrome_backend/index.php";

    this.getEndpoint = function() {
        return this.debug ? this.dev : this.prod;
    };
}();
