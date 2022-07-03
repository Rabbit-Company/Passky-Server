<?php
if(!isset($_SESSION['username'])){
  $_SESSION['page'] = "home";
	header("Location: ../..");
}

displayHeader(3);
?>

<?php displayFooter(array('health.js')); ?>