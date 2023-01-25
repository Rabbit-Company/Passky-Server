function hide(element){
	document.getElementById(element).style.visibility = 'hidden';
}

function show(element){
	document.getElementById(element).style.visibility = 'visible';
}

function isHidden(element){
	return (document.getElementById(element).style.visibility == 'hidden');
}

function setText(element, text){
	document.getElementById(element).innerText = text;
}

function animateButton(id, enabled){
	if(enabled){
		document.getElementById(id + "-color").className = "quaternaryBackgroundColor pointer-events-none absolute h-4 w-9 mx-auto rounded-full transition-colors ease-in-out duration-200";
		document.getElementById(id + "-animation").className = "translate-x-5 pointer-events-none absolute left-0 inline-block h-5 w-5 rounded-full tertiaryBackgroundColor shadow transform ring-0 transition-transform ease-in-out duration-200";
	}else{
		document.getElementById(id + "-color").className = "primaryBackgroundColor pointer-events-none absolute h-4 w-9 mx-auto rounded-full transition-colors ease-in-out duration-200";
		document.getElementById(id + "-animation").className = "translate-x-0 pointer-events-none absolute left-0 inline-block h-5 w-5 rounded-full tertiaryBackgroundColor shadow transform ring-0 transition-transform ease-in-out duration-200";
	}
}

function toggleMenu(){
	if(document.getElementById('mobile-menu').className == 'hidden pt-2 pb-3 space-y-1'){
		document.getElementById('mobile-menu').className = 'pt-2 pb-3 space-y-1';
		document.getElementById('mobile-menu-icon').innerHTML = "<path stroke='none' d='M0 0h24v24H0z' fill='none'/><line x1='7' y1='4' x2='17' y2='17' /><line x1='17' y1='4' x2='7' y2='17' />";
	}else{
		document.getElementById('mobile-menu').className = 'hidden pt-2 pb-3 space-y-1';
		document.getElementById('mobile-menu-icon').innerHTML = "<path stroke='none' d='M0 0h24v24H0z' fill='none'/><line x1='4' y1='6' x2='20' y2='6' /><line x1='4' y1='12' x2='20' y2='12' /><line x1='4' y1='18' x2='20' y2='18' />";
	}
}

function toggleButton(id){
	let button = document.getElementById(id);
	if(button.className.includes('successButton')){
		button.innerText = lang[readData('lang')]["disable"];
		button.className = "dangerButton font-bold inline-flex items-center justify-center px-4 py-2 border border-transparent font-medium rounded-md focus:outline-none sm:text-sm";
	}else{
		button.innerText = lang[readData('lang')]["enable"];
		button.className = "successButton font-bold inline-flex items-center justify-center px-4 py-2 border border-transparent font-medium rounded-md focus:outline-none sm:text-sm";
	}
}

function copyToClipboard(text){
	let textArea = document.createElement("textarea");
	textArea.value = text;

	textArea.style.top = 0;
	textArea.style.left = 0;
	textArea.style.position = "fixed";

	document.body.appendChild(textArea);
	textArea.focus();
	textArea.select();

	document.execCommand('copy');
	document.body.removeChild(textArea);
}

function downloadTxt(exportTxt, exportName){
	let dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(exportTxt);
	let downloadAnchorNode = document.createElement('a');
	downloadAnchorNode.setAttribute("href", dataStr);
	downloadAnchorNode.setAttribute("download", exportName);
	document.body.appendChild(downloadAnchorNode); // required for firefox
	downloadAnchorNode.click();
	downloadAnchorNode.remove();
}

function downloadObjectAsJson(exportObj, exportName){
	let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
	let downloadAnchorNode = document.createElement('a');
	downloadAnchorNode.setAttribute("href", dataStr);
	downloadAnchorNode.setAttribute("download", exportName + ".json");
	document.body.appendChild(downloadAnchorNode); // required for firefox
	downloadAnchorNode.click();
	downloadAnchorNode.remove();
}

function getDate(date){
	let local = new Date(date);
	local.setMinutes(date.getMinutes() - date.getTimezoneOffset());
	return local.toJSON().slice(0, 10);
}

function randRange(min, max) {
	var range = max - min;
	var requestBytes = Math.ceil(Math.log2(range) / 8);
	if (!requestBytes) return min;
		
	var maxNum = Math.pow(256, requestBytes);
	var ar = new Uint8Array(requestBytes);

	while (true) {
		window.crypto.getRandomValues(ar);
		var val = 0;
		for (var i = 0;i < requestBytes;i++) val = (val << 8) + ar[i];
		if (val < maxNum - maxNum % range) return min + (val % range);
	}
}