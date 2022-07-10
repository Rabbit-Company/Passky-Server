<?php
require_once "../../Settings.php";

session_start();

if(!isset($_SESSION['username'])){
  $_SESSION['page'] = "home";
  header("Location: ../..");
  return;
}

$username = $_GET['username'];
$email = $_GET['email'];
$maxPasswords = $_GET['max_passwords'];
$disable2fa = $_GET['disable2fa'];

$sub_email = filter_var($email, FILTER_SANITIZE_EMAIL);

if(!ctype_digit($maxPasswords)) $maxPasswords = Settings::getMaxPasswords();
if($maxPasswords < 0) $maxPasswords = 0;
if($maxPasswords > 50000) $maxPasswords = 50000;

try{
  $conn = new PDO("mysql:host=" . Settings::getDBHost() . ";dbname=" . Settings::getDBName(), Settings::getDBUsername(), Settings::getDBPassword());
  $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

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