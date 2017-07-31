module.exports = new function() {
    this.basePropertyOf = object => {
        return function(key) {
            return object == null ? undefined : object[key];
        };
    };

    this.escape = str => {
        /** Used to map characters to HTML entities. */
        const htmlEscapes = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        let escapeHtmlChar = this.basePropertyOf(htmlEscapes);
        let reUnescapedHtml = /[&<>"']/g;
        return str.replace(reUnescapedHtml, escapeHtmlChar);
    };

    this.unescape = str => {
        /** Used to map HTML entities to characters. */
        const htmlUnescapes = {
            "&amp;": "&",
            "&lt;": "<",
            "&gt;": ">",
            "&quot;": '"',
            "&#39;": "'"
        };
        let unescapeHtmlChar = this.basePropertyOf(htmlUnescapes);
        let reEscapedHtml = /&(?:amp|lt|gt|quot|#39);/g;
        return str.replace(reEscapedHtml, unescapeHtmlChar);
    };

    /**
     * Generates a hash
     * @return {String}
     */
    this.getRandomToken = () => {
        // E.g. 8 * 32 = 256 bits token
        var randomPool = new Uint8Array(32);
        crypto.getRandomValues(randomPool);
        var hex = "";
        for (var i = 0; i < randomPool.length; ++i) {
            hex += randomPool[i].toString(16);
        }
        // E.g. db18458e2782b2b77e36769c569e263a53885a9944dd0a861e5064eac16f1a
        return hex;
    };
    this.getDataString = params => {
        var str = "1=1";
        for (var key in params) {
            str += "&" + key + "=" + params[key];
        }
        return str;
    };
    this.lazyLoadImages = handle => {
        handle.each(function() {
            var $img = $(this);
            $.ajax({
                url: $img.data("src"),
                type: "HEAD",
                timeout: 1200,
                success: function() {
                    $img
                        .hide()
                        .attr("src", $img.data("src"))
                        .fadeIn(1000)
                        .removeClass("lazy")
                        .removeAttr("data-src");
                }
            });
        });
    };
}();
