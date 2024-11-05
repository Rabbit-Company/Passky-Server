<?php
require_once '../../Settings.php';

session_start();

$token = htmlspecialchars(filter_input(INPUT_GET, 'token'), ENT_QUOTES, 'UTF-8');

if(!isset($_SESSION['username']) || !isset($_SESSION['token']) || !$token || $token !== $_SESSION['token']){
	$_SESSION['page'] = 'home';
	header('Location: ../..');
	exit();
}

$username = $_GET['username'];
$email = $_GET['email'];
$maxPasswords = $_GET['max_passwords'];
$disable2fa = ($_GET['disable2fa'] === 'true') ? true : false;
$disablePremium = ($_GET['disablePremium'] === 'true') ? true : false;

if(!is_numeric($maxPasswords)) $maxPasswords = Settings::getMaxPasswords();
if($maxPasswords < 0) $maxPasswords = -1;
if($maxPasswords > 1_000_000_000) $maxPasswords = 1_000_000_000;

if($disablePremium) $maxPasswords = Settings::getMaxPasswords();

try{
	$conn = Settings::createConnection();

	if(preg_match("/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z0-9-]{2,}$/i", $email) && strlen($email) <= 200){
		$stmt = $conn->prepare('UPDATE users SET email = :email, max_passwords = :maxPasswords WHERE username = :username');
		$stmt->bindParam(':username', $username, PDO::PARAM_STR);
		$stmt->bindParam(':email', strtolower($email), PDO::PARAM_STR);
		$stmt->bindParam(':maxPasswords', $maxPasswords, PDO::PARAM_INT);
		$stmt->execute();
	}else{
		$stmt = $conn->prepare('UPDATE users SET max_passwords = :maxPasswords WHERE username = :username');
		$stmt->bindParam(':username', $username, PDO::PARAM_STR);
		$stmt->bindParam(':maxPasswords', $maxPasswords, PDO::PARAM_INT);
		$stmt->execute();
	}

	if($disable2fa){
		$stmt = $conn->prepare('UPDATE users SET `2fa_secret` = null, yubico_otp = null, backup_codes = null WHERE username = :username');
		$stmt->bindParam(':username', $username, PDO::PARAM_STR);
		$stmt->execute();
	}

	if($disablePremium){
		$stmt = $conn->prepare('UPDATE users SET premium_expires = null, max_passwords = :maxPasswords WHERE username = :username');
		$stmt->bindParam(':username', $username, PDO::PARAM_STR);
		$stmt->bindParam(':maxPasswords', $maxPasswords, PDO::PARAM_INT);
		$stmt->execute();
	}
}catch(PDOException $e) {}
$conn = null;

for($i = 1; $i <= 10; $i++) Settings::removeLocalData('admin_accounts_page_' . $i, true);

$_SESSION['page'] = 'accounts';
header('Location: ../..');
?>