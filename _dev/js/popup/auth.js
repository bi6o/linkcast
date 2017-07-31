const request = require("./request");
const storage = require("./storage");
const message = require("./message");
const common = require("../common/common");

module.exports = new function() {
    this.login = (params, callback) => {
        if (params.nickname.length > 0 && params.password.length > 0) {
            let data = common.getDataString(params);
            request.post(data, data => {
                if (data.flag) {
                    //store some basic information in the localStorage
                    storage.setItem("nickname", params.nickname);
                    storage.setItem("loggedIn", true);
                    storage.setItem("chrome_id", data.chrome_id);
                    chrome.storage.sync.set({ userid: data.chrome_id });
                    $(".authorized").removeClass("hide");
                    if (typeof callback === "function") {
                        callback(data);
                    }
                } else {
                    message.show(data.msg, "Error");
                }
            });
        }
    };

    // handle registration
    this.register = (params, callback) => {
        if (params.nickname.length > 0 && params.password.length > 0) {
            let data = common.getDataString(params);

            request.post(data, data => {
                if (data.flag) {
                    storage.setItem("nickname", params.nickname);
                    storage.setItem("loggedIn", true);
                    storage.setItem("chrome_id", data.chrome_id);
                    $(".authorized").removeClass("hide");
                    if (typeof callback === "function") {
                        callback(data);
                    }
                } else {
                    message.show(data.msg, "Error");
                }
            });
        }
    };

    /**
     * Logout a user
     */
    this.logout = () => {
        //Remove all information from the local store.
        $(".authorized").addClass("hide");
        storage.clearAll();
        storage.setItem("loggedOut", true);
        $(".status").html("");
        $(".step1").show();
        $("#groups-dd").html("<option value='0'>Select</option>");
        $("#group-display").html("");
    };
    /**
     * Checks if the user id exist. If not, it assigns a new user id
     * @param  {Function} Callback function
     */
    this.getUserId = callback => {
        var chrome_id = storage.getItem("chrome_id");
        if (chrome_id != null) {
            callback(chrome_id);
        } else {
            let userid = common.getRandomToken();
            chrome.storage.sync.set({ userid: userid }, function() {
                callback(userid);
            });
        }
    };
}();
