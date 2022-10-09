<?php
session_start();
require_once "header.php";
require_once "footer.php";

$pageNames = array("server", "accounts", "health", "settings", "login");

if(isset($_SESSION['page']) && in_array($_SESSION['page'], $pageNames)){
  require_once $_SESSION['page'] . ".php";
}else{
  require_once "home.php";
}
?>