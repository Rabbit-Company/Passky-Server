<?php
if(!isset($_SESSION['username'])){
  $_SESSION['page'] = "home";
	header("Location: ../..");
}

displayHeader(4);
?>
<div class="flex flex-col m-8 max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
	<ul class="space-y-3">
		<!-- Themes -->
		<li class="secondaryBackgroundColor shadow overflow-hidden rounded-md px-6 py-4">
			<div>
				<label id="label-theme" class="secondaryColor block text-sm font-medium sm:mt-px sm:pt-2"> Theme </label>
				<div class="mt-1 sm:mt-0 sm:col-span-2">
					<select id="settings-theme" class="mainMenuMobileLink border-transparent w-full block pl-3 pr-4 py-2 text-base focus:outline-none font-medium">
						<option value="dark">Dark</option>
						<option value="solarizedDark">Solarized Dark</option>
						<option value="tokyoNight">Tokyo Night</option>
						<option value="dracula">Dracula</option>
						<option value="monokai">Monokai</option>
						<option value="blue">Blue</option>
						<option value="gray">Gray</option>
						<option value="light">Light</option>
					</select>
				</div>
			</div>
		</li>
		<!-- 2FA -->
		<li class="secondaryBackgroundColor shadow overflow-hidden rounded-md px-6 py-4">
			<div>
				<label id="label-2fa" class="secondaryColor block text-sm font-medium sm:mt-px sm:pt-2"> Two-Factor Authentication (2FA) </label>
				<div class="mt-5">
					<button id="toggle-2fa-btn" type="button" class="successButton font-bold inline-flex items-center justify-center px-4 py-2 border border-transparent font-medium rounded-md focus:outline-none sm:text-sm"> Enable </button>
				</div>
			</div>
		</li>
		<!-- Yubico OTP -->
		<li class="secondaryBackgroundColor shadow overflow-hidden rounded-md px-6 py-4">
			<div>
				<label id="label-2fa" class="secondaryColor block text-sm font-medium sm:mt-px sm:pt-2"> Yubico One-Time Password (Yubico OTP) </label>
				<div class="mt-5">
					<ul id="yubico-list" role="list" class="divide-y"></ul>
					<button id="add-yubico-btn" type="button" class="successButton font-bold inline-flex items-center justify-center px-4 py-2 border border-transparent font-medium rounded-md focus:outline-none sm:text-sm"> Add </button>
					<button id="remove-yubico-btn" type="button" class="dangerButton font-bold inline-flex items-center justify-center px-4 py-2 border border-transparent font-medium rounded-md focus:outline-none sm:text-sm"> Remove </button>
				</div>
			</div>
		</li>
	</ul>
</div>

<?php displayFooter(array('qrcode.js', 'qrcode.js', 'settings.js')); ?>