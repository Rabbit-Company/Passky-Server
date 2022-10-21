<?php
require_once "../../Settings.php";

session_start();

$token = filter_input(INPUT_GET, 'token', FILTER_SANITIZE_STRING);

if(!isset($_SESSION['username']) || !isset($_SESSION['token']) || !$token || $token !== $_SESSION['token']){
  $_SESSION['page'] = "home";
  header("Location: ../..");
  exit();
}

$username = $_GET['username'];

try{
  $conn = Settings::createConnection();

  $stmt = $conn->prepare("DELETE FROM passwords WHERE owner = :owner");
  $stmt->bindParam(':owner', $username, PDO::PARAM_STR);
  if(!($stmt->execute())){
    $_SESSION['page'] = "accounts";
    header("Location: ../..");
    exit();
  }

  $stmt = $conn->prepare("DELETE FROM users WHERE username = :username");
  $stmt->bindParam(':username', $username, PDO::PARAM_STR);
  $stmt->execute();
}catch(PDOException $e) {}
$conn = null;

for($i = 1; $i <= 10; $i++) Settings::removeLocalData('admin_accounts_page_' . $i);
Settings::removeLocalData('admin_accounts_users_count');

$_SESSION['page'] = "accounts";
header("Location: ../..");
?>