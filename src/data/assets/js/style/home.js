var can_send_msg = false;

function SetSizes() {
    //get ScreenDimentions
    WinX = window.innerWidth;
    WinY = window.innerHeight;
    WinXp = WinX / 100;
    WinYp = WinY / 100;

    //get IDS
    const cc_in = document.getElementById("cc_in").style;
    const cc_in_text = document.getElementById("cc_in_text").style;
    const ss_header = document.getElementById("ss_header").style;
    const server_img = document.querySelectorAll(".server_img");
    const server_name = document.querySelectorAll(".server_name");
    const server_meta = document.querySelectorAll(".server_meta");
    const ss_group = document.querySelectorAll(".ss_group");
    const ss_server = document.querySelectorAll(".server");
    const SettingTab = document.querySelectorAll(".SettingTab");
    const MessageDIV_C = document.querySelectorAll(".MessageDIV-C");
    const cc_in_enter = document.getElementById("cc_in_enter").style;
    const cc_out = document.getElementById("cc_out").style;

    MessageDIV_C.forEach((MessageDIV_C) => {
        MessageDIV_C.style.left = WinXp * 98 - MessageDIV_C.clientWidth + "px";
    });
}



function postRequest(url, params) {
    let formData = new FormData();
    for (let key = 0; key < params.length; key++) {
        formData.append(params[key][0], params[key][1]);
    }

    let response = fetch(url, {
        body: formData,
        method: "post",
    });

    return response;
}

function getRequest(url) {
    let response = fetch(url, {
        method: "get",
    });

    return response;
}

function updateCCout() {
    document.getElementById("cc_out").scrollTop =
        document.getElementById("cc_out").scrollHeight;
    SetSizes();
}

async function SendMessage() {
    const cc_in_text = document.getElementById("cc_in_text");
    if (!can_send_msg || cc_in_text.value == "") {
        return;
    }

    // Remove ∅ symbol
    msg_content = cc_in_text.value.replace("∅", "");
    cc_in_text.value = "";

    // Word replacement
    let wr = await getRequest("/GetWR").then((data) => data.text());
    let wrs = wr.split("\n");
    for (var i = 0; i < wrs.length; i++) {
        let wrss = wrs[i].trim().split(">>");
        if (wrss.length == 2) {
            wrss[0] = wrss[0].slice(1, -1);
            wrss[1] = wrss[1].slice(1, -1);

            if (msg_content == wrss[0]) {
                msg_content = "∅" + wrss[1];
            }
        }
    }

    // Send message
    postRequest("/SendMsg", [
        ["content", msg_content]
    ]);
}

function logOut() {
    // Delete cookies
    document.cookie.split(";").forEach(function(c) {
        document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    // Go to login page
    location.replace("/login.html");
}

let hamburger_open = false;

function hamburger_clicked() {
    document.getElementById("ss_hamburger").style.backgroundColor = ""
    hamburger_open = !hamburger_open;
    if (hamburger_open == true) {
        document.getElementById("sselect").style.animation =
            "hamburger-slide 0.3s linear";
        document.getElementById("sselect").style.left = "0%";
        document.getElementById("SS_SmokeScreen").style.visibility = "visible";
        document.getElementById("SS_SmokeScreen").style.color = "rgba(0,0,0,0)";
        document.getElementById("SS_SmokeScreen").animation = "smoke 0.3s linear";
    } else {
        document.getElementById("sselect").style.animation =
            "hamburger-slide-r 0.3s linear";
        document.getElementById("sselect").style.left = "-80vh";
        document.getElementById("SS_SmokeScreen").animation = "smoke-r 0.3s linear";
        document.getElementById("SS_SmokeScreen").style.visibility = "hidden";
    }
};

let SettingsSelectedTab = "User";
let ProfileSelectedTab = "Profile";
UP_clicked = function() {
    window.scrollTo(0, 0);
}
home_clicked = function() {

    location.reload();
}

settings_clicked = function() {
    var Tab_SettingsUser = document.getElementById("SettingsUser").style;
    var Tab_SettingsGeneral = document.getElementById("SettingsGeneral").style;
    var Tab_SettingsAdvanced = document.getElementById("SettingsAdvanced").style;

    var SmokeScreen = document.getElementById("SmokeScreen").style;
    var Settings = document.getElementById("Settings").style;

    Tab_SettingsUser.display = "none";
    Tab_SettingsGeneral.display = "none";
    Tab_SettingsAdvanced.display = "none";
    if (SettingsSelectedTab == "User") {
        Tab_SettingsUser.display = "block";
    }
    if (SettingsSelectedTab == "General") {
        Tab_SettingsGeneral.display = "block";
    }
    if (SettingsSelectedTab == "Advanced") {
        Tab_SettingsAdvanced.display = "block";
    }

    document.getElementById("SettingTabUser").style.backgroundColor =
        "var(--SecondaryBG)";
    document.getElementById("SettingTabUser").style.color = "var(--PrimaryFG)";
    document.getElementById("SettingTabGeneral").style.backgroundColor =
        "var(--SecondaryBG)";
    document.getElementById("SettingTabGeneral").style.color = "var(--PrimaryFG)";
    document.getElementById("SettingTabAdvanced").style.backgroundColor =
        "var(--SecondaryBG)";
    document.getElementById("SettingTabAdvanced").style.color =
        "var(--PrimaryFG)";

    document.getElementById(
        "SettingTab" + SettingsSelectedTab
    ).style.backgroundColor = "var(--PrimaryFG)";
    document.getElementById("SettingTab" + SettingsSelectedTab).style.color =
        "var(--SecondaryBG)";

    SmokeScreen.background = "rgba(0,0,0,0)";
    SmokeScreen.visibility = "visible";
    SmokeScreen.animation = "smoke 0.3s linear";
    Settings.animation = "settings-slide 0.3s linear";
    Settings.bottom = "5vh";

    SmokeScreen.background = "rgba(0,0,0,0.5)";
};

CloseSettings_clicked = function() {
    var Settings = document.getElementById("Settings").style;
    var SmokeScreen = document.getElementById("SmokeScreen").style;
    SmokeScreen.animation = "smoke-r 0.5s linear";
    Settings.animation = "settings-slide-r 0.3s linear";
    Settings.bottom = "-100vh";
    SmokeScreen.visibility = "hidden";
};

user_clicked = function() {
    var Tab_SettingsProfile = document.getElementById("SettingsProfile").style;
    var Tab_SettingsFriends = document.getElementById("SettingsFriends").style;

    var SmokeScreen = document.getElementById("SmokeScreen").style;
    var Settings = document.getElementById("User").style;

    Tab_SettingsProfile.display = "none";
    Tab_SettingsFriends.display = "none";
    if (ProfileSelectedTab == "Profile") {
        Tab_SettingsProfile.display = "block";
    }
    if (ProfileSelectedTab == "Friends") {
        Tab_SettingsFriends.display = "block";
    }

    document.getElementById("SettingProfile").style.backgroundColor =
        "var(--SecondaryBG)";
    document.getElementById("SettingProfile").style.color = "var(--PrimaryFG)";
    document.getElementById("SettingFriends").style.backgroundColor =
        "var(--SecondaryBG)";
    document.getElementById("SettingFriends").style.color = "var(--PrimaryFG)";

    document.getElementById(
        "Setting" + ProfileSelectedTab
    ).style.backgroundColor = "var(--PrimaryFG)";
    document.getElementById("Setting" + ProfileSelectedTab).style.color =
        "var(--SecondaryBG)";

    SmokeScreen.background = "rgba(0,0,0,0)";
    SmokeScreen.visibility = "visible";
    SmokeScreen.animation = "smoke 0.3s linear";
    Settings.animation = "settings-slide 0.3s linear";
    Settings.bottom = "5vh";

    SmokeScreen.background = "rgba(0,0,0,0.5)";
};

CloseFriends_clicked = function() {
    var Settings = document.getElementById("User").style;
    var SmokeScreen = document.getElementById("SmokeScreen").style;
    SmokeScreen.animation = "smoke-r 0.5s linear";
    Settings.animation = "settings-slide-r 0.3s linear";
    Settings.bottom = "-100vh";
    SmokeScreen.visibility = "hidden";
};

let xhr = new XMLHttpRequest();

function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(";");
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == " ") {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

async function loadFriends() {
    var friends = await getRequest("/GetFriends", []).then((data) => data.json());
    friends = friends["friends"];
    var friend_box = document.getElementById("Friends");
    friend_box.innerHTML = "";
    for (var i = 0; i < friends.length; i++) {
        var friend = friends[i];
        const pfp = await postRequest("/GetPfp", [
            ["target", friend]
        ]).then((pfp) =>
            pfp.text()
        );
        friend_box.innerHTML +=
            "<div id=\"" +
            friend +
            "\" onclick=\"OpenServer('" +
            friend +
            '\'); hamburger_clicked()" class="server"><img class="server_img" src="' +
            pfp +
            '"><div style="display: flex;flex-direction: column;"><div class="server_name">' +
            friend +
            "</div><a class=\"server_meta\">Your Friend</a></div></div>";
    }
}

async function addFriend() {
    await postRequest("/AddFriend", [
        ["username", document.getElementById("AddFriendUsername").value],
    ]).then((res) => {
        res.text().then((text) => {
            document.getElementById("addFriendStatus").innerHTML =
                "<p>" + text + "</p>";
            loadFriends();
        });
    });
}

async function ReverseWR(msg) {
    if (msg["content"].startsWith("∅")) {
        let wr = await getRequest("/GetWR").then((data) => data.text());
        let wrs = wr.split("\n");
        for (var i = 0; i < wrs.length; i++) {
            let wrss = wrs[i].trim().split(">>");
            if (wrss.length == 2) {
                wrss[0] = wrss[0].slice(1, -1);
                wrss[1] = wrss[1].slice(1, -1);
                if (msg["content"] == "∅" + wrss[1]) {
                    msg["content"] = wrss[0];
                }
            }
        }
    }
}

var msg_stream = null;

OpenServer = async function(target) {
    var server = document.getElementById(target)
    if (server != null) {
        server.style.backgroundColor = ""
    }
    await postRequest("/GetChat", [
            ["target", target]
        ])
        .then((data) => data.json())
        .then((data) => {
            document.getElementById("ServerHeadName").innerHTML = data["name"];
            postRequest("/GetPfp", [
                    ["target", data["name"]]
                ])
                .then((data) => data.text())
                .then((pfp) => {
                    document.getElementById("chat_img").src = pfp;
                    document.getElementById("chat_img").style.display = "";
                });
            getRequest("/GetWR")
                .then((data) => data.text())
                .then((wr) => {
                    messages = data["messages"];
                    document.getElementById("cc_out").innerHTML = "";
                    for (let msgid = 0; msgid < messages.length; msgid++) {
                        if (messages[msgid][0] == getCookie("USER")) {
                            // need lucas to make this async

                            if (messages[msgid][3].startsWith("∅")) {
                                let wrs = wr.split("\n");
                                sucRep = false;
                                for (var i = 0; i < wrs.length; i++) {
                                    let wrss = wrs[i].trim().split(">>");
                                    if (wrss.length == 2) {
                                        wrss[0] = wrss[0].slice(1, -1);
                                        wrss[1] = wrss[1].slice(1, -1);
                                        if (messages[msgid][3] == "∅" + wrss[1]) {
                                            messages[msgid][3] = wrss[0];
                                            sucRep = true;
                                        }
                                    }
                                }
                                if (sucRep == false) {
                                    messages[msgid][3] = messages[msgid][3].slice(1);
                                }
                            }
                            var msg_box = document.createElement("div");
                            msg_box.className = "MessageCONTENT";
                            msg_box.appendChild(document.createTextNode(messages[msgid][3]));
                            document.getElementById("cc_out").innerHTML +=
                                '<div id="' +
                                msgid +
                                '" class="MessageDIV-C">' +
                                msg_box.outerHTML +
                                '<div class="MessageMETA">' +
                                messages[msgid][1] +
                                "</div></div>";
                        } else {
                            var msg_box = document.createElement("div");
                            msg_box.className = "MessageCONTENT";
                            messages[msgid][3] = messages[msgid][3].replace("∅", "");
                            msg_box.appendChild(document.createTextNode(messages[msgid][3]));
                            document.getElementById("cc_out").innerHTML +=
                                '<div id="' +
                                msgid +
                                '" class="MessageDIV-F">' +
                                msg_box.outerHTML +
                                '<div class="MessageMETA">' +
                                messages[msgid][1] +
                                "</div></div>";
                        }
                    }

                    updateCCout();
                });
        });

    can_send_msg = true;

    if (msg_stream != null) {
        msg_stream.close();
    }

    let notification_audio = new Audio("/en/assets/audio/notification.mp3");

    msg_stream = new EventSource("/MsgStream");
    msg_stream.onmessage = async(event) => {
        msg = JSON.parse(event.data);
        if (msg["sender"] == getCookie("USER")) {
            if (msg["content"].startsWith("∅")) {
                let wr = await getRequest("/GetWR").then((data) => data.text());
                let wrs = wr.split("\n");
                sucRep = false;
                for (var i = 0; i < wrs.length; i++) {
                    let wrss = wrs[i].trim().split(">>");
                    if (wrss.length == 2) {
                        wrss[0] = wrss[0].slice(1, -1);
                        wrss[1] = wrss[1].slice(1, -1);
                        if (msg["content"] == "∅" + wrss[1]) {
                            msg["content"] = wrss[0];
                            sucRep = true;
                        }
                    }
                }
                if (sucRep == false) {
                    msg["content"] = msg["content"].slice(1);
                }
            }
            var msg_box = document.createElement("div");
            msg_box.className = "MessageCONTENT";
            msg_box.appendChild(document.createTextNode(msg["content"]));
            document.getElementById("cc_out").innerHTML +=
                '<div class="MessageDIV-C">' +
                msg_box.outerHTML +
                '<div class="MessageMETA">' +
                msg["time"] +
                "</div></div>";
        } else if (msg["sender"] == target) {
            if (!document.hasFocus()) {
                notification_audio.play();
            }
            if (msg["content"].startsWith("∅")) {
                msg["content"] = msg["content"].replace("∅", "");
            }
            var msg_box = document.createElement("div");
            msg_box.className = "MessageCONTENT";
            msg_box.appendChild(document.createTextNode(msg["content"]));
            document.getElementById("cc_out").innerHTML +=
                '<div class="MessageDIV-F">' +
                msg_box.outerHTML +
                '<div class="MessageMETA">' +
                msg["time"] +
                "</div></div>";
        } else {
            var sender = document.getElementById(msg["sender"])
            if (sender != null) {
                sender.style.backgroundColor = "var(--PrimaryFG)"
                sender.style.color = "var(--PrimaryBG)"
                document.getElementById("ss_hamburger").style.backgroundColor = "var(--PrimaryBG)"
                notification_audio.play();
            }
        }
        SetSizes();
        updateCCout();
    };

    SetSizes();
};

function fFtab(tab) {
    ProfileSelectedTab = tab;

    var Tab_SettingsProfile = document.getElementById("SettingsProfile").style;
    var Tab_SettingsFriends = document.getElementById("SettingsFriends").style;

    Tab_SettingsProfile.display = "none";
    Tab_SettingsFriends.display = "none";
    if (ProfileSelectedTab == "Profile") {
        Tab_SettingsProfile.display = "block";
    }
    if (ProfileSelectedTab == "Friends") {
        Tab_SettingsFriends.display = "block";
    }

    document.getElementById("SettingProfile").style.backgroundColor =
        "var(--SecondaryBG)";
    document.getElementById("SettingProfile").style.color = "var(--PrimaryFG)";
    document.getElementById("SettingFriends").style.backgroundColor =
        "var(--SecondaryBG)";
    document.getElementById("SettingFriends").style.color = "var(--PrimaryFG)";

    document.getElementById(
        "Setting" + ProfileSelectedTab
    ).style.backgroundColor = "var(--PrimaryFG)";
    document.getElementById("Setting" + ProfileSelectedTab).style.color =
        "var(--SecondaryBG)";
}

function fStab(tab) {
    SettingsSelectedTab = tab;

    var Tab_SettingsUser = document.getElementById("SettingsUser").style;
    var Tab_SettingsGeneral = document.getElementById("SettingsGeneral").style;
    var Tab_SettingsAdvanced = document.getElementById("SettingsAdvanced").style;

    Tab_SettingsUser.display = "none";
    Tab_SettingsGeneral.display = "none";
    Tab_SettingsAdvanced.display = "none";
    if (SettingsSelectedTab == "User") {
        Tab_SettingsUser.display = "block";
    }
    if (SettingsSelectedTab == "General") {
        Tab_SettingsGeneral.display = "block";
    }
    if (SettingsSelectedTab == "Advanced") {
        Tab_SettingsAdvanced.display = "block";
    }

    document.getElementById("SettingTabUser").style.backgroundColor =
        "var(--SecondaryBG)";
    document.getElementById("SettingTabUser").style.color = "var(--PrimaryFG)";
    document.getElementById("SettingTabGeneral").style.backgroundColor =
        "var(--SecondaryBG)";
    document.getElementById("SettingTabGeneral").style.color = "var(--PrimaryFG)";
    document.getElementById("SettingTabAdvanced").style.backgroundColor =
        "var(--SecondaryBG)";
    document.getElementById("SettingTabAdvanced").style.color =
        "var(--PrimaryFG)";

    document.getElementById(
        "SettingTab" + SettingsSelectedTab
    ).style.backgroundColor = "var(--PrimaryFG)";
    document.getElementById("SettingTab" + SettingsSelectedTab).style.color =
        "var(--SecondaryBG)";
}

onload = async function() {
    document.getElementById("WelcomeName").innerHTML =
        "Welcome " + getCookie("USER");
    can_send_msg = false;

    postRequest("/GetPfp", [
            ["target", getCookie("USER")]
        ])
        .then((data) => data.text())
        .then((data) => {
            var pfps = document.getElementsByClassName("pfp");
            for (var i = 0; i < pfps.length; i++) {
                pfps.item(i).src = data;
            }
        });
    getRequest("/GetWR")
        .then((data) => data.text())
        .then((data) => {
            document.getElementById("WRTxtBox").innerHTML = data;
        });

    loadFriends();
};

onresize = function() {
    SetSizes();
};

document.onkeypress = function(evt) {
    evt = evt || window.event;
    var charCode = evt.keyCode || evt.which;
    var charStr = String.fromCharCode(charCode);
    if (document.activeElement.id == "cc_in_text") {
        if (charCode == 13) {
            SendMessage();
        }
    } else if (
        document.activeElement != "[object HTMLInputElement]" &&
        document.activeElement != "[object HTMLTextAreaElement]"
    ) {
        if (charStr == ",") {
            settings_clicked();
        } else if (charStr == ".") {
            tes;
            CloseSettings_clicked();
        } else if (charStr == "l") {
            user_clicked();
        } else if (charStr == ";") {
            CloseFriends_clicked();
        }
    }
};

async function SaveWR() {
    var WRTextB = document.getElementById("WRTxtBox");

    await postRequest("/SetWR", [
        ["new_list", WRTextB.value]
    ]).then((data) => {});
}

async function changePFP() {
    var FileInput = document.getElementById("PFPInput");
    var ErrorOutput = document.getElementById("changePFPStatus");

    if (FileInput.files.length != 0) {
        if (
            FileInput.files[0].name.endsWith(".png") ||
            FileInput.files[0].name.endsWith(".jpg") ||
            FileInput.files[0].name.endsWith(".jpeg")
        ) {
            await postRequest("/ChangePFP", [
                ["file", FileInput.files[0]]
            ]).then(
                (data) => {
                    ErrorOutput.innerHTML = data["content"];
                    window.location.reload();
                }
            );
        } else {
            ErrorOutput.innerHTML = "Error: File must be png/jpg/jpeg format";
        }
    }
}