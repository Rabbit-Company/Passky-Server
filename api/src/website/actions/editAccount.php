<?php
require_once "../../Settings.php";

session_start();

$token = filter_input(INPUT_GET, 'token', FILTER_SANITIZE_STRING);

if(!isset($_SESSION['username']) || !isset($_SESSION['token']) || !$token || $token !== $_SESSION['token']){
  $_SESSION['page'] = "home";
  header("Location: ../..");
  return;
}

$username = $_GET['username'];
$email = $_GET['email'];
$maxPasswords = $_GET['max_passwords'];
$disable2fa = $_GET['disable2fa'];

$sub_email = filter_var($email, FILTER_SANITIZE_EMAIL);

if(!is_numeric($maxPasswords)) $maxPasswords = Settings::getMaxPasswords();
if($maxPasswords < 0) $maxPasswords = -1;
if($maxPasswords > 1000000000) $maxPasswords = 1000000000;

try{
  $conn = Settings::createConnection();

  if(filter_var($sub_email, FILTER_VALIDATE_EMAIL)){
    $stmt = $conn->prepare("UPDATE users SET email = :email, max_passwords = :maxPasswords WHERE username = :username;");
    $stmt->bindParam(':username', $username, PDO::PARAM_STR);
    $stmt->bindParam(':email', $email, PDO::PARAM_STR);
    $stmt->bindParam(':maxPasswords', $maxPasswords, PDO::PARAM_INT);
    $stmt->execute();
  }else{
    $stmt = $conn->prepare("UPDATE users SET max_passwords = :maxPasswords WHERE username = :username;");
    $stmt->bindParam(':username', $username, PDO::PARAM_STR);
    $stmt->bindParam(':maxPasswords', $maxPasswords, PDO::PARAM_INT);
    $stmt->execute();
  }

  if($disable2fa){
    $stmt = $conn->prepare("UPDATE users SET 2fa_secret = null, yubico_otp = null, backup_codes = null WHERE username = :username;");
    $stmt->bindParam(':username', $username, PDO::PARAM_STR);
    $stmt->execute();
  }
}catch(PDOException $e) {}
$conn = null;

$_SESSION['page'] = "accounts";
header("Location: ../..");
?>