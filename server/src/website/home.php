<?php displayHeader(0); ?>

<section id="home">
	<div class="max-w-7xl mx-auto py-12 px-4 sm:py-16 sm:px-6 lg:px-8">
		<h2 class="mb-6 text-3xl font-extrabold tertiaryColor sm:text-4xl">Passky Server</h2>
		<p class="text-base secondaryColor">The successful installation of the <a href="https://github.com/Rabbit-Company/Passky-Server" target="_blank" class="primaryColor">Passky Server</a> is indicated by the appearance of this page.</p>
		<h3 class="mb-6 mt-12 text-2xl font-extrabold tertiaryColor sm:text-3xl">How do I use it?</h3>
		<p class="text-base mt-2 tertiaryColor">1. Download Passky Client</p>
		<p class="text-base secondaryColor">The Passky Client can be obtained from the <a href="https://passky.org/download" target="_blank" class="primaryColor">Official Website</a> or accessed directly through the <a href="https://vault.passky.org" target="_blank" class="primaryColor">https://vault.passky.org</a> portal.</p>
		<p class="text-base mt-2 tertiaryColor">2. Connect to your Passky Server</p>
		<p class="text-base secondaryColor">Upon opening the Passky Client, you will encounter the first field labeled "Server". In this field, please enter the URL of your Passky Server: <b class="primaryColor" id="server-origin"></b></p>
		<p class="text-base mt-2 tertiaryColor">3. Sign in or Sign up</p>
		<p class="text-base secondaryColor">You may now complete the remaining fields and proceed by clicking on either the "Sign In" or "Sign Up" button.</p>
	</div>
</section>

<?php displayFooter(array('index.js')); ?>