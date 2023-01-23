<?php
header('Content-Type: application/json; charset=utf-8');
header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'; object-src 'none'; base-uri 'none'; require-trusted-types-for 'script'; form-action 'none'");
header('X-Content-Type-Options: nosniff');
header('X-XSS-Protection: 1; mode=block');
header('X-Frame-Options: DENY');
header('Referrer-Policy: no-referrer');
header('Permissions-Policy: interest-cohort=()');

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 86400');

require_once 'Settings.php';

$today = date('Y-m-d');

$executed = Settings::readLocalData('cron_executed', true);
if($executed === null){
	$executed = Settings::readLocalData('cron_executed', false);
	if($executed !== null){
		$ttl = Settings::ttlLocalData('cron_executed', false);
		if($ttl >= 5) Settings::writeLocalData('cron_executed', $executed, $ttl, true);
	}
}

if($today === $executed){
	echo '{"status":"success"}';
	return;
}

Settings::purgeLocalData();
Settings::writeLocalData('cron_executed', $today, 86_400, true);
Settings::writeLocalData('cron_executed', $today, 86_400, false);

// Deactivate expired premium accounts
$maxPasswords = Settings::getMaxPasswords();
try{
	$conn = Settings::createConnection();

	$stmt = $conn->prepare('UPDATE users SET max_passwords = :max_passwords, premium_expires = null WHERE CURDATE() > premium_expires');
	$stmt->bindParam(':max_passwords', $maxPasswords, PDO::PARAM_INT);
	$stmt->execute();
}catch(PDOException $e) {}
$conn = null;

// Cache amount of users and passwords
if(Settings::getDBCacheMode() >= 2){
	$queryUsers = "SELECT COUNT(*) AS 'amount' FROM users";
	$queryPasswords = "SELECT COUNT(*) AS 'amount' FROM passwords";
	if(Settings::getDBCacheMode() === 3 && Settings::getDBEngine() == MYSQL){

		$queryUsers = "SELECT TABLE_ROWS AS 'amount' FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = '" . Settings::getDBName() . "' AND TABLE_NAME = 'users'";
		$queryPasswords = "SELECT TABLE_ROWS AS 'amount' FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = '" . Settings::getDBName() . "' AND TABLE_NAME = 'passwords'";
	}

	try{
		$conn = Settings::createConnection();

		$stmt = $conn->prepare($queryUsers);
		$stmt->execute();

		$amount = ($stmt->rowCount() === 1) ? $stmt->fetch()['amount'] : -1;
		Settings::writeLocalData('user_count', $amount, 43_200, true);
		Settings::writeLocalData('user_count', $amount, 864_000, false);
	}catch(PDOException $e) {
		Settings::writeLocalData('user_count', -1, 43_200, true);
		Settings::writeLocalData('user_count', -1, 864_000, false);
	}

	try{
		$conn = Settings::createConnection();

		$stmt = $conn->prepare($queryPasswords);
		$stmt->execute();

		$amount = ($stmt->rowCount() === 1) ? $stmt->fetch()['amount'] : -1;
		Settings::writeLocalData('password_count', $amount, 43_200, true);
		Settings::writeLocalData('password_count', $amount, 864_000, false);
	}catch(PDOException $e) {
		Settings::writeLocalData('password_count', -1, 43_200, true);
		Settings::writeLocalData('password_count', -1, 864_000, false);
	}
}

// Generate report
try{
	$conn = Settings::createConnection();

	$stmt = $conn->prepare('SELECT created AS date, count(created) AS newcomers from users GROUP BY created');
	$stmt->execute();
	$results = $stmt->fetchAll(PDO::FETCH_ASSOC);
	Settings::writeLocalData('report', serialize($results), 43_200, true);
	Settings::writeLocalData('report', serialize($results), 864_000, false);

	$duration = date('Y-m-d', strtotime('-7 days'));

	$stmt = $conn->prepare("SELECT count(accessed) as amount from users WHERE accessed >= '" . $duration . "'");
	$stmt->execute();
	$activeUsers = $stmt->fetch()['amount'];
	Settings::writeLocalData('active_users', $activeUsers, 43_200, true);
	Settings::writeLocalData('active_users', $activeUsers, 864_000, false);

}catch(PDOException $e) {}
$conn = null;

echo '{"status":"success"}';
?>