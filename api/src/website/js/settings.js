initStorageCache.then(() => {
	document.getElementById("settings-theme").value = readData('theme');
});

document.getElementById("main-menu-toggle-btn").addEventListener("click", () => {
	toggleMenu();
});

document.getElementById("settings-theme").addEventListener("change", () => {
	writeData('theme', document.getElementById("settings-theme").value);
	document.getElementById("css-theme").href = "./website/css/themes/" + readData('theme') + ".css";
});