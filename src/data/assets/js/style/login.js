function SetSizes() {
	//get ScreenDimentions
	WinX = window.innerWidth;
	WinY = window.innerHeight;
	WinXp = WinX / 100;
	WinYp = WinY / 100;
	console.log(WinX + "," + WinY);
	//get IDS

	var body = document.body.style;
	var l_login = document.getElementById("l_login").style;
	var l_username = document.getElementById("l_username").style;
	var l_password = document.getElementById("l_password").style;
	var l_logo_txt = document.getElementById("l_logo_txt").style;
	var create_acc = document.getElementById("create_acc").style;

	//Style
	body.fontFamily = "Calibri";
}

onload = function () {
	SetSizes();
};
onresize = function () {
	SetSizes();
};
