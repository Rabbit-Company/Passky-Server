var storageData = {};

function writeData(key, data){
	data = String(data);
	try{
		chrome.storage.local.set({[key]: data});
	}catch{
		localStorage.setItem(key, data);
	}
	storageData[key] = data;
}

function readData(key){
	try{
		chrome.storage.local.get([key], function(result) {
			storageData[key] = result[key];
		});
	}catch{
		storageData[key] = localStorage.getItem(key);
	}
	return storageData[key];
}

function deleteData(key){
	try{
		chrome.storage.local.remove(key);
	}catch{
		localStorage.removeItem(key);
	}
	delete storageData[key];
}

const initStorageCache = getAllStorageData().then(items => {
	Object.assign(storageData, items);
	setTheme();
});

function getAllStorageData() {
	return new Promise((resolve, reject) => {
		try{
			chrome.storage.local.get(null, (items) => {
				if (chrome.runtime.lastError) return reject(chrome.runtime.lastError);
				resolve(items);
			});
		}catch{
			resolve({ ...localStorage });
		}
	});
}

function setTheme(){
	if(readData('theme') == null || typeof(readData('theme')) == 'undefined') writeData('theme', 'dark');

	if(!(["dark", "tokyoNight", "monokai", "solarizedDark", "light", "blue", "nord", "dracula", "gray"].includes(readData('theme')))) writeData('theme', 'dark');
	document.getElementById("css-theme").href = "./website/css/themes/" + readData('theme') + ".css";
}

document.onkeydown = function(e) {
	if(e.key == "F12") return false;
	if(e.ctrlKey && e.shiftKey && e.key == 'I') return false;
	if(e.ctrlKey && e.shiftKey && e.key == 'C') return false;
	if(e.ctrlKey && e.shiftKey && e.key == 'J') return false;
	if(e.ctrlKey && (e.key == 'u' || e.key == 'U')) return false;
}

document.addEventListener('contextmenu', e => e.preventDefault());