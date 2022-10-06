<?php
if(!isset($_SESSION['username']) || !isset($_SESSION['token'])){
  $_SESSION['page'] = "home";
	header("Location: ../..");
}

displayHeader(3);
?>

<section id="stats">
	<div class="max-w-7xl mx-auto py-12 px-4 sm:py-16 sm:px-6 lg:px-8">
		<h2 class="text-center mb-6 text-3xl font-extrabold tertiaryColor sm:text-4xl">
			Health Check
		</h2>
		<div class="flow-root">
			<ul id="health" role="list" class="-mb-8"></ul>
		</div>
	</div>
</section>

<?php displayFooter(array('health.js')); ?>