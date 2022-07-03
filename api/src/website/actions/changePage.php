<?php
session_start();

$page = htmlspecialchars($_GET['page']);
if(!isset($page)) header("Location: ../..");

$_SESSION['page'] = $page;
header("Location: ../..");
?>