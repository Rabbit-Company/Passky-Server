<?php
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

		if(!isset($_SERVER['PHP_AUTH_USER']) || !isset($_SERVER['PHP_AUTH_PW']) || !isset($_POST['website']) || !isset($_POST['username']) || !isset($_POST['password'])){
			echo Display::json(403);
			return;
		}

		echo Database::savePassword($_SERVER['PHP_AUTH_USER'], $_SERVER['PHP_AUTH_PW'], $_POST['website'], $_POST['username'], $_POST['password']);
	break;
	case "editPassword":
		if(Database::userSentToManyRequests('editPassword')){
			echo Display::json(429);
			return;
		}

		if(!isset($_SERVER['PHP_AUTH_USER']) || !isset($_SERVER['PHP_AUTH_PW']) || !isset($_POST['password_id']) || !isset($_POST['website']) || !isset($_POST['username']) || !isset($_POST['password'])){
			echo Display::json(403);
			return;
		}

		echo Database::editPassword($_SERVER['PHP_AUTH_USER'], $_SERVER['PHP_AUTH_PW'], $_POST['password_id'], $_POST['website'], $_POST['username'], $_POST['password']);
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
    default:
    	echo Display::json(401);
    break;
}
?>
