var parms = new URLSearchParams(window.location.search);
const IsNumeric = (num) => /^-{0,1}\d*\.{0,1}\d+$/.test(num);

document.getElementById("main-menu-toggle-btn").addEventListener("click", () => {
	toggleMenu();
});

document.getElementById("search").addEventListener("keypress", (event) => {
	if (event.key !== "Enter") return;
	event.preventDefault();
	window.location.assign("?search=" + document.getElementById("search").value);
});

document.getElementById("dialog-button-cancel").addEventListener("click", () => {
	hide('dialog');
});

try{
	document.getElementById("page").addEventListener("keypress", (event) => {
		if (event.key !== "Enter") return;
		event.preventDefault();
		window.location.assign("?page=" + document.getElementById("page").value);
	});
}catch{}

document.getElementById("create-license").addEventListener("click", () => {
	createLicense();
});

function changeDialog(style, text) {
	switch (style) {
		case 1:
			//Show license info dialog
			document.getElementById('dialog-icon').className = "mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10";
			document.getElementById('dialog-icon').innerHTML = "<svg class='h-6 w-6 text-green-600' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor' aria-hidden='true'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><circle cx='12' cy='12' r='9' /><line x1='12' y1='8' x2='12.01' y2='8' /><polyline points='11 12 12 12 12 16 13 16' /></svg>";

			document.getElementById('dialog-title').innerText = "License Info";

			let data = "";
			let licenses = JSON.parse(sessionStorage.getItem("licenses"));
			licenses.forEach(license => {
				if(license.license == text){
					data += "<b>License:</b> " + license.license + "</br>";
					data += "<b>Duration:</b> " + license.duration + " days</br>";
					data += "<b>Created:</b> " + license.created + "</br>";
					if(license.used == null){
						data += "<b>Used:</b> /</br>";
					}else{
						data += "<b>Used:</b> " + license.used + "</br>";
					}
					if(license.linked == null){
						data += "<b>Activated:</b> /</br>";
					}else{
						data += "<b>Activated:</b> " + license.linked + "</br>";
					}
				}
			});

			document.getElementById('dialog-text').innerHTML = data;

			document.getElementById('dialog-button-cancel').style.display = 'initial';

			document.getElementById('dialog-button').className = "primaryButton inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium focus:outline-none sm:w-auto sm:text-sm";
			document.getElementById('dialog-button').innerText = "Okay";
			document.getElementById('dialog-button').onclick = () => hide('dialog');
		break;
		case 2:
			//Copy license dialog
			document.getElementById('dialog-icon').className = "mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10";
			document.getElementById('dialog-icon').innerHTML = "<svg class='h-6 w-6 text-green-600' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor' aria-hidden='true'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M5 13l4 4L19 7' /></svg>";

			document.getElementById('dialog-title').innerText = "SUCCESS";

			document.getElementById('dialog-text').innerHTML = "License key has been successfully copied to your clipboard.";

			document.getElementById('dialog-button-cancel').style.display = 'initial';

			document.getElementById('dialog-button').className = "primaryButton inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium focus:outline-none sm:w-auto sm:text-sm";
			document.getElementById('dialog-button').innerText = "Okay";
			document.getElementById('dialog-button').onclick = () => hide('dialog');
		break;
		case 3:
			//Delete license dialog
			document.getElementById('dialog-icon').className = "mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10";
			document.getElementById('dialog-icon').innerHTML = "<svg class='h-6 w-6 text-red-600' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor' aria-hidden='true'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' /></svg>";

			document.getElementById('dialog-title').innerText = "Delete license";
			document.getElementById('dialog-text').innerHTML = "Are you sure you want to delete licese key:<br/><br/>" + text + "<br/><br/>This action can NOT be undone.";

			document.getElementById('dialog-button-cancel').style.display = 'initial';

			document.getElementById('dialog-button').className = "dangerButton inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium focus:outline-none sm:w-auto sm:text-sm";
			document.getElementById('dialog-button').innerText = "Delete";
			document.getElementById('dialog-button').onclick = () => deleteLicense(text);
		break;
		case 4:
			//License created dialog
			document.getElementById('dialog-icon').className = "mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10";
			document.getElementById('dialog-icon').innerHTML = "<svg class='h-6 w-6 text-green-600' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor' aria-hidden='true'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M5 13l4 4L19 7' /></svg>";

			document.getElementById('dialog-title').innerText = "SUCCESS";

			document.getElementById('dialog-text').innerHTML = "License key has been successfully created.<br/><br/>License Key: " + parms.get("license") + "<br/>Duration: " + parms.get("days") + " days";

			document.getElementById('dialog-button-cancel').style.display = 'initial';

			document.getElementById('dialog-button').className = "primaryButton inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium focus:outline-none sm:w-auto sm:text-sm";
			document.getElementById('dialog-button').innerText = "Copy";
			document.getElementById('dialog-button').onclick = () => {
				copyToClipboard(parms.get("license"));
				hide('dialog');
			}
		break;
	}
}

if(parms.get("license") != null && parms.get("days") != null && IsNumeric(parms.get("days"))){
	changeDialog(4);
	show('dialog');
}

function createLicense(){
	let days = document.getElementById("duration").value;
	let token = document.getElementById("token").value;
	window.location.assign("./website/actions/createLicense.php?days=" + days + "&token=" + token);
}

function deleteLicense(license){
	let token = document.getElementById("token").value;
	window.location.assign("./website/actions/deleteLicense.php?license=" + license + "&token=" + token);
}