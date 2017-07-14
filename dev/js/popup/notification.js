var auth = require("./auth");
var request = require("./request");
var user = require("./user");
var common = require("../common/common");

module.exports = new function() {
    this.page = 1;
    this.totalPages = 0;
    var bgPage = chrome.extension.getBackgroundPage();
    this.getNotifications = () => {
        var group = localStorage.getItem("defaultGroup");
        auth.getUserId(chrome_id => {
            let params = {
                group: group,
                action: "getActivities",
                chrome_id: chrome_id
            };
            let data = common.getDataString(params);
            request.get(data, data => {
                $("#loader").remove();
                this.totalPages = data.pages;
                let $html = $("#notification-template").clone();

                var items = data.rows.map(item => {
                    return $html
                        .html()
                        .replace("{ITEM_ID}", item.item_id)
                        .replace("{ITEM}", item.template)
                        .replace(
                            "{CREATED_AT}",
                            moment(item.created_at)
                                .add(moment().utcOffset(), "minutes")
                                .fromNow()
                        );
                });
                if (data.rows.length === 0) {
                    items = "No notifications yet.. But someday.";
                }
                $("#notifications ul.items").html(items);
            });
        });
    };
}();
