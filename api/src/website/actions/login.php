<?php
require_once '../../Settings.php';

if(!isset($_POST['cf-turnstile-response'])){
	header('Location: ../..');
	exit();
}

$data = http_build_query(array('secret' => Settings::getCFTSecretKey(), 'response' => $_POST['cf-turnstile-response']));
$config = array('http' => array('method' => 'POST', 'header' => 'Content-Type: application/x-www-form-urlencoded', 'content' => $data));
$context = stream_context_create($config);
$result = file_get_contents('https://challenges.cloudflare.com/turnstile/v0/siteverify', false, $context);
$result = json_decode($result, true);

if($result['success'] !== true || $result['action'] !== 'login'){
	header('Location: ../..');
	exit();
}

session_start();

if($_POST['username'] === Settings::getAdminUsername() && $_POST['password'] === Settings::getAdminPassword()){
	$_SESSION['username'] = Settings::getAdminUsername();
	$_SESSION['token'] = bin2hex(random_bytes(32));
	$_SESSION['page'] = 'home';
}

header('Location: ../..');
?>