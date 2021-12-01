<?php

if (isset($_SERVER['HTTP_ORIGIN'])) {
	header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
	header('Access-Control-Allow-Credentials: true');
	header('Access-Control-Max-Age: 86400');
}

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
	if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'])) header("Access-Control-Allow-Methods: GET, POST, OPTIONS");         
	if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'])) header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
	exit(0);
}

require_once "Display.php";
require_once "Database.php";
require_once "Settings.php";

if(empty($_GET['action'])){
	echo Display::json(400);
	return;
}

$argumentNames = [
	'getInfo'			=> [],
    'getToken'			=> ['PHP_AUTH_USER', 'PHP_AUTH_PW', 'otp'],
    'createAccount'		=> ['PHP_AUTH_USER', 'PHP_AUTH_PW', 'email'],
    'getPasswords'		=> ['PHP_AUTH_USER', 'PHP_AUTH_PW'],
	'savePassword'		=> ['PHP_AUTH_USER', 'PHP_AUTH_PW', 'website', 'username', 'password', 'message'],
	'importPasswords'	=> ['PHP_AUTH_USER', 'PHP_AUTH_PW', 'php://input'],
	'editPassword'		=> ['PHP_AUTH_USER', 'PHP_AUTH_PW', 'password_id', 'website', 'username', 'password', 'message'],
	'deletePassword'	=> ['PHP_AUTH_USER', 'PHP_AUTH_PW', 'password_id'],
	'deleteAccount'		=> ['PHP_AUTH_USER', 'PHP_AUTH_PW'],
	'forgotUsername'	=> ['email'],
	'enable2fa'			=> ['PHP_AUTH_USER', 'PHP_AUTH_PW'],
	'disable2fa'		=> ['PHP_AUTH_USER', 'PHP_AUTH_PW'],
	'addYubiKey'		=> ['PHP_AUTH_USER', 'PHP_AUTH_PW', 'id'],
	'removeYubiKey'		=> ['PHP_AUTH_USER', 'PHP_AUTH_PW', 'id']
];

$action  = $_GET['action'] ?? 'No action given';

if (!in_array($action, array_keys($argumentNames))){
	echo Display::json(401);
	return;
}

if (Database::userSentToManyRequests($action)) {
	echo Display::json(429);
	return;
}

$arguments = [];
$errorNo = 0;

foreach ($argumentNames[$action] as $argumentName) {
	if($argumentName == 'PHP_AUTH_USER' || $argumentName == 'PHP_AUTH_PW'){
		if(isset($_SERVER[$argumentName])){
			$arguments[] = $_SERVER[$argumentName];
		}else{
			$errorNo = 403;
			break;
		}
	}elseif($argumentName == 'php://input'){
		if(file_get_contents('php://input') != null){
			$arguments[] = file_get_contents('php://input');
		}else{
			$errorNo = 403;
			break;
		}
	}else{
		if(isset($_POST[$argumentName])){
			$arguments[] = $_POST[$argumentName];
		}else{
			$errorNo = 403;
			break;
		}
	}
}

if ($errorNo == 0){
	echo call_user_func_array(__NAMESPACE__ . '\Database::' . $action, $arguments);
}else{
	echo Display::json($errorNo);
}

?>
