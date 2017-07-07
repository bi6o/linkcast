module.exports = new function() {
    this.devmode = true;

    this.dev_url = "http://localhost:8000";
    this.prod_url =
        "http://playground.ajaxtown.com/youtube_chrome_backend/index.php";

    this.getEndpoint = () => {
        console.log(this.dev_url);
        return this.devmode ? this.dev_url : this.prod_url;
    };
}();
