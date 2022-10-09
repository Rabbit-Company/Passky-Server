document.getElementById("main-menu-toggle-btn").addEventListener("click", () => {
	toggleMenu();
});

function addHealth(type, text){
  let html = "<li><div class='relative pb-8'><span class='absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200' aria-hidden='true'></span><div class='relative flex space-x-3'>";

  switch(type){
    case 0:
      html += "<div><span class='h-8 w-8 rounded-full bg-green-500 flex items-center justify-center ring-2 ring-white'><svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' stroke-width='1.5' stroke='#fff' fill='none' stroke-linecap='round' stroke-linejoin='round'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><path d='M5 12l5 5l10 -10' /></svg></span></div>";
    break;
    case 1:
      html += "<div><span class='h-8 w-8 rounded-full bg-yellow-500 flex items-center justify-center ring-2 ring-white'><svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' stroke-width='1.5' stroke='#fff' fill='none' stroke-linecap='round' stroke-linejoin='round'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><path d='M12 9v2m0 4v.01' /><path d='M5 19h14a2 2 0 0 0 1.84 -2.75l-7.1 -12.25a2 2 0 0 0 -3.5 0l-7.1 12.25a2 2 0 0 0 1.75 2.75' /></svg></span></div>";
    break;
    case 2:
      html += "<div><span class='h-8 w-8 rounded-full bg-red-500 flex items-center justify-center ring-2 ring-white'><svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' stroke-width='1.5' stroke='#fff' fill='none' stroke-linecap='round' stroke-linejoin='round'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><path d='M8 16v-4a4 4 0 0 1 8 0v4' /><path d='M3 12h1m8 -9v1m8 8h1m-15.4 -6.4l.7 .7m12.1 -.7l-.7 .7' /><rect x='6' y='16' width='12' height='4' rx='1' /></svg></span></div>";
    break;
  }
  html += "<div class='min-w-0 flex-1 pt-1.5 flex justify-between space-x-4'><div><p class='text-base secondaryColor'>" + text + "</p></div>";
  let date = new Date();
  html += "<div class='text-right text-base whitespace-nowrap secondaryColor'><time>" + date.toLocaleTimeString() + "</time></div>";
  html += "</div></div></div></li>"
  document.getElementById("health").innerHTML += html;
}

function finishHealthCheck(){
  let date = new Date();
  let html = "<li><div class='relative pb-8'><div class='relative flex space-x-3'><div><span class='h-8 w-8 rounded-full bg-green-500 flex items-center justify-center ring-2 ring-white'><svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' stroke-width='1.5' stroke='#fff' fill='none' stroke-linecap='round' stroke-linejoin='round'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><path d='M5 12l5 5l10 -10' /></svg></span></div><div class='min-w-0 flex-1 pt-1.5 flex justify-between space-x-4'><div><p class='text-base secondaryColor'>Health check finished.</p></div><div class='text-right text-base whitespace-nowrap secondaryColor'><time>" + date.toLocaleTimeString() + "</time></div></div></div></div></li>";
  document.getElementById("health").innerHTML += html;
}

let domain = window.location.origin;

addHealth(0, "Health check started.");

if(domain.startsWith("https://")){
  addHealth(0, "Secure connection is established with the server.");
}else{
  addHealth(2, "Secure connection is not established with the server. (Deploy <a href='https://nginxproxymanager.com' target='_blank' class='primaryColor'>Reverse Proxy</a> and install SSL / TLS certificate)");
}

fetch(domain + "?action=getInfo")
.then(response => {
	if (response.ok) return response.json();
	addHealth(2, "Failed to get response from API endpoint. Make sure <a href='" + domain + "?action=getInfo' target='_blank' class='primaryColor'>" + domain + "?action=getInfo</a> returns json.");
  finishHealthCheck();
}).then(json => {
	if(typeof(json) == 'undefined') return;
	if(typeof(json.error) == 'undefined') return;
  addHealth(0, "Connection with Passky API has been successful.");
	if(json.error == 429){
		addHealth(1, "API Limiter temporarly banned your IP, because you have made too many API calls. Please wait few seconds and refresh the website.");
    finishHealthCheck();
		return;
	}
	if(json.users == -1){
		addHealth(2, "API can't connect with a database. Make sure that you have configured settings in .env file (Manually, by running installerGUI.sh or installer.sh). It's also possible that database have already been created before with different username or password. This can be solved by changing database password to old one or by removing /passky folder, where your database files are stored. So docker will recreate database with new user and password.");
	}else{
    addHealth(0, "API can successfully connect with a database.");
  }
	if(json.maxUsers < 0){
		addHealth(0, json.users + " accounts has been created.");
	}else if(json.users >= json.maxUsers){
		addHealth(1, "Users won't be able to create new accounts, because account limit has been reached. You can increase account limit by rerunning the installer or changing settings in .env file manually. You would need to recreate docker containers for changes to apply.");
	}else{
    addHealth(0, json.users + " accounts has been created out of " + json.maxUsers + ".");
  }
	checkLatestVersion(json.version);
});

function checkLatestVersion(version){
	fetch('https://api.github.com/repos/Rabbit-Company/Passky-Server/releases/latest')
	.then(response => {
		if(response.ok) return response.json();
		addHealth(1, "Failed to check latest Passky Server version from Github. Please wait few seconds and refresh the website.");
    finishHealthCheck();
	}).then(json => {
		if(typeof(json) == 'undefined') return;
		if(typeof(json.tag_name) == 'undefined') return;
    addHealth(0, "Connection with Github API has been successful.");
		if(version != json.tag_name){
			addHealth(1, "Your Passky Server is outdated. You are running version " + version + ", while version " + json.tag_name + " has already been released.");
		}else{
      addHealth(0, "You are using the latest Passky Server.");
    }
    finishHealthCheck();
	});
}