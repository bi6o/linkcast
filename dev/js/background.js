/* ========================================================================
 * Background Page: This is a middleware to communicate between popup and
 * Content Script.
 * ======================================================================== */

/**
 * @param  Update noticcation count of the extension
 * @return {[type]}
 */
updateNotification = function(count) {
    count = count > 99 ? "99+" : count;
    chrome.browserAction.setBadgeText({ text: count.toString() });
};
/**
     * Retrieves site meta info
     * @param  {object}
     * @param  {Function} Callback function
     */
retrieveSiteMeta = function(passed_message, callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs[0] && tabs[0].id) {
            chrome.tabs.sendMessage(tabs[0].id, passed_message, function(
                response
            ) {
                callback(response);
            });
        }
    });
};

var countStore = 0;
var countData = { updateCount: 0, wallCount: 0, commentCount: 0 };
var endpoint =
    "http://playground.ajaxtown.com/youtube_chrome_backend/index.php";
//"http://localhost:8000";
// chrome.notifications.onClicked.addListener(function(notificationId, byUser) {
//     chrome.notifications.clear("notifyId");
// });
if (localStorage.getItem("richNotification") === null) {
    localStorage.setItem("richNotification", 1);
}
if (localStorage.getItem("sound") === null) {
    localStorage.setItem("sound", 1);
}
/**
 * This function is being called by the popup to get the notication count
 * for various tabs
 * @param  {Function} Callback function
 */
getNotificationCount = function(callback) {
    callback(countData);
    countData = { updateCount: 0, wallCount: 0, commentCount: 0 };
};

//Start polling
setInterval(function() {
    if (chrome && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.get("userid", function(items) {
            var userid = items.userid;
            var group = localStorage.getItem("defaultGroup");
            if (userid && group) {
                $.ajax({
                    url: endpoint,
                    data:
                        "group=" +
                        group +
                        "&action=getNotificationCount&chrome_id=" +
                        userid,
                    type: "GET",
                    timeout: 4000,
                    dataType: "json",
                    success: function(data) {
                        nData = data;
                        //data contains wallCount and updateCount
                        var totalCount =
                            parseInt(data.commentCount) +
                            parseInt(data.updateCount) +
                            parseInt(data.wallCount);
                        var views = chrome.extension.getViews({
                            type: "popup"
                        });

                        if (totalCount > countStore && views.length === 0) {
                            chrome.browserAction.setBadgeText({
                                text: totalCount.toString()
                            });

                            var sound = localStorage.getItem("sound");
                            var richNotification = localStorage.getItem(
                                "richNotification"
                            );

                            if (sound !== null && sound == "1") {
                                var yourSound = new Audio("../sound/noti.mp3");
                                yourSound.play();
                            }

                            if (
                                richNotification !== null &&
                                richNotification == "1"
                            ) {
                                var msg = "";
                                var itemList = [];
                                var linkCount =
                                    parseInt(data.updateCount) +
                                    parseInt(data.wallCount);
                                if (linkCount > 0) {
                                    msg +=
                                        linkCount +
                                        " new " +
                                        (linkCount > 1 ? "links" : "link");

                                    data.notifications.items.forEach(item => {
                                        itemList.push({
                                            message: "Link",
                                            title: item.title
                                        });
                                    });
                                }

                                if (data.commentCount > 0) {
                                    if (linkCount > 0) {
                                        msg += " and ";
                                    }
                                    msg += data.commentCount + " comments";
                                }

                                var options = {
                                    type: "list",
                                    message: "New Links posted",
                                    title: "You have " + msg + ".",
                                    iconUrl: chrome.runtime.getURL(
                                        "assets/notification.png"
                                    ),
                                    items: itemList.concat(
                                        data.notifications.comments
                                    )
                                };

                                if (chrome.notifications) {
                                    chrome.notifications.create(
                                        new Date().toString(),
                                        options
                                    );
                                }
                            }
                        }
                        countStore = totalCount;
                        countData = data;
                    }
                });
            }
        });
    }
}, 10000);

sendClickedStat = function(data) {
    $.ajax({
        url: endpoint,
        data: data,
        type: "POST"
    });
};

window.nData = {};
chrome.notifications.onClicked.addListener(t => {
    window.open(nData.notifications.items[0].url);
});

//update the version
updateVersion = function() {
    var manifest = chrome.runtime.getManifest();
    var version = manifest.version;

    /* Sometimes due to some x bug, user gets loggedout. This will make them login automatically. */
    chrome.storage.sync.get("userid", function(response) {
        if (response.userid) {
            //user has logged in once. check if the user purposely logged-out
            if (localStorage.getItem("loggedOut") != "true") {
                //login the user
                $.getJSON(
                    endpoint +
                        "?chrome_id=" +
                        response.userid +
                        "&action=fetchUserInfo",
                    function(result) {
                        localStorage.setItem("nickname", result.data.nickname);
                        localStorage.setItem("loggedIn", true);
                        localStorage.setItem("chrome_id", response.userid);
                        localStorage.setItem("richNotification", 1);
                        localStorage.setItem("sound", 1);
                        localStorage.setItem("theme", "dark");
                        localStorage.setItem("uid", result.data.id);
                        localStorage.setItem("defaultGroup", 1);
                        localStorage.setItem("defaultGroupName", "Global");
                    }
                );
            }
        }
    });

    var chrome_id = localStorage.getItem("chrome_id");
    if (chrome_id !== null) {
        $.ajax({
            url: endpoint,
            data:
                "version=" +
                version +
                "&chrome_id=" +
                chrome_id +
                "&action=updateUserVersion",
            type: "POST"
        });
    }
};
/**
     * If the extension is installed or updated, update the version
     * in the server
     */
chrome.runtime.onInstalled.addListener(function(details) {
    updateVersion();
});

/**
 * Check for updates every 2 hours
 */
setInterval(function() {
    if (
        chrome.runtime &&
        typeof chrome.runtime.requestUpdateCheck === "function"
    ) {
        chrome.runtime.requestUpdateCheck(function() {});
    }
}, 1000 * 3600 * 2);
