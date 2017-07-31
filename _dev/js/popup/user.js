const message = require("./message");
const auth = require("./auth");
const storage = require("./storage");
const request = require("./request");
const group = require("./group");
const common = require("../common/common");
const user = new function() {
    this.info = {};
    /**
     * Greets the user
     * @param  {String}
     */
    this.welcomeUser = nickname => {
        var logout = '<a href="#" id="logout">Logout</a>';
        var edit = '<a href="#" id="edit-uname">Edit</a>';
        $(".status").html(
            "Connected as <strong>" + nickname + "</strong>, " + logout
        );
        $("#edit-uname-input").val(nickname);
        $(".step1").hide();
    };
    /**
     * Some post processing after login/registration
     */
    this.afterLogin = data => {
        if (data.defaultGroup) {
            storage.setItem("defaultGroup", data.defaultGroup);
            storage.setItem("defaultGroupName", data.defaultGroupName);
            storage.setItem("uid", data.uid);
            $("#group-display").html(data.defaultGroupName);
            group.fetchGroups();
        }
    };
    /**
     * Updates username. But lets not allow user to do this.
     */
    this._updateUsername = e => {
        var nickname = $(e.target).val();
        if (name != "") {
            auth.getUserId(chrome_id => {
                var params = {
                    nickname: nickname,
                    action: "updateUsername",
                    chrome_id: chrome_id
                };

                var data = common.getDataString(params);
                request.get(data, data => {
                    if (data.flag) {
                        message.show(data.msg, "Success");
                    } else {
                        message.show(data.msg, "Error");
                    }
                });
            });
        }
    };

    this.changePublicRights = e => {
        var $handle = $(e.target).parents(".user-item");
        var user_id = $handle.data("id");
        var group_id = $("#settings #groups-dd").val();
        var group_rights = $(e.target).val();

        auth.getUserId(chrome_id => {
            var params = {
                user_id: user_id,
                group_id: group_id,
                action: "changePublicRights",
                chrome_id: chrome_id,
                group_rights: group_rights
            };

            var data = common.getDataString(params);

            request.post(data, data => {
                if (data.flag) {
                    message.show(data.msg, "Success");
                } else {
                    message.show(data.msg, "Error");
                }
            });
        });
    };

    /**
     * Check if the user exist.
     * @param  {Function} Callback function
     */
    this.userExist = callback => {
        var data = { flag: 0 };
        if (storage.getItem("loggedIn") === null) {
            callback(data);
        } else {
            //get the userid and check in the server
            auth.getUserId(chrome_id => {
                var params = {
                    chrome_id: chrome_id,
                    action: "fetchUserInfo"
                };

                var data = common.getDataString(params);

                request.get(data, response => {
                    callback(response);
                });
            });
        }
    };
}();

module.exports = user;
