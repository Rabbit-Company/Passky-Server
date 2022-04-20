let domain = window.location.origin;
let serverOrigin = document.getElementById("server-origin"); 
let warningList = document.getElementById("warning-list");

serverOrigin.innerText = domain;

if(!domain.startsWith("https://")){
	serverOrigin.className = "orange";
	addWarning("Secure connection is not estabilished with the server. (Deploy <a href='https://nginxproxymanager.com' target='_blank'>Reverse Proxy</a> and install SSL / TLS certificate)", "orange");
}

fetch(domain + "?action=getInfo")
.then(response => {
	if (response.ok) return response.json();
	addWarning("Failed to get response from API endpoint. Make sure <a href='" + domain + "?action=getInfo' target='_blank'>" + domain + "?action=getInfo</a> returns json.", "red");
}).then(json => {
	if(typeof(json) == 'undefined') return;
	if(typeof(json.error) == 'undefined') return;
	if(json.error == 429){
		addWarning("API Limiter banned your IP, because you have made too many API calls. Please wait few seconds and refresh the website.", "orange");
		return;
	}
	if(json.users == -1){
		addWarning("API can't connect with a database. Make sure that you have configured settings in .env file (Manually, by running installerGUI.sh or installer.sh). It's also possible that database have already been created before with different username or password. This can be solved by changing database password to old one or by removing /passky folder, where your database files are stored. So docker will recreate database with new user and password.", "red");
	}
	if(json.users >= json.maxUsers){
		addWarning("Users won't be able to create new accounts, because account limit has been reached. You can increase account limit by rerunning the installer or changing settings in .env file manually. You would need to recreate docker containers for changes to apply.", "orange");
	}
	checkLatestVersion(json.version);
});

function checkLatestVersion(version){
	fetch('https://api.github.com/repos/Rabbit-Company/Passky-Server/releases/latest')
	.then(response => {
		if(response.ok) return response.json();
		addWarning("Failed to check latest Passky Server version from Github.", "orange");
	}).then(json => {
		if(typeof(json) == 'undefined') return;
		if(typeof(json.tag_name) == 'undefined') return;
		if(version != json.tag_name){
			addWarning("Your Passky Server is outdated. You are running version " + version + ", while version " + json.tag_name + " has already been released.", "orange");
		}
	});
}

function addWarning(text, color){
	warningList.innerHTML += "<li class='" + color + "'>" + text + "</li>";
	document.getElementById("warning").className = "visible";
}