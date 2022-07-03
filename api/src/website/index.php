<?php
session_start();
require_once "header.php";
require_once "footer.php";

$pageNames = array("server", "settings");

if(in_array($_SESSION['page'], $pageNames)){
  require_once $_SESSION['page'] . ".php";
}else{
  require_once "home.php";
}
?>