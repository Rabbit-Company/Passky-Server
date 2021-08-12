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

switch($_GET['action']){
	case "createAccount":
		if(Database::userSentToManyRequests('createAccount')){
			echo Display::json(429);
			return;
		}
	
		if(!isset($_SERVER['PHP_AUTH_USER']) || !isset($_POST['email']) || !isset($_SERVER['PHP_AUTH_PW'])){
			echo Display::json(403);
			return;
		}

		echo Database::createAccount($_SERVER['PHP_AUTH_USER'], $_POST['email'], $_SERVER['PHP_AUTH_PW']);
    break;
	case "getPasswords":
		if(Database::userSentToManyRequests('getPasswords')){
			echo Display::json(429);
			return;
		}

		if(!isset($_SERVER['PHP_AUTH_USER']) || !isset($_SERVER['PHP_AUTH_PW'])){
			echo Display::json(403);
			return;
		}

		echo Database::getPasswords($_SERVER['PHP_AUTH_USER'], $_SERVER['PHP_AUTH_PW']);
	break;
	case "savePassword":
		if(Database::userSentToManyRequests('savePassword')){
			echo Display::json(429);
			return;
		}

		if(!isset($_SERVER['PHP_AUTH_USER']) || !isset($_SERVER['PHP_AUTH_PW']) || !isset($_POST['website']) || !isset($_POST['username']) || !isset($_POST['password']) || !isset($_POST['message'])){
			echo Display::json(403);
			return;
		}

		echo Database::savePassword($_SERVER['PHP_AUTH_USER'], $_SERVER['PHP_AUTH_PW'], $_POST['website'], $_POST['username'], $_POST['password'], $_POST['message']);
	break;
	case "importPasswords":
		if(Database::userSentToManyRequests('importPasswords')){
			echo Display::json(429);
			return;
		}

		if(!isset($_SERVER['PHP_AUTH_USER']) || !isset($_SERVER['PHP_AUTH_PW']) || file_get_contents('php://input') == null){
			echo Display::json(403);
			return;
		}

		echo Database::importPasswords($_SERVER['PHP_AUTH_USER'], $_SERVER['PHP_AUTH_PW'], file_get_contents('php://input'));
	break;
	case "editPassword":
		if(Database::userSentToManyRequests('editPassword')){
			echo Display::json(429);
			return;
		}

		if(!isset($_SERVER['PHP_AUTH_USER']) || !isset($_SERVER['PHP_AUTH_PW']) || !isset($_POST['password_id']) || !isset($_POST['website']) || !isset($_POST['username']) || !isset($_POST['password']) || !isset($_POST['message'])){
			echo Display::json(403);
			return;
		}

		echo Database::editPassword($_SERVER['PHP_AUTH_USER'], $_SERVER['PHP_AUTH_PW'], $_POST['password_id'], $_POST['website'], $_POST['username'], $_POST['password'], $_POST['message']);
	break;
	case "deletePassword":
		if(Database::userSentToManyRequests('deletePassword')){
			echo Display::json(429);
			return;
		}

		if(!isset($_SERVER['PHP_AUTH_USER']) || !isset($_SERVER['PHP_AUTH_PW']) || !isset($_POST['password_id'])){
			echo Display::json(403);
			return;
		}

		echo Database::deletePassword($_SERVER['PHP_AUTH_USER'], $_SERVER['PHP_AUTH_PW'], $_POST['password_id']);
	break;
	case "deleteAccount":
		if(Database::userSentToManyRequests('deleteAccount')){
			echo Display::json(429);
			return;
		}

		if(!isset($_SERVER['PHP_AUTH_USER']) || !isset($_SERVER['PHP_AUTH_PW'])){
			echo Display::json(403);
			return;
		}

		echo Database::deleteAccount($_SERVER['PHP_AUTH_USER'], $_SERVER['PHP_AUTH_PW']);
	break;
	case "forgotUsername":
		if(Database::userSentToManyRequests('forgotUsername')){
			echo Display::json(429);
			return;
		}
	
		if(!isset($_POST['email'])){
			echo Display::json(403);
			return;
		}

		echo Database::forgotUsername($_POST['email']);
    break;
    default:
    	echo Display::json(401);
    break;
}
?>
