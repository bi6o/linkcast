var auth = require("./auth");
var request = require("./request");
var user = require("./user");
var common = require("../common/common");

module.exports = new function() {
    this.commentsPage = 1;
    this.totalCommentsPages = 0;

    this.sendComment = e => {
        var $handle = $(e.target).parents(".item");
        var $comments = $handle.find(".comments-section .comments");
        var item_id = $handle.data("id");
        var comment = $handle
            .find(".comment-input")
            .val()
            .trim();

        if (e.keyCode == 13 && comment.length > 0) {
            $handle.find(".comment-input").val("");
            auth.getUserId(chrome_id => {
                var params = {
                    item_id: item_id,
                    comment: comment,
                    chrome_id: chrome_id,
                    action: "insertComment"
                };
                request.post(common.getDataString(params), data => {
                    if (data.flag == 1) {
                        var $html = $("#comment-template").clone();
                        var item = $html
                            .html()
                            .replace("{COMMENT_ID}", data.id)
                            .replace("{USER_NAME}", user.info.nickname)
                            .replace("{USER_COMMENT}", common.escape(comment))
                            .replace("{COLOR}", user.info.color)
                            .replace("{COMMENT_DATE}", "now");
                        $comments.prepend(item);
                    }
                });
            });
        }
    };

    this.showComments = e => {
        var $handle = $(e.target).parents(".item");
        var item_id = $handle.data("id");
        var $comments = $handle.find(".comments-section .comments");
        $comments.parent().toggleClass("hide");

        $comments.html("loading...");
        this.fetchComments($comments, "html", null, item_id);
    };

    this.fetchComments = ($handle, updateType, count, item_id, callback) => {
        auth.getUserId(chrome_id => {
            var params = {
                commentsPage: this.commentsPage,
                item_id: item_id,
                chrome_id: chrome_id,
                action: "commentsItem"
            };
            var data = common.getDataString(params);
            request.get(data, data => {
                this.totalCommentsPages = data.total;
                var html = "";
                if (data.rows.length > 0) {
                    data.rows.forEach(item => {
                        var $html = $("#comment-template").clone();

                        var item = $html
                            .html()
                            .replace("{COMMENT_ID}", item.id)
                            .replace("{USER_NAME}", item.nickname)
                            .replace(
                                "{USER_COMMENT}",
                                common.escape(item.comment)
                            )
                            .replace("{COLOR}", item.color)
                            .replace(
                                "{COMMENT_DATE}",
                                moment(item.created_at)
                                    .add(moment().utcOffset(), "minutes")
                                    .fromNow()
                            );
                        html += item;
                    });
                }
                if (updateType === "html") {
                    $handle.html(html);
                } else if (updateType === "append") {
                    $handle.append(html);
                } else if (updateType === "prepend") {
                    $handle.prepend(html);
                }
                if (typeof callback === "function") {
                    callback(html);
                }
            });
        });
    };
}();
