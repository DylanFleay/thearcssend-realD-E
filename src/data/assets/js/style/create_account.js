function SetSizes() {
    //get ScreenDimentions
    WinX = window.innerWidth;
    WinY = window.innerHeight;
    WinXp = WinX / 100;
    WinYp = WinY / 100;
    console.log(WinX + "," + WinY);
    //get IDS
    var body = document.body.style;
    var c_enter = document.getElementById("c_enter").style;
    var c_username = document.getElementById("c_username").style;
    var c_password = document.getElementById("c_password").style;
    var l_logo_txt = document.getElementById("l_logo_txt").style;
    var c_password_d = document.getElementById("c_password_d").style;
    var c_name = document.getElementById("c_name").style;
    var c_email = document.getElementById("c_email").style;
    var c_dob = document.getElementById("c_dob").style;
    //Style
    body.fontFamily = "Calibri";
    //c_username
    c_username.width = WinXp * 35 + "px";
    c_username.height = WinXp * 6 + "px";
    c_username.borderRadius = WinXp * 1 + "px";
    c_username.paddingLeft = WinXp * 1 + "px";
    c_username.fontSize = WinXp * 3 + "px";
    //c_password
    c_password.width = WinXp * 35 + "px";
    c_password.height = WinXp * 6 + "px";
    c_password.borderRadius = WinXp * 1 + "px";
    c_password.paddingLeft = WinXp * 1 + "px";
    c_password.fontSize = WinXp * 3 + "px";
    //c_enter
    c_enter.width = WinXp * 35 + WinXp * 1 + "px";
    c_enter.height = WinXp * 5 + "px";
    c_enter.borderRadius = WinXp * 1 + "px";
    c_enter.fontSize = WinXp * 3 + "px";
    //l_logo_txt
    l_logo_txt.fontSize = WinXp * 6 + "px";
    //c_password_d
    c_password_d.width = WinXp * 35 + "px";
    c_password_d.height = WinXp * 6 + "px";
    c_password_d.borderRadius = WinXp * 1 + "px";
    c_password_d.paddingLeft = WinXp * 1 + "px";
    c_password_d.fontSize = WinXp * 3 + "px";
    //c_name
    c_name.width = WinXp * 35 + "px";
    c_name.height = WinXp * 6 + "px";
    c_name.borderRadius = WinXp * 1 + "px";
    c_name.paddingLeft = WinXp * 1 + "px";
    c_name.fontSize = WinXp * 3 + "px";
    //c_email
    c_email.width = WinXp * 35 + "px";
    c_email.height = WinXp * 6 + "px";
    c_email.borderRadius = WinXp * 1 + "px";
    c_email.paddingLeft = WinXp * 1 + "px";
    c_email.fontSize = WinXp * 3 + "px";
    //c_dob
    c_dob.width = WinXp * 35 + "px";
    c_dob.height = WinXp * 6 + "px";
    c_dob.borderRadius = WinXp * 1 + "px";
    c_dob.paddingLeft = WinXp * 1 + "px";
    c_dob.fontSize = WinXp * 3 + "px";
}

onload = function() {
    SetSizes();

};
onresize = function() {
    SetSizes();
};

function back_clicked() {
    window.location.replace("login.html")
}