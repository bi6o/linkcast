const request = require("./request");
const storage = require("./storage");
const auth = require("./auth");
const common = require("../common/common");
const message = require("./message");

module.exports = new function() {
    /**
     * Holds the current page number
     * @type {Number}
     */
    this.page = 1;

    /**
     * Total number of pages available
     * @type {Number}
     */
    this.totalPages = 0;

    /**
     * Fetch items from the server
     * @param  {Int} Current Page
     * @param  {String} Determines active tab
     * @param  {Function} Callback function
     * @param  {String} Determines if the items needs to be appended or prepended or pasted
     * @param  {Number} Total items to fetch
     */
    this.fetchItems = (handle, updateType, count, callback) => {
        var group = storage.getItem("defaultGroup");
        if (group) {
            auth.getUserId(chrome_id => {
                var uid = storage.getItem("uid");
                const params = {
                    count: count,
                    handle: handle.replace("#", ""),
                    page: this.page,
                    chrome_id: chrome_id,
                    group: group,
                    action: "readTracks"
                };
                let data = common.getDataString(params);
                request.get(data, data => {
                    $("#loader").remove();
                    var existingItemsCount = $(handle + " .item").length;
                    var html = "";

                    this.totalPages = data.pages;

                    if (data.rows.length === 0) {
                        html = "Nothing found.";
                    }

                    data.rows.forEach((item, idx) => {
                        let $html = $("#item-template").clone();

                        let comments =
                            item.comments === null ? "" : item.comments;

                        let thumbnail = item.thumbnail;

                        if (item.thumbnail == "" || item.thumbnail == null) {
                            thumbnail = "assets/weed.jpg";
                        }

                        var gname = handle == "#wall" ? "" : `[${item.name}]`;

                        var favourite =
                            item.favourite == "1"
                                ? "glyphicon-star"
                                : "glyphicon-star-empty";

                        var deleteBtn = item.uid == uid ? "Delete" : "";

                        var item = $html
                            .html()
                            .replace("{NICKNAME}", common.escape(item.nickname))
                            .replace("{SRNO}", ++existingItemsCount)
                            .replace("{STAR}", favourite)
                            .replace("{THUMB}", thumbnail)
                            .replace("{ITEM_ID}", item.id)
                            .replace("{USER_ID}", item.uid)
                            .replace("{TITLE}", common.escape(item.title))
                            .replace("{URL}", common.escape(item.url))
                            .replace("{COMMENTS}", comments)
                            .replace("{GROUP_NAME}", common.escape(gname))
                            .replace("{GROUP_ID}", gname)
                            .replace("{DELETE}", deleteBtn)
                            .replace("{COMMENTS_COUNT}", item.comments_count)
                            //.replace("{COLOR}", item.color)
                            .replace("{TIMES_CLICKED}", item.times_clicked)
                            .replace(
                                "{CREATED_AT}",
                                moment(item.created_at)
                                    .add(moment().utcOffset(), "minutes")
                                    .fromNow()
                            );
                        html += item;
                    });

                    if (updateType === "append") {
                        $(handle + " ul.chat").append(html);
                    } else if (updateType === "prepend") {
                        $(handle + " ul.chat").prepend(html);
                    } else if (updateType === "html") {
                        $(handle + " ul.chat").html(html);
                    }
                    common.lazyLoadImages($(handle + " ul.chat .lazy"));

                    if (typeof callback === "function") {
                        callback(html);
                    }
                });
            });
        }
    };
    /**
     * Publish a new Item
     */
    this.addItem = () => {
        var title = $("#item-name").val();
        var url = $("#item-url").val();
        var thumbnail = $("#item-thumb").val();
        var comments = $("#item-comments").val();
        var group = $("#add-item #groups-dd").val();
        var defaultGroup = storage.getItem("defaultGroup");
        var flag = 1;

        //Validations
        if (url == "") {
            message.show("Enter a valid URL", "Error");
            flag = 0;
        }

        if (flag === 1 && title == "") {
            message.show("Enter a Title", "Error");
            flag = 0;
        }

        if (flag === 1) {
            if (group && group != "0") {
                auth.getUserId(function(chrome_id) {
                    var params = {
                        thumbnail: thumbnail,
                        comments: comments,
                        title: title,
                        url: url,
                        group: group,
                        chrome_id: chrome_id,
                        action: "insertTrack"
                    };
                    var data = common.getDataString(params);

                    request.post(data, function(data) {
                        if (data.flag) {
                            if (group == defaultGroup) {
                                $('a[data-target="#wall"]').click();
                            } else {
                                $('a[data-target="#updates"]').click();
                            }
                            $("#add-item input").val("");
                        } else {
                            message.show(data.msg, "Sorry");
                        }
                    });
                });
            } else {
                message.show(
                    "Select a group as default from Settings",
                    "Error"
                );
            }
        }
    };

    this.itemClicked = e => {
        $handle = $(e.target).parents(".item");
        var item_id = $handle.data("id");

        auth.getUserId(function(chrome_id) {
            var params = {
                chrome_id: chrome_id,
                action: "itemClicked",
                item_id: item_id
            };
            var data = main.getDataString(params);
            main.bgPage.sendClickedStat(data);
            // request.post(data, function(){

            // });
        });
    };

    this.itemForward = e => {
        var $handle = $(e.target).parents(".item");
        var url = $handle.find(".item-link").attr("href");
        var title = $handle.find(".item-link").text();

        $('a[data-target="#add-item"]').click();
        $("#add-item #item-name").val(title);
        $("#add-item #item-url").val(url);
    };

    this.deleteItem = e => {
        var $handle = $(e.target).parents(".item");
        var item_id = $handle.data("id");

        auth.getUserId(chrome_id => {
            var params = {
                item_id: item_id,
                chrome_id: chrome_id,
                action: "deleteItem"
            };
            var data = common.getDataString(params);
            request.post(data, data => {
                if (data.flag) {
                    $handle.remove();
                } else {
                }
            });
        });
    };
    /**
     * Make the item your favourite
     */
    this.makeFavourite = e => {
        var $handle = $(e.target);
        var item_id = $handle.parents(".item").data("id");

        auth.getUserId(function(chrome_id) {
            var action = "addToFavourite";
            var newClass = "glyphicon-star";

            if ($handle.hasClass("glyphicon-star")) {
                action = "removeFromFavourite";
                newClass = "glyphicon-star-empty";
            }
            var params = {
                chrome_id: chrome_id,
                item_id: item_id,
                action: action
            };
            var data = common.getDataString(params);
            request.post(data, data => {
                $('.item[data-id="' + item_id + '"] .favourite')
                    .removeClass("glyphicon-star glyphicon-star-empty")
                    .addClass(newClass);
            });
        });
    };
}();
