module.exports = {
    /**
     * Display messages
     * @param  {String} Message
     * @param  {String} Type of message Error/Success/Warning
     */
    show: (msg, type) => {
        $("#msg")
            .html(
                `<div class="alert alert-dismissible alert-${type}">
                    ${msg}
                </div>`
            )
            .removeClass("hide");
        setTimeout(function() {
            $("#msg").addClass("hide");
        }, 2000);
    }
};
