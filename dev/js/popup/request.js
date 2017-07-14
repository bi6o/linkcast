const storage = require("./storage");
const config = require("../../config");
const request = new function() {
    this._sendRequest = (type, data, callback) => {
        $.ajax({
            url: config.getEndpoint(),
            type: type,
            data: data,
            timeout: 4000,
            dataType: "json",
            success: callback,
            error: function(jXHR) {
                if (jXHR.status != 200) {
                    $(".items").html(
                        "Hey " +
                            storage.getItem("nickname") +
                            ", wait, server is busy :( Please try after sometime!"
                    );
                }
            }
        });
    };

    this.post = (data, callback) => {
        this._sendRequest("POST", data, callback);
    };

    this.get = (data, callback) => {
        this._sendRequest("GET", data, callback);
    };
}();
module.exports = request;
