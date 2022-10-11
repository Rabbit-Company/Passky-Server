<?php
require_once "../../Settings.php";

session_start();

$token = filter_input(INPUT_GET, 'token', FILTER_SANITIZE_STRING);

if(!isset($_SESSION['username']) || !isset($_SESSION['token']) || !$token || $token !== $_SESSION['token']){
  $_SESSION['page'] = "home";
  header("Location: ../..");
  return;
}

$license = $_GET['license'];

try{
  $conn = Settings::createConnection();

  $stmt = $conn->prepare("DELETE FROM licenses WHERE license = :license");
  $stmt->bindParam(':license', $license, PDO::PARAM_STR);
  $stmt->execute();
}catch(PDOException $e) {}
$conn = null;

$_SESSION['page'] = "licenses";
header("Location: ../..");
?>