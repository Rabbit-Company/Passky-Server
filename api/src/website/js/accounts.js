document.getElementById("main-menu-toggle-btn").addEventListener("click", () => {
	toggleMenu();
});

document.getElementById("search").addEventListener("keyup", () => {
	filterAccounts();
});

document.getElementById("dialog-button-cancel").addEventListener("click", () => {
	hide('dialog');
});

document.getElementById("page").addEventListener("keypress", (event) => {
	if (event.key !== "Enter") return;
	event.preventDefault();
	window.location = "?page=" + document.getElementById("page").value;
});

function changeDialog(style, text) {
	switch (style) {
		case 1:
			//Show account info dialog
			document.getElementById('dialog-icon').className = "mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10";
			document.getElementById('dialog-icon').innerHTML = "<svg class='h-6 w-6 text-green-600' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor' aria-hidden='true'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><circle cx='12' cy='12' r='9' /><line x1='12' y1='8' x2='12.01' y2='8' /><polyline points='11 12 12 12 12 16 13 16' /></svg>";

			document.getElementById('dialog-title').innerText = "Account Info";

			let data = "";
			let accounts = JSON.parse(sessionStorage.getItem("accounts"));
			accounts.forEach(account => {
				if(account.username == text){
					let maxPasswords = account.max_passwords;
					if(account.max_passwords < 0) maxPasswords = "∞";
					data += "<b>ID:</b> " + account.user_id + "</br>";
					data += "<b>Username:</b> " + account.username + "</br>";
					data += "<b>Email:</b> " + account.email + "</br>";
					data += "<b>Passwords:</b> " + account.passwords + " / " + maxPasswords + "</br>";
					data += "<b>Created:</b> " + account.created + "</br>";
					data += "<b>Accessed:</b> " + account.accessed + "</br></br>";
					if(account.backup_codes == null){
						data += "<b>Backup Codes</b>: Inactive";
					}else{
						let codes = account.backup_codes.split(';');
						let backupCodes = "<ul>";
						for (let i = 0; i < codes.length; i += 2) backupCodes += "<li>" + codes[i] + " " + codes[i + 1] + "</li>";
						backupCodes += "</ul>";
						data += "<b>Backup Codes:</b> " + backupCodes;
					}
				}
			});

			document.getElementById('dialog-text').innerHTML = data;

			document.getElementById('dialog-button-cancel').style.display = 'initial';

			document.getElementById('dialog-button').className = "primaryButton inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium focus:outline-none sm:w-auto sm:text-sm";
			document.getElementById('dialog-button').innerText = "Ok";
			document.getElementById('dialog-button').onclick = () => hide('dialog');
		break;
		case 2:
			//Edit account dialog
			document.getElementById('dialog-icon').className = "mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10";
			document.getElementById('dialog-icon').innerHTML = "<svg class='h-6 w-6 text-blue-600' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor' aria-hidden='true'><path stroke='none' d='M0 0h24v24H0z' fill='none'></path><path d='M9 7h-3a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-3'></path><path d='M9 15h3l8.5 -8.5a1.5 1.5 0 0 0 -3 -3l-8.5 8.5v3'></path><line x1='16' y1='5' x2='19' y2='8'></line></svg>";

			document.getElementById('dialog-title').innerText = "Edit account";

			let username = text;
			let email = "";
			let max_passwords = 0;
			let enabled2fa = "";
			let accountsArray = JSON.parse(sessionStorage.getItem("accounts"));
			accountsArray.forEach(account => {
				if(account.username == username){
					email = account.email;
					max_passwords = account.max_passwords;
					if(account.backup_codes == null) enabled2fa = "hidden";
				}
			});

			document.getElementById('dialog-text').innerHTML = "<div class=rounded-md shadow-sm -space-y-px'><div><label for='username' class='sr-only'>Username</label><input id='username' name='username' type='text' value='" + username + "' readonly class='appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 secondaryColor rounded-t-md focus:outline-none focus:z-10 sm:text-sm' placeholder='Username'></div><div><label for='email' class='sr-only'>Email</label><input id='email' name='email' type='email' value='" + email + "' required class='appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 tertiaryColor focus:outline-none focus:z-10 sm:text-sm' placeholder='Email'></div><div><label for='max_passwords' class='sr-only'>Max Passwords</label><input id='max_passwords' name='max_passwords' type='number' value='" + max_passwords + "' min='0' max='50000' required class='appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 tertiaryColor rounded-b-md focus:outline-none focus:z-10 sm:text-sm' placeholder='Max Passwords'></div></div><fieldset class='mt-5 sm:mt-4 " + enabled2fa + "'><legend class='sr-only'>Disable 2FA</legend><div class='relative flex items-start'><div class='flex items-center h-5'><input id='disable2fa' type='checkbox' class='tertiaryBackgroundColor primaryColor h-4 w-4 primaryBorderColor rounded'></div><div class='ml-3 text-sm'><span class='tertiaryColor'>Disable 2FA</span></div></div></fieldset>";

			document.getElementById('dialog-button-cancel').style.display = 'initial';

			document.getElementById('dialog-button').className = "primaryButton inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium focus:outline-none sm:w-auto sm:text-sm";
			document.getElementById('dialog-button').innerText = "Save";
			document.getElementById('dialog-button').onclick = () => editAccount(text);
		break;
		case 3:
			//Delete account dialog
			document.getElementById('dialog-icon').className = "mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10";
			document.getElementById('dialog-icon').innerHTML = "<svg class='h-6 w-6 text-red-600' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor' aria-hidden='true'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' /></svg>";

			document.getElementById('dialog-title').innerText = "Delete account";
			document.getElementById('dialog-text').innerText = "Are you sure you want to delete " + text + " account? All data associated to this account will be permanently removed from the server. This action can NOT be undone.";

			document.getElementById('dialog-button-cancel').style.display = 'initial';

			document.getElementById('dialog-button').className = "dangerButton inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium focus:outline-none sm:w-auto sm:text-sm";
			document.getElementById('dialog-button').innerText = "Delete";
			document.getElementById('dialog-button').onclick = () => deleteAccount(text);
		break;
	}
}

function editAccount(username){
	let email = document.getElementById("email").value;
	let max_passwords = document.getElementById("max_passwords").value;
	let disable2fa = document.getElementById("disable2fa").checked;
	let token = document.getElementById("token").value;
	window.location.assign("./website/actions/editAccount.php?username=" + username + "&email=" + email + "&max_passwords=" + max_passwords + "&disable2fa=" + disable2fa + "&token=" + token);
}

function deleteAccount(username){
	let token = document.getElementById("token").value;
	window.location.assign("./website/actions/deleteAccount.php?username=" + username + "&token=" + token);
}

function filterAccounts() {
	let input, filter, table, tr, td, i, txtValue;
	input = document.getElementById("search");
	filter = input.value.toUpperCase();
	table = document.getElementById("table-accounts");
	tr = table.getElementsByTagName("tr");

	for (i = 0; i < tr.length; i++) {
		td = tr[i].getElementsByTagName("td")[0];
		if (td) {
			txtValue = td.textContent || td.innerText;
			if (txtValue.toUpperCase().indexOf(filter) > -1) {
				tr[i].style.display = "";
			} else {
				tr[i].style.display = "none";
			}
		}
	}
}