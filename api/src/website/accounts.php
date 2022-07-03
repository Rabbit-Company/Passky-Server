<?php
if(!isset($_SESSION['username'])){
  $_SESSION['page'] = "home";
	header("Location: ../..");
}

displayHeader(2);
?>

<?php displayFooter(array('accounts.js')); ?>