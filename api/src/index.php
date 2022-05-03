<?php

header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'; object-src 'none'; base-uri 'none'; require-trusted-types-for 'script'; form-action 'none'");
header("X-Content-Type-Options: nosniff");
header("X-XSS-Protection: 1; mode=block");
header("X-Frame-Options: DENY");
header("Referrer-Policy: no-referrer");
header("Permissions-Policy: interest-cohort=()");

if(empty($_GET['action'])){
	header("Content-Security-Policy: default-src 'self'; style-src 'self'; connect-src 'self' https:; frame-ancestors 'none'; object-src 'none'; base-uri 'none'; form-action 'none'");
	readfile("website/test.html");
	return;
}

if(isset($_SERVER['HTTP_ORIGIN'])) {
	header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
	header('Access-Control-Allow-Credentials: true');
	header('Access-Control-Max-Age: 86400');
}

if($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
	if(isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'])) header("Access-Control-Allow-Methods: GET, POST, OPTIONS");         
	if(isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'])) header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
	exit(0);
}

require __DIR__ . '/../vendor/autoload.php';
// This condition will pass on Shared Hosting and not inside docker.
// So, it will load .env files and make it available to getenv to digest.
// In docker env will be passed directly at runtime.
if(isset($_SERVER['HTTP_HOST'])){
	(new DevCoder\DotEnv(__DIR__ . '/../../.env'))->load();
}

require_once "Display.php";
require_once "Database.php";
require_once "Settings.php";

$argumentNames = [
	'getInfo'					=> [],
	'getStats'				=> [],
	'getToken'				=> ['PHP_AUTH_USER', 'PHP_AUTH_PW', 'otp'],
	'createAccount'		=> ['PHP_AUTH_USER', 'PHP_AUTH_PW', 'email'],
	'getPasswords'		=> ['PHP_AUTH_USER', 'PHP_AUTH_PW'],
	'savePassword'		=> ['PHP_AUTH_USER', 'PHP_AUTH_PW', 'website', 'username', 'password', 'message'],
	'importPasswords'	=> ['PHP_AUTH_USER', 'PHP_AUTH_PW', 'php://input'],
	'editPassword'		=> ['PHP_AUTH_USER', 'PHP_AUTH_PW', 'password_id', 'website', 'username', 'password', 'message'],
	'deletePassword'	=> ['PHP_AUTH_USER', 'PHP_AUTH_PW', 'password_id'],
	'deleteAccount'		=> ['PHP_AUTH_USER', 'PHP_AUTH_PW'],
	'forgotUsername'	=> ['email'],
	'enable2fa'				=> ['PHP_AUTH_USER', 'PHP_AUTH_PW'],
	'disable2fa'			=> ['PHP_AUTH_USER', 'PHP_AUTH_PW'],
	'addYubiKey'			=> ['PHP_AUTH_USER', 'PHP_AUTH_PW', 'id'],
	'removeYubiKey'		=> ['PHP_AUTH_USER', 'PHP_AUTH_PW', 'id']
];

$action = $_GET['action'] ?? 'No action given';

if(!in_array($action, array_keys($argumentNames))){
	echo Display::json(401);
	return;
}

if(Database::userSentToManyRequests($action)) {
	echo Display::json(429);
	return;
}

$arguments = [];
$errorNo = 0;

foreach ($argumentNames[$action] as $argumentName) {
	if(($argumentName == 'PHP_AUTH_USER' || $argumentName == 'PHP_AUTH_PW') && isset($_SERVER[$argumentName])){
		$arguments[] = $_SERVER[$argumentName];
	}elseif($argumentName == 'php://input' && file_get_contents('php://input') != null){
		$arguments[] = file_get_contents('php://input');
	}elseif(isset($_POST[$argumentName])){
		$arguments[] = $_POST[$argumentName];
	}else{
		$errorNo = 403;
		break;
	}
}

if($errorNo == 0){
	echo call_user_func_array(__NAMESPACE__ . '\Database::' . $action, $arguments);
}else{
	echo Display::json($errorNo);
}

?>
