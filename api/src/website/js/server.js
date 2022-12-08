document.getElementById("main-menu-toggle-btn").addEventListener("click", () => {
	toggleMenu();
});

function formatBytes(bytes, decimals = 2) {
	if (bytes === 0) return '0 Bytes';
	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function resetStats(){
	document.getElementById("stats-cpu-text").innerText = "0%";
	document.getElementById("stats-cpu-bar").style = "width: 0%";
	document.getElementById("stats-ram-text").innerText = "0%";
	document.getElementById("stats-ram-bar").style = "width: 0%";
	document.getElementById("stats-storage-text").innerText = "0%";
	document.getElementById("stats-storage-bar").style = "width: 0%";
}

function resetInfoStats(){
	document.getElementById("stats-accounts-text").innerText = "0";
	document.getElementById("stats-accounts-bar").style = "width: 0%";

	document.getElementById("stats-passwords-text").innerText = "0 (0)";

	document.getElementById("stats-version-text").innerText = "0.0.0";
}

fetch(window.location.origin + "?action=getStats")
	.then(response => {
		if (response.ok) return response.json();
	}).then(json => {
		if(json.error == 0){
			let cpu = ((parseFloat(json.cpu) * 100) / json.cores).toFixed(0);
			document.getElementById("stats-cpu-text").innerText = cpu + "%";
			document.getElementById("stats-cpu-bar").style = "width: " + cpu + "%";

			document.getElementById("stats-ram-text").innerText = formatBytes(json.memoryUsed*1000, 0) + " / " + formatBytes(json.memoryTotal*1000, 0);
			document.getElementById("stats-ram-bar").style = "width: " + (json.memoryUsed/json.memoryTotal)*100 + "%";

			document.getElementById("stats-storage-text").innerText = formatBytes(json.diskUsed, 0) + " / " + formatBytes(json.diskTotal, 0);
			document.getElementById("stats-storage-bar").style = "width: " + (json.diskUsed/json.diskTotal)*100 + "%";
		}else{
			resetStats();
		}
	}).catch(err => {
		resetStats();
	});

	fetch(window.location.origin + "?action=getInfo")
	.then(response => {
		if (response.ok) return response.json();
	}).then(json => {
		if(json.error == 0){
			let maxAccounts = json.maxUsers;
			if(maxAccounts >= 0){
				document.getElementById("stats-accounts-text").innerText = json.users + " / " + json.maxUsers;
				document.getElementById("stats-accounts-bar").style = "width: " + (json.users/json.maxUsers)*100 + "%";
			}else{
				document.getElementById("stats-accounts-text").innerText = json.users;
				document.getElementById("stats-accounts-bar").style = "width: 0%";
			}

			let maxPasswords = json.maxPasswords;
			if(maxPasswords < 0) maxPasswords = "∞";
			document.getElementById("stats-passwords-text").innerText = json.passwords + " (" + maxPasswords + ")";
			document.getElementById("stats-version-text").innerText = json.version;
		}else{
			resetInfoStats();
		}
	}).catch(err => {
		resetInfoStats();
	});