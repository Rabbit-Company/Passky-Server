<?php
require_once "Display.php";
require_once "Database.php";
?>

<!DOCTYPE html>
<html>
<head>
	<title>Passky API</title>
</head>
<body>

<?php
if(!empty($_POST['action'])){
    switch($_POST['action']){
        case "createAccount":
			if(!empty($_POST['username']) && !empty($_POST['email']) && !empty($_POST['password'])){
				echo Database::createAccount($_POST['username'], $_POST['email'], $_POST['password']);
			}else{
				echo Display::json(403);
			}
        break;
		case "getPasswords":
			if(!empty($_POST['username']) && !empty($_POST['password'])){
				echo Database::getPasswords($_POST['username'], $_POST['password']);
			}else{
				echo Display::json(403);
			}
		break;
        default:
            echo Display::json(401);
        break;
    }
}else{
    echo Display::json(400);
}
?>

</body>
</html>
