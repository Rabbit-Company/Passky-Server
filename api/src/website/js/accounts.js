document.getElementById("main-menu-toggle-btn").addEventListener("click", () => {
	toggleMenu();
});

document.getElementById("search").addEventListener("keyup", () => {
	filterAccounts();
});

document.getElementById("dialog-button-cancel").addEventListener("click", () => {
	hide('dialog');
});

function changeDialog(style, text) {
	switch (style) {
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

function deleteAccount(username){
	window.location.assign("./website/actions/deleteAccount.php?username=" + username);
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