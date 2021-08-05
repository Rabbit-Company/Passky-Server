<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

require_once "Errors.php";
require_once "Display.php";
require_once "Settings.php";

require_once 'PHPMailer/src/Exception.php';
require_once 'PHPMailer/src/PHPMailer.php';
require_once 'PHPMailer/src/SMTP.php';

class Database{

    public static function isUsernameTaken(string $username) : int{
        try{
            $username = strtolower($username);
        	$conn = new PDO("mysql:host=" . Settings::getDBHost() . ";dbname=passky", Settings::getDBUsername(), Settings::getDBPassword());
        	$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        	$stmt = $conn->prepare("SELECT * FROM users WHERE username = :username");
        	$stmt->bindParam(':username', $username, PDO::PARAM_STR);
        	$stmt->execute();

            return ($stmt->rowCount() == 0) ? 0 : 1;

        }catch(PDOException $e) {
            return 505;
        }
        $conn = null;
    }

    public static function encryptPassword(string $password) : string{
        return password_hash($password, PASSWORD_DEFAULT);
    }

    public static function getUserIpAddress() : string {
        if(!empty($_SERVER['HTTP_CLIENT_IP'])) return $_SERVER['HTTP_CLIENT_IP'];
        if(!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) return $_SERVER['HTTP_X_FORWARDED_FOR'];
        return $_SERVER['REMOTE_ADDR'];
    }

    public static function userSentToManyRequests(string $action) : bool{
        $timer = 0;

        $timerOptions = [
            'createAccount' => Settings::getLimiterCreateAccount(),
            'getPasswords' => Settings::getLimiterGetPasswords(),
            'savePassword' => Settings::getLimiterSavePassword(),
            'importPasswords' => Settings::getLimiterImportPasswords(),
            'editPassword' => Settings::getLimiterEditPassword(),
            'deletePassword' => Settings::getLimiterDeletePassword(),
            'deleteAccount' => Settings::getLimiterDeleteAccount(),
            'forgotUsername' => Settings::getLimiterForgotUsername()
        ];

        $timer = $timerOptions[$action];

        $ips_array = json_decode(file_get_contents('ips.json'), true);

		if(!empty($ips_array[$action][self::getUserIpAddress()])){
			if((time() - $ips_array[$action][self::getUserIpAddress()]) < $timer) return true;
		}

		$ips_array[$action][self::getUserIpAddress()] = time();
		file_put_contents('ips.json', json_encode($ips_array));
        return false;
    }

    public static function isPasswordCorrect(string $username, string $password) : int {
        try{
            $username = strtolower($username);
        	$conn = new PDO("mysql:host=" . Settings::getDBHost() . ";dbname=passky", Settings::getDBUsername(), Settings::getDBPassword());
        	$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        	$stmt = $conn->prepare("SELECT password FROM users WHERE username = :username");
        	$stmt->bindParam(':username', $username, PDO::PARAM_STR);
        	$stmt->execute();

        	if($stmt->rowCount() == 1){
                $row = $stmt->fetch();
                return (password_verify($password, $row["password"])) ? 1 : 0;
        	}else{
                return 2;
        	}

        }catch(PDOException $e) {
        	return 505;
        }
        $conn = null;
    }

    public static function getUserCount(){
        try{
            $conn = new PDO("mysql:host=" . Settings::getDBHost() . ";dbname=passky", Settings::getDBUsername(), Settings::getDBPassword());
            $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

            $stmt = $conn->prepare("SELECT COUNT(*) AS 'amount' FROM users");
            $stmt->execute();

            return ($stmt->rowCount() == 1) ? $stmt->fetch()['amount'] : null;
        }catch(PDOException $e) {
            return null;
        }
        $conn = null;
    }

    public static function getPasswordCount($user_id){
        try{
            $conn = new PDO("mysql:host=" . Settings::getDBHost() . ";dbname=passky", Settings::getDBUsername(), Settings::getDBPassword());
            $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

            $stmt = $conn->prepare("SELECT COUNT(*) AS 'amount' FROM user_passwords WHERE user_id = :user_id;");
            $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
            $stmt->execute();

            return ($stmt->rowCount() == 1) ? $stmt->fetch()['amount'] : null;
        }catch(PDOException $e) {
            return null;
        }
        $conn = null;
    }

    public static function getUserId($username){
        try{
            $conn = new PDO("mysql:host=" . Settings::getDBHost() . ";dbname=passky", Settings::getDBUsername(), Settings::getDBPassword());
            $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

            $username = strtolower($username);

            $stmt = $conn->prepare("SELECT user_id FROM users WHERE username = :username");
            $stmt->bindParam(':username', $username, PDO::PARAM_STR);
            $stmt->execute();

    		if($stmt->rowCount() == 1){
                return $stmt->fetch()['user_id'];
    		}else{
    			return null;
    		}

        }catch(PDOException $e) {
            return null;
        }
        $conn = null;
    }

    public static function createAccount(string $username, string $email, string $password) : string{

        $amount_of_accounts = self::getUserCount();
        if($amount_of_accounts == null) return Display::json(505);
        if($amount_of_accounts >= Settings::getMaxAccounts()) return Display::json(15);

        $sub_email = filter_var($email, FILTER_SANITIZE_EMAIL);

        if(!preg_match("/^[a-z0-9.]{6,30}$/i", $username)) return Display::json(12);
        if(!filter_var($sub_email, FILTER_VALIDATE_EMAIL)) return Display::json(6);
        if(!preg_match("/^[a-z0-9]{128}$/i", $password)) return Display::json(5);

        switch(self::isUsernameTaken($username)){
            case 1:
                return Display::json(4);
            break;
            case 505:
                return Display::json(505);
            break;
        }

        $username = strtolower($username);
        $email = strtolower($email);
        $encrypted_password = self::encryptPassword($password);

        try{

            $conn = new PDO("mysql:host=" . Settings::getDBHost() . ";dbname=passky", Settings::getDBUsername(), Settings::getDBPassword());
            $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

            $stmt = $conn->prepare("INSERT INTO users(username, email, password) VALUES(:username, :email, :password);");
            $stmt->bindParam(':username', $username, PDO::PARAM_STR);
            $stmt->bindParam(':email', $email, PDO::PARAM_STR);
            $stmt->bindParam(':password', $encrypted_password, PDO::PARAM_STR);

            return ($stmt->execute()) ? Display::json(0) : Display::json(3);
        }catch(PDOException $e) {
            return Display::json(505);
        }
        $conn = null;
    }

    public static function deleteAccount(string $username, string $password) : string{
        if(!preg_match("/^[a-z0-9.]{6,30}$/i", $username)) return Display::json(1);
        if(!preg_match("/^[a-z0-9]{128}$/i", $password)) return Display::json(5);
        switch(self::isPasswordCorrect($username, $password)){
            case 0:
                return Display::json(2);
            break;
            case 2:
                return Display::json(1);
            break;
            case 505:
                return Display::json(505);
            break;
        }

        $username = strtolower($username);
        $user_id = self::getUserId($username);

        if($user_id == null) return Display::json(1);

        $passwords_obj = json_decode(self::getPasswords($username, $password), true);
        if($passwords_obj["error"] == 0){
            foreach($passwords_obj["passwords"] as &$password_data){
                self::deletePassword($username, $password, $password_data['id']);
            }
        }

        try{

            $conn = new PDO("mysql:host=" . Settings::getDBHost() . ";dbname=passky", Settings::getDBUsername(), Settings::getDBPassword());
            $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

            $stmt = $conn->prepare("DELETE FROM users WHERE user_id = :user_id;");
            $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);

            return ($stmt->execute()) ? Display::json(0) : Display::json(11);
        }catch(PDOException $e) {
            return Display::json(505);
        }
        $conn = null;
    }

    public static function isPasswordOwnedByUser(string $username, int $password_id) : int{
      if(!preg_match("/^[a-z0-9.]{6,30}$/i", $username)) return 3;

      try{
        $username = strtolower($username);
        $conn = new PDO("mysql:host=" . Settings::getDBHost() . ";dbname=passky", Settings::getDBUsername(), Settings::getDBPassword());
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        $stmt = $conn->prepare("SELECT p.password_id FROM passwords p JOIN user_passwords up ON up.password_id = p.password_id JOIN users u ON u.user_id = up.user_id WHERE u.username = :username AND p.password_id = :password_id");
        $stmt->bindParam(':username', $username, PDO::PARAM_STR);
        $stmt->bindParam(':password_id', $password_id, PDO::PARAM_INT);
        $stmt->execute();

        return ($stmt->rowCount() == 1) ? 1 : 2;
      }catch(PDOException $e) {
        return 505;
      }
      $conn = null;
    }

    public static function savePassword(string $username, string $password, string $website, string $username2, string $password2) : string{

        if(!preg_match("/^[a-z0-9.]{6,30}$/i", $username)) return Display::json(1);
        if(!preg_match("/^[a-z0-9]{128}$/i", $password)) return Display::json(5);

        if(!(strlen($password2) >= 8 && strlen($password2) <= 255) || str_contains($password2, ' ') || str_contains($password2, '"') || str_contains($password2, "\\") || str_contains($password2, "'")) return Display::json(5);
        if(!(strlen($username2) >= 3 && strlen($username2) <= 255) || str_contains($username2, ' ') || str_contains($username2, '"') || str_contains($username2, "\\") || str_contains($username2, "'")) return Display::json(1);
        if(false === filter_var($website, FILTER_VALIDATE_DOMAIN) || strlen($website) > 255 || str_contains($website, ' ') || str_contains($website, '"') || str_contains($website, "\\") || str_contains($website, "'")) return Display::json(9);

        switch(self::isPasswordCorrect($username, $password)){
            case 0:
                return Display::json(2);
            break;
            case 2:
                return Display::json(1);
            break;
            case 505:
                return Display::json(505);
            break;
        }

        $website = strtolower($website);
        $user_id = self::getUserId($username);

        if($user_id == null) return Display::json(1);

        $password_count = self::getPasswordCount($user_id);
        if($password_count == null) return Display::json(505);
        if($password_count >= Settings::getMaxPasswords()) return Display::json(16);

        try{

            $conn = new PDO("mysql:host=" . Settings::getDBHost() . ";dbname=passky", Settings::getDBUsername(), Settings::getDBPassword());
            $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

            $conn->beginTransaction();

            $stmt = $conn->prepare("INSERT INTO passwords(website, username, password) VALUES(:website, :username, :password);");
            $stmt->bindParam(':website', $website, PDO::PARAM_STR);
            $stmt->bindParam(':username', $username2, PDO::PARAM_STR);
            $stmt->bindParam(':password', $password2, PDO::PARAM_STR);

            $stmt->execute();
            $password_id = $conn->lastInsertId("password_id");

            $stmt = $conn->prepare("INSERT INTO user_passwords(password_id, user_id) VALUES(:password_id, :user_id);");
            $stmt->bindParam(':password_id', $password_id, PDO::PARAM_INT);
            $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);

            $stmt->execute();

            return ($conn->commit()) ? Display::json(0) : Display::json(3);
        }catch(PDOException $e) {
            return Display::json(505);
        }
        $conn = null;
    }

    public static function importPasswords(string $username, string $password, string $json_passwords) : string{

        if(!preg_match("/^[a-z0-9.]{6,30}$/i", $username)) return Display::json(1);
        if(!preg_match("/^[a-z0-9]{128}$/i", $password)) return Display::json(5);

        $password_obj = json_decode($json_passwords, true);
        if($password_obj === null && json_last_error() !== JSON_ERROR_NONE) return Display::json(14);

        switch(self::isPasswordCorrect($username, $password)){
            case 0:
                return Display::json(2);
            break;
            case 2:
                return Display::json(1);
            break;
            case 505:
                return Display::json(505);
            break;
        }

        $user_id = self::getUserId($username);
        if($user_id == null) return Display::json(1);

        $password_count = self::getPasswordCount($user_id);
        if($password_count == null) return Display::json(505);
        if($password_count + count($password_obj) >= Settings::getMaxPasswords()) return Display::json(16);

        $num_success = 0;
        $num_error = 0;

        foreach($password_obj as &$password_data){
            if(!(strlen($password_data["password"]) >= 8 && strlen($password_data["password"]) <= 255) || str_contains($password_data["password"], ' ') || str_contains($password_data["password"], '"') || str_contains($password_data["password"], "\\") || str_contains($password_data["password"], "'")){ $num_error++; continue; }
            if(!(strlen($password_data["username"]) >= 3 && strlen($password_data["username"]) <= 255) || str_contains($password_data["username"], ' ') || str_contains($password_data["username"], '"') || str_contains($password_data["username"], "\\") || str_contains($password_data["username"], "'")){ $num_error++; continue; }
            if(false === filter_var($password_data["website"], FILTER_VALIDATE_DOMAIN) || strlen($password_data["website"]) > 255 || str_contains($password_data["website"], ' ') || str_contains($password_data["website"], '"') || str_contains($password_data["website"], "\\") || str_contains($password_data["website"], "'")){ $num_error++; continue; }

            $website = strtolower($password_data["website"]);

            try{

                $conn = new PDO("mysql:host=" . Settings::getDBHost() . ";dbname=passky", Settings::getDBUsername(), Settings::getDBPassword());
                $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
                $conn->beginTransaction();
    
                $stmt = $conn->prepare("INSERT INTO passwords(website, username, password) VALUES(:website, :username, :password);");
                $stmt->bindParam(':website',  $website, PDO::PARAM_STR);
                $stmt->bindParam(':username', $password_data["username"], PDO::PARAM_STR);
                $stmt->bindParam(':password', $password_data["password"], PDO::PARAM_STR);
    
                $stmt->execute();
                $password_id = $conn->lastInsertId("password_id");
    
                $stmt = $conn->prepare("INSERT INTO user_passwords(password_id, user_id) VALUES(:password_id, :user_id);");
                $stmt->bindParam(':password_id', $password_id, PDO::PARAM_INT);
                $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    
                $stmt->execute();
    
                ($conn->commit()) ? $num_success++ : $num_error++;
            }catch(PDOException $e) {
                $num_error++;
            }
            $conn = null;
        }

        $JSON_OBJ = new StdClass;
        $JSON_OBJ->import_success = $num_success;
        $JSON_OBJ->import_error = $num_error;
        return Display::json(0, $JSON_OBJ);
    }

    public static function editPassword(string $username, string $password, int $password_id, string $website, string $username2, string $password2) : string{
        if(!preg_match("/^[a-z0-9.]{6,30}$/i", $username)) return Display::json(1);
        if(!preg_match("/^[a-z0-9]{128}$/i", $password)) return Display::json(5);

        if(!(strlen($password2) >= 8 && strlen($password2) <= 255) || str_contains($password2, ' ') || str_contains($password2, '"') || str_contains($password2, "\\") || str_contains($password2, "'")) return Display::json(5);
        if(!(strlen($username2) >= 3 && strlen($username2) <= 255) || str_contains($username2, ' ') || str_contains($username2, '"') || str_contains($username2, "\\") || str_contains($username2, "'")) return Display::json(1);
        if(false === filter_var($website, FILTER_VALIDATE_DOMAIN) || strlen($website) > 255 || str_contains($website, ' ') || str_contains($website, '"') || str_contains($website, "\\") || str_contains($website, "'")) return Display::json(9);

        switch(self::isPasswordCorrect($username, $password)){
            case 0:
                return Display::json(2);
            break;
            case 2:
                return Display::json(1);
            break;
            case 505:
                return Display::json(505);
            break;
        }

        switch(self::isPasswordOwnedByUser($username, $password_id)){
            case 2:
                return Display::json(10);
            break;
            case 3:
                return Display::json(1);
            break;
            case 505:
                return Display::json(505);
            break;
        }

        try{
            $website = strtolower($website);
            $username = strtolower($username);
        	$conn = new PDO("mysql:host=" . Settings::getDBHost() . ";dbname=passky", Settings::getDBUsername(), Settings::getDBPassword());
        	$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

            $stmt = $conn->prepare("UPDATE passwords SET website = :website, username = :username, password = :password WHERE password_id = :password_id");
            $stmt->bindParam(':website', $website, PDO::PARAM_STR);
            $stmt->bindParam(':username', $username2, PDO::PARAM_STR);
            $stmt->bindParam(':password', $password2, PDO::PARAM_STR);
            $stmt->bindParam(':password_id', $password_id, PDO::PARAM_INT);
        	$stmt->execute();

        	return ($stmt->rowCount() == 1) ? Display::json(0) : Display::json(13);
        }catch(PDOException $e) {
        	return Display::json(505);
        }
        $conn = null;

    }

    public static function deletePassword(string $username, string $password, int $password_id) : string{
        if(!preg_match("/^[a-z0-9.]{6,30}$/i", $username)) return Display::json(1);
        if(!preg_match("/^[a-z0-9]{128}$/i", $password)) return Display::json(5);

        switch(self::isPasswordCorrect($username, $password)){
            case 0:
                return Display::json(2);
            break;
            case 2:
                return Display::json(1);
            break;
            case 505:
                return Display::json(505);
            break;
        }

        switch(self::isPasswordOwnedByUser($username, $password_id)){
            case 2:
                return Display::json(10);
            break;
            case 3:
                return Display::json(1);
            break;
            case 505:
                return Display::json(505);
            break;
        }

        try{
            $username = strtolower($username);
        	$conn = new PDO("mysql:host=" . Settings::getDBHost() . ";dbname=passky", Settings::getDBUsername(), Settings::getDBPassword());
        	$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        	$stmt = $conn->prepare("DELETE FROM user_passwords WHERE password_id = :password_id");
            $stmt->bindParam(':password_id', $password_id, PDO::PARAM_INT);
        	$stmt->execute();

            $stmt = $conn->prepare("DELETE FROM passwords WHERE password_id = :password_id");
            $stmt->bindParam(':password_id', $password_id, PDO::PARAM_INT);
        	$stmt->execute();

        	return ($stmt->rowCount() == 1) ? Display::json(0) : Display::json(11);
        }catch(PDOException $e) {
        	return Display::json(505);
        }
        $conn = null;
    }

    public static function getPasswords(string $username, string $password) : string{
        if(!preg_match("/^[a-z0-9]{128}$/i", $password)) return Display::json(5);

        switch(self::isPasswordCorrect($username, $password)){
            case 0:
                return Display::json(2);
            break;
            case 2:
                return Display::json(1);
            break;
            case 505:
                return Display::json(505);
            break;
        }

        $username = strtolower($username);

        try{

        	$conn = new PDO("mysql:host=" . Settings::getDBHost() . ";dbname=passky", Settings::getDBUsername(), Settings::getDBPassword());
        	$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        	$stmt = $conn->prepare("SELECT p.password_id AS id, p.website, p.username, p.password FROM passwords p JOIN user_passwords up ON up.password_id = p.password_id JOIN users u ON u.user_id = up.user_id WHERE u.username = :username");
        	$stmt->bindParam(':username', $username, PDO::PARAM_STR);
        	$stmt->execute();

        	if($stmt->rowCount() > 0){
                $JSON_OBJ = new StdClass;
                $JSON_OBJ->passwords = $stmt->fetchAll(PDO::FETCH_ASSOC);
                return Display::json(0, $JSON_OBJ);
        	}else{
                return Display::json(8);
        	}

        }catch(PDOException $e) {
            return Display::json(505);
        }
        $conn = null;
    }

    public static function forgotUsername(string $email) : string{
        $sub_email = filter_var($email, FILTER_SANITIZE_EMAIL);
        if(!filter_var($sub_email, FILTER_VALIDATE_EMAIL)) return Display::json(6);

        try{

        	$conn = new PDO("mysql:host=" . Settings::getDBHost() . ";dbname=passky", Settings::getDBUsername(), Settings::getDBPassword());
        	$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        	$stmt = $conn->prepare("SELECT username FROM users WHERE email = :email");
        	$stmt->bindParam(':email', $sub_email, PDO::PARAM_STR);
        	$stmt->execute();

        	if($stmt->rowCount() > 0){
                $message = "Usernames registered with your email: ";

                $html = "<p>Usernames registered with your email: <ul>";

                foreach($stmt->fetchAll(PDO::FETCH_ASSOC) as &$array_username){
                    $html .= "<li style='font-weight: bold;'>" . $array_username["username"] . "</li>";
                    $message .= $array_username["username"] . ", ";
                }

                $html .= "</ul></p>";

                $mail = new PHPMailer(true);

                try {
                    /*

                    Uncomment this if you want to debug SMTP connection

                    $mail->SMTPDebug = SMTP::DEBUG_SERVER;
                    $mail->SMTPDebug = 2;
                    
                    */

                    $mail->isSMTP();
                    $mail->Host       = Settings::getMailHost();
                    $mail->SMTPAuth   = true;
                    $mail->Username   = Settings::getMailUsername();
                    $mail->Password   = Settings::getMailPassword();
                    $mail->SMTPSecure = (Settings::getMailTLS()) ? PHPMailer::ENCRYPTION_STARTTLS : PHPMailer::ENCRYPTION_SMTPS;
                    $mail->Port       = Settings::getMailPort();
                
                    $mail->setFrom(Settings::getMailUsername(), 'Passky');
                    $mail->addAddress($email);
                    $mail->addReplyTo(Settings::getMailUsername(), 'Passky');
                
                    $mail->isHTML(true);
                    $mail->Subject = 'Usernames under your email';
                    $mail->Body    = $html;
                    $mail->AltBody = $message;

                    if($mail->send()) return Display::json(0);
                
                    return Display::json(505);
                } catch (Exception $e) {
                    return Display::json(506);
                }
        	}else{
                return Display::json(17);
        	}

        }catch(PDOException $e) {
            return Display::json(505);
        }
        $conn = null;
    }

}

?>
