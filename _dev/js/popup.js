/* ========================================================================
 * @title - Share news, articles and music with your friends
 * @author - Abhishek Saha
 * @description - This is the main engine that takes care of everything
 * ======================================================================== */
window.$ = require("jquery");
window.jQuery = $;
require("bootstrap");
window.moment = require("moment");

const storage = require("./popup/storage");
const request = require("./popup/request");
const common = require("./common/common");
const item = require("./popup/item");
const group = require("./popup/group");
const user = require("./popup/user");
const auth = require("./popup/auth");
const comments = require("./popup/comments");
const likes = require("./popup/likes");
const notification = require("./popup/notification");

var plugin = () => {
    /**
     * Private object containing the whole al =>ity of the plugin
     * @type {object}
     */
    var main = {
        /**
         * Holds the background page link
         * @type {String}
         */
        bgPage: null,

        /**
         * Future purpose
         * @type {Number}
         */
        edit: 0,

        /**
         * Timer to ping the background page for notifications
         * @type {Number}
         */
        noticationIntervalTimer: 0,

        /**
         * Start the engine
         * @return {null}
         */
        init: () => {
            main.bgPage = chrome.extension.getBackgroundPage();
            main._addEventListeners();
            var manifest = chrome.runtime.getManifest();
            var version = manifest.version;
            $(".version").html(version);
            main.setTheme();

            user.userExist(result => {
                if (!result.flag) {
                    /* If user does not exist or not logged in show settings tab */
                    $('a[data-target="#settings"]').click();
                    $("#loader").remove();
                    $(".authorized").addClass("hide");
                    /*The wall and update tab should show a message asking the user what to do*/
                    group.groupNotSetMessage();
                } else {
                    main._detectSite();
                    $(".authorized").removeClass("hide");
                    user.info = result.data;

                    item.fetchItems("#wall", "html", null);

                    group.fetchGroups();
                    main._activateScroll();
                    main._resetNotification();

                    /* If the user is logged in, show a welcome message */
                    user.welcomeUser(result.data.nickname);

                    /* Show which group the user is connected to */
                    $("#group-display").html(
                        storage.getItem("defaultGroupName")
                    );

                    /* Show notifications */
                    notification.getNotifications();
                    // main.noticationIntervalTimer = setInterval(
                    //     main._updateNotificationCount,
                    //     2000
                    // );
                }
            });
        },
        /**
         * Event listeners
         */
        _addEventListeners: () => {
            var self = main;

            $("button.register-btn").click(self.registerUser);
            $("button.login-btn").click(self.loginUser);

            $("#tab-create-group #create-group").click(group.createEditGroup);
            $("#edit-group-save-btn").click(group.createEditGroup);
            $("#join-group").click(group.joinPrivateGroup);

            $("#add-item button").click(item.addItem);
            $("#default-group").click(() => {
                group.makeGroupDefault("#settings #groups-dd");
            });
            $(document).on("click", ".favourite", item.makeFavourite);
            $(document).on("click", ".delete-item", item.deleteItem);
            $(document).on("click", ".comments-item", comments.showComments);
            $(document).on("click", ".item-link", item.itemClicked);
            $(document).on("click", ".likes-item", likes.likeClicked);
            $(document).on("click", ".forward-item", item.itemForward);
            $("#settings #groups-dd").on("change", group.groupDDChanged);
            $("#linkcast-web").click(function(e) {
                e.preventDefault();
                var link = `chrome-extension://${chrome.runtime.id}/popup.html`;
                window.open(link);
            });
            $(document).on("click", ".title", e => {
                e.preventDefault();
                var item_id = $(e.target).data("id");
                item.getItem(item_id, user.info.id, (html, title) => {
                    $("#item-modal .items").html(html);
                    $("#item-modal .modal-title").html(title);
                    common.lazyLoadImages($("#item-modal .items .lazy"));
                    $("#item-modal").modal();
                });
            });
            $(document).on(
                "keyup",
                ".comment-input",
                comments.sendComment.bind(this)
            );

            $("#wall #groups-dd").on("change", () => {
                group.makeGroupDefault("#wall #groups-dd");
                item.fetchItems("#wall", "html", null);
            });

            $('a[data-toggle="tab"]').on("shown.bs.tab", self._tabChanged);

            $("#edit-group").click(group.editGroup);
            $("#edit-group-cancel-btn").click(() => {
                $("#edit-group").removeClass("hide");
                $(".editgroup-block").addClass("hide");
            });
            $("#settings").on("click", "#logout", auth.logout);
            $(document).on("click", "#group-visibility .radio", e => {
                var visibility = $(e.target).val();
                if (visibility == "0") {
                    $(".tab-pane.active #group-private").removeClass("hide");
                } else {
                    $(".tab-pane.active #group-private").addClass("hide");
                }
            });
            $("#tab-manage-group").on(
                "click",
                ".remove-user",
                group.removeUserFromGroup
            );
            $("#tab-manage-group").on(
                "click",
                ".user-item .radio",
                user.changePublicRights
            );

            $("#tab-public-group").on(
                "click",
                ".group-join",
                group.joinPublicGroup
            );
            $("#tab-public-group").on(
                "click",
                ".group-leave",
                group.leaveGroup
            );
            $("#tab-customize #sound-setting .radio").click(e => {
                storage.setItem("sound", $(e.target).val());
            });
            $("#tab-customize #theme-setting .radio").click(e => {
                storage.setItem("theme", $(e.target).val());
                self.setTheme();
            });
            $("#tab-customize #rich-notification .radio").click(e => {
                storage.setItem("richNotification", $(e.target).val());
            });
            $("#tab-customize #sound-setting .radio").click(e => {
                storage.setItem("sound", $(e.target).val());
            });
            /**
             * Not allowing user to update username.
             * Maybe a future release
             */
            // $("#settings").on('click','#edit-uname', () =>{
            //     $("#edit-name-block").removeClass('hide');
            // })

            // $("#update-uname-btn").click(self._updateUsername);
        },
        setTheme: () => {
            var theme = storage.getItem("theme");
            if (theme != null) {
                $("#theme").attr("href", "css/themes/" + theme + ".css");
                $("body").removeAttr("class").addClass(theme);
            }
        },

        /**
         * Triggers when a tab is changed
         * @param  {event}
         */
        _tabChanged: e => {
            e.preventDefault();
            var target = $(e.target).data("target"); // activated tab
            item.page = 1;

            $("ul.items").html('<div id="loader" class="cssload-aim"></div>');

            user.userExist(result => {
                if (!result.flag) {
                    group.groupNotSetMessage();
                } else {
                    const targets = [
                        "#feed",
                        "#updates",
                        "#comments",
                        "#user-links",
                        "#favourites"
                    ];

                    if (targets.indexOf(target) !== -1) {
                        if (target === "#feed") {
                            target = "#wall";
                        }
                        item.fetchItems(target, "html", null);
                    } else if (target === "#notifications") {
                        notification.getNotifications();
                    } else if (target === "#about") {
                        main._getRandomQuote();
                    } else if (target === "#settings") {
                        group.fetchGroups();
                        var theme = storage.getItem("theme");
                        var sound = storage.getItem("sound");
                        var richNotification = storage.getItem(
                            "richNotification"
                        );
                        if (theme !== null) {
                            $(
                                "#tab-customize #theme-setting .radio[value='" +
                                    theme +
                                    "']"
                            ).attr("checked", "checked");
                        }
                        if (richNotification !== null) {
                            $(
                                "#tab-customize #rich-notification .radio[value='" +
                                    richNotification +
                                    "']"
                            ).attr("checked", "checked");
                        }
                        if (sound !== null) {
                            $(
                                "#tab-customize #sound-setting .radio[value='" +
                                    sound +
                                    "']"
                            ).attr("checked", "checked");
                        }
                    } else if (target === "#add-item") {
                        group.fetchGroups();
                    } else if (target === "#tab-public-group") {
                        group.getAllPublicGroups();
                    } else if (target === "#tab-join-public-group") {
                        group.getAllPublicGroups();
                    }
                }
            });
        },

        /**
         * Detects if the active chrome tab is youtube or soudcloud
         */
        _detectSite: () => {
            chrome.tabs.query({ currentWindow: true, active: true }, function(
                tabs
            ) {
                //var url = tabs[0].url;

                var payload = { action: "get-meta" };

                main.bgPage.retrieveSiteMeta(payload, data => {
                    if (data && data.url) {
                        $("#item-name").val(data.title);
                        $("#item-url").val(data.url);
                        $("#item-thumb").val(data.thumbUrl);
                    }
                });
            });
        },
        /**
         * Reset the extension notification count to 0
         */
        _resetNotification: () => {
            auth.getUserId(chrome_id => {
                var group = storage.getItem("defaultGroup");

                if (group !== null) {
                    var params = {
                        group: group,
                        chrome_id: chrome_id,
                        action: "resetNotification"
                    };
                    var data = common.getDataString(params);
                    request.get(data);
                    main.bgPage.updateNotification(0);
                }
            });
        },
        /**
         * Update the notification count of the tabs
         */
        _updateNotificationCount: () => {
            main.bgPage.getNotificationCount(data => {
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
                notification.fetchNotifications(
                    "#notifications",
                    "prepend",
                    null,
                    null
                );

                $("#notifications ul.items").html(items);
            });
        },

        _activateScroll: () => {
            var $panels = $(
                "#wall .panel-body, #updates .panel-body, #favourites .panel-body, #user-links .panel-body"
            );

            $panels.scroll(e => {
                var height = $(e.target).innerHeight();
                var scroll_top = $(e.target).scrollTop();
                var scrollHeight = $(e.target)[0].scrollHeight;

                var loading = true;
                var handle = $("#myTab .active a").data("target");
                if (scroll_top + height == scrollHeight && loading === true) {
                    item.page++;
                    if (item.page <= item.totalPages) {
                        item.fetchItems(handle, "append", null, html => {
                            loading = false;
                        });
                    }
                }
                e.stopPropagation();
                e.preventDefault();
                return false;
            });
        },

        /**
         * Register a new user.
         */
        registerUser: () => {
            auth.getUserId(chrome_id => {
                var params = {
                    chrome_id: chrome_id,
                    nickname: $("#nickname").val(),
                    password: $("#password").val(),
                    action: "registerUser"
                };
                auth.register(params, data => {
                    user.welcomeUser(params.nickname);
                    user.afterLogin(data);
                    main.bgPage.updateVersion();
                });
            });
        },
        /**
         * Login
         */
        loginUser: () => {
            auth.getUserId(chrome_id => {
                var params = {
                    chrome_id: chrome_id,
                    nickname: $("#nickname").val(),
                    password: $("#password").val(),
                    action: "loginUser"
                };
                auth.login(params, data => {
                    user.welcomeUser(params.nickname);
                    user.afterLogin(data);
                    main.bgPage.updateVersion();
                });
            });
        },
        _getRandomQuote: () => {
            var params = {
                action: "getQuote"
            };
            var data = common.getDataString(params);
            request.get(data, response => {
                $("#random_quote").html(
                    `<p class='ext-center'>${response.quote}<br/>&dash; ${response.author} &dash;</p>`
                );
            });
        }
    };

    return {
        init: main.init
    };
};

/**
 * Start the plugin
 */
var instance = plugin();
$(document).ready(instance.init);
