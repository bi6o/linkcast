var auth = require("./auth");
var request = require("./request");
var user = require("./user");
var common = require("../common/common");

module.exports = new function() {
    this.likeClicked = e => {
        var $handle = $(e.target).parent();
        var $item = $handle.parents(".item");
        var item_id = $item.data("id");
        $item.attr("data-liked", $item.attr("data-liked") == "0" ? 1 : 0);
        auth.getUserId(chrome_id => {
            var params = {
                item_id: item_id,
                chrome_id: chrome_id,
                action: "likeClicked"
            };
            request.post(common.getDataString(params), data => {
                let count = parseInt(data.count);
                if ($item.attr("data-liked") == "1") {
                    $handle
                        .find(".fa.heart")
                        .removeClass("fa-heart-o")
                        .addClass("fa-heart");
                } else {
                    $handle
                        .find(".fa.heart")
                        .removeClass("fa-heart")
                        .addClass("fa-heart-o");
                }
                $handle.find(".likes").html(data.count);
            });
        });
    };
}();
