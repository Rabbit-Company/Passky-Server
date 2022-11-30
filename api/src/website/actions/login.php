<?php
require_once '../../Settings.php';

session_start();

if($_POST['username'] === Settings::getAdminUsername() && $_POST['password'] === Settings::getAdminPassword()){
  $_SESSION['username'] = Settings::getAdminUsername();
	$_SESSION['token'] = bin2hex(random_bytes(32));
  $_SESSION['page'] = 'home';
}

header('Location: ../..');
?>