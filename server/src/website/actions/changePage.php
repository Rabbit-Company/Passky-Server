<?php
session_start();

$page = htmlspecialchars($_GET['page']);
if(!isset($page)) $_SESSION['page'] = 'home';

$_SESSION['page'] = $page;
header('Location: ../..');
?>