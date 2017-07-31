var auth = require("./auth");
var common = require("../common/common");
var request = require("./request");
var message = require("./message");
var storage = require("./storage");

module.exports = new function() {
    this.fetchGroups = () => {
        auth.getUserId(chrome_id => {
            let params = {
                chrome_id: chrome_id,
                action: "fetchUserGroups"
            };
            var data = common.getDataString(params);
            var groups = {
                all: "<option value='0'>All</option>",
                withPostAccess: "",
                admin: ""
            };

            request.get(data, data => {
                var html = "<option value='0'>Select</option>";

                data.forEach(item => {
                    let options = this.getGroupsTemplate(item);
                    if (item.group_rights == "can_post") {
                        groups.withPostAccess += options;
                    }
                    if (item.admin === item.uid) {
                        groups.admin += options;
                    }
                    groups.all += options;
                });
                $("#wall #groups-dd").html(groups.all);
                $("#add-item #groups-dd").html(groups.withPostAccess);
                $("#settings #groups-dd").html(groups.admin);
                this.groupDDChanged();
            });
        });
    };
    this.getGroupsTemplate = item => {
        var admin = false;
        var defaultGroup = storage.getItem("defaultGroup");
        var selected = defaultGroup === item.gid ? " selected " : "";
        var adminText = "";

        if (item.admin === item.uid) {
            adminText = "(admin)";
            admin = true;
        }
        return `<option
                        data-desc="${item.desc}"
                        is_public="${item.is_public}"
                        group_rights="${item.group_rights}"
                        admin-id="${item.admin}"
                        name="${item.gname}"
                        admin="${admin}"
                        ${selected}
                        value="${item.gid}"
                    >
                        ${item.gname}
                        ${adminText}
                    </option>`;
    };
    this.createEditGroup = e => {
        var mode = $(e.target).data("action");

        auth.getUserId(chrome_id => {
            var name = $("#settings .tab-pane.active #group_name").val();
            var desc = $("#settings .tab-pane.active #group_desc").val();
            var is_public = $(
                "#settings .tab-pane.active #group-visibility .radio:checked"
            ).val();

            var params = {
                is_public: is_public,
                action: "createEditGroup",
                chrome_id: chrome_id,
                desc: desc,
                mode: mode,
                name: name,
                group_rights: $(
                    "#settings .tab-pane.active #group-rights .radio:checked"
                ).val()
            };

            if (mode == "edit") {
                params.gid = $("#settings #groups-dd option:selected").val();
            }
            //if group is public, find other options
            if (is_public == "0") {
                params.password = $(
                    "#settings .tab-pane.active #group-private #group-password"
                ).val();
                if (params.password.trim().length == 0) {
                    message.show("Please enter a password", "Error");
                    return;
                }
            }

            var data = common.getDataString(params);

            if (name == "") {
                message.show("Please enter a groupname. Noob!", "Error");
            } else if (desc == "") {
                message.show("Please enter a group description!", "Error");
            } else {
                request.post(data, data => {
                    if (data.flag) {
                        $("#settings .tab-pane.active #group_name").val("");
                        message.show(data.msg, "Success");
                        this.fetchGroups();
                        $("#edit-group-cancel-btn").click();
                    } else {
                        message.show(data.msg, "Error");
                    }
                });
            }
        });
    };

    this.leaveGroup = e => {
        var $handle = $(e.target);
        var group_id = $handle.parents("tr").data("gid");

        auth.getUserId(chrome_id => {
            var params = {
                action: "leaveGroup",
                chrome_id: chrome_id,
                group_id: group_id
            };
            var data = common.getDataString(params);
            // check if the group exist. If yes, join the group
            request.post(data, data => {
                if (data.flag) {
                    $handle
                        .removeClass("group-leave red")
                        .addClass("group-join green")
                        .html("Join");
                    message.show(data.msg, "Success");
                } else {
                    message.show(data.msg, "Error");
                }
            });
        });
    };
    this.joinPublicGroup = e => {
        var $handle = $(e.target);
        var group_id = $handle.parents("tr").data("gid");

        auth.getUserId(chrome_id => {
            var params = {
                action: "joinPublicGroup",
                chrome_id: chrome_id,
                group_id: group_id
            };
            var data = common.getDataString(params);
            // check if the group exist. If yes, join the group
            request.post(data, data => {
                if (data.flag) {
                    $handle
                        .removeClass("group-join green")
                        .addClass("group-leave red")
                        .html("Leave");
                    message.show(data.msg, "Success");
                } else {
                    message.show(data.msg, "Error");
                }
            });
        });
    };
    this.joinPrivateGroup = () => {
        var group_name = $("#tab-private-group #group_name").val();
        var group_password = $("#tab-private-group #group_password").val();
        if (group_name != "") {
            auth.getUserId(chrome_id => {
                var params = {
                    action: "joinPrivateGroup",
                    chrome_id: chrome_id,
                    group_name: group_name,
                    group_password: group_password
                };
                var data = common.getDataString(params);
                // check if the group exist. If yes, join the group
                request.post(data, data => {
                    if (data.flag) {
                        $(
                            "#tab-private-group #group_name, #tab-private-group #group_password"
                        ).val("");
                        this.fetchGroups();
                        message.show(data.msg, "Success");
                    } else {
                        message.show(data.msg, "Error");
                    }
                });
            });
        } else {
            message.show("Enter a groupname. Noob!", "Error");
        }
    };
    this.makeGroupDefault = selector => {
        var defaultGroup = $(selector).val();
        var name = $(selector).find("option:selected").text();
        storage.setItem("defaultGroup", defaultGroup);
        storage.setItem("defaultGroupName", name);
        message.show("Default group set to " + name, "Success");
        $("#group-display").html(storage.getItem("defaultGroupName"));
    };

    this.groupDDChanged = () => {
        var group_id = $("#settings #groups-dd").val();
        $(".editgroup-block").addClass("hide");
        var isAdmin = $("#settings #groups-dd option:selected").attr("admin");
        var admin_id = $("#settings #groups-dd option:selected").attr(
            "admin-id"
        );

        if (isAdmin == "true") {
            //allow this fellow to edit the group
            $("#edit-group").removeClass("hide");
            $("#rename-group-input").val(
                $("#settings #groups-dd option:selected").attr("name")
            );
        } else {
            $("#edit-group").addClass("hide");
            $("#rename-group-input").val("");
        }
        $("#group-users-block").addClass("hide");
        $("#group-users-table tbody").html("");

        if (group_id != "0" && isAdmin == "true") {
            auth.getUserId(chrome_id => {
                let params = {
                    group: group_id,
                    chrome_id: chrome_id,
                    action: "getGroupUsers"
                };
                var data = common.getDataString(params);
                request.get(data, data => {
                    var html = "";
                    data.forEach((item, i) => {
                        var $html = $("#users-template").clone().find("tbody");
                        var remove = item.id == admin_id ? "" : "remove";
                        html += $html
                            .html()
                            .replace("{NICKNAME}", item.nickname)
                            .replace("{USER_ID}", item.id)
                            .replace("{REMOVE}", remove)
                            .replace("{" + item.group_rights + "}", "checked")
                            .replace(new RegExp("{i}", "g"), i);
                    });
                    $("#group-users-table tbody").html(html);
                    $("#group-users-block").removeClass("hide");
                });
            });
        }
    };

    this.removeUserFromGroup = e => {
        var $handle = $(e.target).parents(".user-item");
        var user_id = $handle.data("id");
        var group_id = $("#settings #groups-dd").val();

        auth.getUserId(chrome_id => {
            var params = {
                user_id: user_id,
                group_id: group_id,
                action: "removeUserFromGroup",
                chrome_id: chrome_id
            };

            var data = common.getDataString(params);

            request.post(data, data => {
                if (data.flag) {
                    $handle.remove();
                    message.show(data.msg, "Success");
                } else {
                    message.show(data.msg, "Error");
                }
            });
        });
    };
    /**
     * Prints instructions if the default group is not set.
     * This is usually seen if the user is not logged in
     */
    this.groupNotSetMessage = () => {
        if (storage.getItem("defaultGroup") === null) {
            $(
                "#wall ul.items,#notifications ul.items,#favourites ul.items,#user-links ul.items"
            ).html(
                "- Login/register to get started<br>- You will automatically be a part of Global group. You can manage your groups from settings. <br>- All links will be displayed in a tab called <b>Wall</a>"
            );
        }
    };

    this.getAllPublicGroups = () => {
        auth.getUserId(chrome_id => {
            var params = {
                chrome_id: chrome_id,
                action: "getAllPublicGroups"
            };
            var data = common.getDataString(params);

            request.post(data, data => {
                var html = "";
                data.forEach(item => {
                    var status =
                        item.status == "1"
                            ? "<a href='#' class='red group-leave'>Leave</a>"
                            : "<a href='#' class='green group-join'>Join</a>";
                    html +=
                        "<tr data-gid=" +
                        item.id +
                        "> \
                                <td><strong>" +
                        item.name +
                        "</strong> <br/>" +
                        item.desc +
                        ".</td> \
                                <td>" +
                        item.group_rights +
                        "</td> \
                                <td>" +
                        item.total +
                        "</td> \
                                <td>" +
                        status +
                        "</td> \
                            </tr>";
                });

                $("#tab-public-group tbody").html(html);
            });
        });
    };

    this.editGroup = e => {
        $(e.target).addClass("hide");
        $(".editgroup-block").removeClass("hide");
        var $markup = $("#tab-create-group").clone(); //editgroup-block
        $markup.find("#create-group").remove();
        $("div.editgroup-block #editgroup-wrapper")
            .html($markup.html())
            .removeClass("hide");

        let $handle = $("#editgroup-wrapper");
        let $option = $("#tab-manage-group #groups-dd option:selected");

        //update group name
        $handle
            .find("#group_name")
            .val($option.text().replace("(admin)", "").trim());
        //update group desc //saha
        $handle.find("#group_desc").val($option.data("desc"));
        //update private/public visibility
        $(
            "#tab-manage-group #group-visibility .radio[value='" +
                $option.attr("is_public") +
                "']"
        ).attr("checked", "checked");
        //update public rights
        console.log($option.attr("group_rights"));
        $(
            "#tab-manage-group #group-rights .radio[value='" +
                $option.attr("group_rights") +
                "']"
        ).attr("checked", "checked");
    };
    this._editGroupSave = () => {
        var group_name = $("#rename-group-input").val();
        var group_id = $("#settings #groups-dd option:selected").val();

        auth.getUserId(chrome_id => {
            request.post(
                "name=" +
                    group_name +
                    "&group_id=" +
                    group_id +
                    "&chrome_id=" +
                    chrome_id +
                    "&action=editGroupSave",
                data => {
                    if (data.flag) {
                        $(".editgroup-block").addClass("hide");
                        message.show(data.msg, "Success");
                        $("#edit-group").removeClass("hide");
                        $("#groups-dd option[value='" + group_id + "']").html(
                            group_name + "(admin)"
                        );

                        if (storage.getItem("defaultGroup") == group_id) {
                            storage.setItem(
                                "defaultGroupName",
                                group_name + "(admin)"
                            );
                            $("#group-display").html(group_name + "(admin)");
                        }
                    } else {
                        //$("#edit-group").removeClass('hide');
                        message.show(data.msg, "Error");
                    }
                }
            );
        });
    };
}();
