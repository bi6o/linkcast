module.exports = {
    /**
     * Display messages
     * @param  {String} Message
     * @param  {String} Type of message Error/Success/Warning
     */
    show: (msg, type) => {
        $("#msg").html(`<strong>${type}</strong>: ${msg}`).removeClass("hide");
        setTimeout(function() {
            $("#msg").addClass("hide");
        }, 3000);
    }
}