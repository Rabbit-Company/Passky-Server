<?php displayHeader(0); ?>

<section id="home">
	<div class="max-w-7xl mx-auto py-12 px-4 sm:py-16 sm:px-6 lg:px-8">
		<h2 class="mb-6 text-3xl font-extrabold tertiaryColor sm:text-4xl">Passky Server</h2>
		<p class="text-base secondaryColor">If you see this page, that means your <a href="https://github.com/Rabbit-Company/Passky-Server" target="_blank" class="primaryColor">Passky Server</a> has been successfully installed.</p>
    <h3 class="mb-6 mt-12 text-2xl font-extrabold tertiaryColor sm:text-3xl">How do I use it?</h3>
    <p class="text-base mt-2 tertiaryColor">1. Download Passky Client</p>
    <p class="text-base secondaryColor">Passky Client can be accessed right from the <a href="https://vault.passky.org" target="_blank" class="primaryColor">Website</a> or it can be downloaded from <a href="https://rabbitstore.org/?app=com.rabbit-company.passky" target="_blank" class="primaryColor">Rabbit Store</a>.</p>
    <p class="text-base mt-2 tertiaryColor">2. Connect to your Passky Server</p>
    <p class="text-base secondaryColor">When you open Passky Client, you will see the first field called "Server". In this field enter URL of your Passky Server: <b class="primaryColor" id="server-origin"></b></p>
    <p class="text-base mt-2 tertiaryColor">3. Sign in or Sign up</p>
    <p class="text-base secondaryColor">Now you can fill rest of the fields and click on "Sign in" or "Sign up" button.</p>
  </div>
</section>

<?php displayFooter(array('index.js')); ?>