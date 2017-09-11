var auth = require("./auth");
var request = require("./request");
var user = require("./user");
var common = require("../common/common");

module.exports = new function() {
    this.page = 1;
    this.totalPages = 0;
    var bgPage = chrome.extension.getBackgroundPage();

    this.templates = {};

    this.getTemplate = name => {
        if (!this.templates[name]) {
            this.templates[name] = $("#" + name).html();
        }
        if (!this.templates.wrapper) {
            this.templates.wrapper = $("#notification-wrapper").html();
        }
        let wrapper = this.templates.wrapper;
        //let template = this.templates[name];
        return wrapper.replace("{ITEM}", this.templates[name]);
    };

    this.getNotifications = () => {
        var group = localStorage.getItem("defaultGroup");
        auth.getUserId(chrome_id => {
            let params = {
                group: group,
                action: "getNotificationItems",
                chrome_id: chrome_id
            };
            let data = common.getDataString(params);
            request.get(data, data => {
                $("#loader").remove();
                this.totalPages = data.pages;

                var items = data.rows.map(item => {
                    let $html = this.getTemplate(item.type);
                    $html = $html.replace(/{(.*?)}/gi, function(variable) {
                        // convert {VAR} to VAR
                        variable = variable
                            .substring(1, variable.length - 1)
                            .toLowerCase();

                        if (variable == "created_at") {
                            return moment(item.created_at)
                                .add(moment().utcOffset(), "minutes")
                                .fromNow();
                        } else if (item[variable]) {
                            return item[variable];
                        } else {
                            return "";
                        }
                    });
                    return $html;
                });
                if (data.rows.length === 0) {
                    items = "No notifications yet.. But someday.";
                }
                $("#tab-notifications .items").html(items);
            });
        });
    };

    this.getItemMarkup = (data, uid) => {
        $("#loader").remove();
        this.totalPages = data.pages;

        var items = data.rows.map(item => {
            let $html = this.getTemplate(item.type);
            $html = $html.replace(/{(.*?)}/gi, function(variable) {
                // convert {VAR} to VAR
                variable = variable
                    .substring(1, variable.length - 1)
                    .toLowerCase();

                if (variable == "created_at") {
                    return moment(item.created_at)
                        .add(moment().utcOffset(), "minutes")
                        .fromNow();
                } else if (item[variable]) {
                    return item[variable];
                } else {
                    return "";
                }
            });
            return $html;
        });
        return items;
    };
}();
