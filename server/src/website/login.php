<?php
require_once 'Settings.php';
displayHeader(10);
?>

<div class="primaryBackgroundColor mt-20 flex items-center justify-center py-6 px-4 sm:px-3 lg:px-8">
	<div class="max-w-md w-full space-y-6">
		<div>
			<h2 class="text-center mb-6 text-3xl font-extrabold tertiaryColor sm:text-4xl">Admin Panel</h2>
		</div>
		<form method="POST" action="./website/actions/login.php" class="mt-8 space-y-6">
			<input type="hidden" name="remember" value="true">
			<div class="rounded-md shadow-sm -space-y-px">
				<div>
					<label for="username" class="sr-only">Username</label>
					<input id="username" name="username" type="text" autocomplete="username" required class="tertiaryBackgroundColor tertiaryColor primaryBorderColor appearance-none rounded-none relative block w-full px-3 py-2 border rounded-t-md focus:outline-none focus:z-10 sm:text-sm" placeholder="Username">
				</div>
				<div>
					<label for="password" class="sr-only">Password</label>
					<input id="password" name="password" type="password" autocomplete="current-password" required class="tertiaryBackgroundColor tertiaryColor primaryBorderColor appearance-none rounded-none relative block w-full px-3 py-2 border focus:outline-none focus:z-10 sm:text-sm" placeholder="Password">
				</div>
				<div>
					<label for="otp" class="sr-only">OTP</label>
					<input id="otp" name="otp" type="text" autocomplete="off" class="tertiaryBackgroundColor tertiaryColor primaryBorderColor appearance-none rounded-none relative block w-full px-3 py-2 border rounded-b-md focus:outline-none focus:z-10 sm:text-sm" placeholder="OTP">
				</div>
			</div>

			<div class="cf-turnstile" data-theme="dark" data-action="login" data-sitekey="<?= Settings::getCFTSiteKey(); ?>"></div>

			<div class="text-center">
				<button id="btn_signin" type="submit" class="primaryButton group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none">
					Sign in
				</button>
			</div>
		</form>
	</div>
</div>
<?php displayFooter(array('login.js')); ?>