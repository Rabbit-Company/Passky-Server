<?php
require_once "../../Settings.php";

session_start();

$token = filter_input(INPUT_GET, 'token', FILTER_SANITIZE_STRING);

if(!isset($_SESSION['username']) || !isset($_SESSION['token']) || !$token || $token !== $_SESSION['token']){
  $_SESSION['page'] = "home";
  header("Location: ../..");
  exit();
}

$days = $_GET['days'];
$amount = $_GET['amount'];

if(!is_numeric($days)) $days = 365;
if($days < 0) $days = 1;
if($days > 365000) $days = 365000;

if(!is_numeric($amount)) $amount = 1;
if($amount < 0) $amount = 1;
if($amount > 100) $amount = 100;

$licenseKeys = array();

for($i = 0; $i < $amount; $i++){
	$licenseKeys[] = implode('-', str_split(substr(strtoupper(hash('sha256', 'passky' . random_int(100000, 999999) . time() . random_int(100000, 999999))), 0, 25), 5));
}

$query = "INSERT INTO licenses(license, duration) VALUES";

foreach($licenseKeys as $key){
	$query .= "('" . $key . "', " . $days . "),";
}

$query = substr($query, 0, -1);

try{
  $conn = Settings::createConnection();

  $stmt = $conn->prepare($query);
	$stmt->execute();

}catch(PDOException $e) {}
$conn = null;

for($i = 1; $i <= 10; $i++) Settings::removeLocalData('admin_licenses_page_' . $i, true);
Settings::removeLocalData('admin_licenses_count', true);

$_SESSION['page'] = "licenses";
$_SESSION['licenses'] = $licenseKeys;
header("Location: ../..?days=" . $days);
?>