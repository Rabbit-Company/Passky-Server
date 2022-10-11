<?php
require_once "../../Settings.php";

session_start();

$token = filter_input(INPUT_GET, 'token', FILTER_SANITIZE_STRING);

if(!isset($_SESSION['username']) || !isset($_SESSION['token']) || !$token || $token !== $_SESSION['token']){
  $_SESSION['page'] = "home";
  header("Location: ../..");
  return;
}

$days = $_GET['days'];

if(!is_numeric($days)) $days = 365;
if($days < 0) $days = 1;
if($days > 365000) $days = 365000;

$licenseKey = implode('-', str_split(substr(strtoupper(hash('sha256', 'passky' . random_int(100000, 999999) . time() . random_int(100000, 999999))), 0, 25), 5));

try{
  $conn = Settings::createConnection();

  $stmt = $conn->prepare("INSERT INTO licenses(license, duration) VALUES(:license, :duration)");
  $stmt->bindParam(':license', $licenseKey, PDO::PARAM_STR);
  $stmt->bindParam(':duration', $days, PDO::PARAM_INT);
	$stmt->execute();

}catch(PDOException $e) {}
$conn = null;

$_SESSION['page'] = "licenses";
header("Location: ../..?license=" . $licenseKey . "&days=" . $days);
?>