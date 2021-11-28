<?php
use PragmaRX\Google2FA\Google2FA;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

require_once "Errors.php";
require_once "Display.php";
require_once "Settings.php";
require_once "User.php";

require 'vendor/autoload.php';

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

    public static function generateNonce() : string{
        $nonce = "";
        for($i = 0; $i < 5; $i++) $nonce .= rand(100000,999999) . "p";
        $nonce = substr($nonce, 0, -1);
        return $nonce;
    }

    public static function generateCodes() : string{
        $codes = "";
        for($i = 0; $i < 10; $i++) $codes .= rand(100000,999999) . ";";
        $codes = substr($codes, 0, -1);
        return $codes;
    }

    public static function getUserIpAddress() : string {
        if(!empty($_SERVER['HTTP_CLIENT_IP'])) return hash("sha256", $_SERVER['HTTP_CLIENT_IP'] . "passky2020");
        if(!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) return hash("sha256", $_SERVER['HTTP_X_FORWARDED_FOR'] . "passky2020");
        return hash("sha256", $_SERVER['REMOTE_ADDR'] . "passky2020");
    }

    public static function userSentToManyRequests(string $action) : bool{

        $timerOptions = [
            'getInfo' => Settings::getLimiterGetInfo(),
            'getToken' => Settings::getLimiterGetToken(),
            'createAccount' => Settings::getLimiterCreateAccount(),
            'getPasswords' => Settings::getLimiterGetPasswords(),
            'savePassword' => Settings::getLimiterSavePassword(),
            'importPasswords' => Settings::getLimiterImportPasswords(),
            'editPassword' => Settings::getLimiterEditPassword(),
            'deletePassword' => Settings::getLimiterDeletePassword(),
            'deleteAccount' => Settings::getLimiterDeleteAccount(),
            'forgotUsername' => Settings::getLimiterForgotUsername(),
            'enable2fa' => Settings::getLimiterEnable2fa(),
            'disable2fa' => Settings::getLimiterDisable2fa(),
            'addYubiKey' => Settings::getLimiterAddYubiKey(),
            'removeYubiKey' => Settings::getLimiterRemoveYubiKey()
        ];

        $timer = $timerOptions[$action];
        if($timer < 1) return false;

        $ips_array = json_decode(file_get_contents('../api-limiter.json'), true);

        $ip = self::getUserIpAddress();
		if(!empty($ips_array[$action][$ip])){
			if((time() - $ips_array[$action][$ip]) < $timer) return true;
		}

		$ips_array[$action][$ip] = time();
		file_put_contents('../api-limiter.json', json_encode($ips_array));
        return false;
    }

    public static function isYubiOTPValid(string $otp) : int{
        if(strlen($otp) != 44) return 0;

        $nonce = self::generateNonce();
        $result = file_get_contents(Settings::getYubiCloud() . '?id=' . Settings::getYubiId() . '&nonce=' . $nonce . '&otp=' . $otp . '&sl=secure&timestamp=1');

        if(str_contains($result, 'nonce=' . $nonce) && str_contains($result, 'status=OK')) return 1;
        return 0;
    }

    public static function is2FaValid(string $username, ?string $otp, ?string $secret, ?string $otps) : int {

        if($secret == null && $otps == null) return 1;
        if($otp == null) return 0;

        if(strlen($otp) == 6){
            if($secret == null) return 0;
            $google2fa = new Google2FA();
            return $google2fa->verifyKey($secret, $otp);
        }else if(strlen($otp) == 44){
            if($otps == null) return 0;
            if(!str_contains($otps, substr($otp, 0, 12))) return 0;
            return self::isYubiOTPValid($otp);
        }
        return 0;
    }

    public static function isTokenValid(string $username, string $token) : int{
        if($token == null || strlen($token) != 64) return 0;

        $token_array = json_decode(file_get_contents('../tokens.json'), true);
        $userID = $username . "-" . self::getUserIpAddress();
        if(!empty($token_array[$userID])){
            if($token_array[$userID] == $token) return 1;
        }
        return 0;
    }

    public static function getUserCount() : int{
        try{
            $conn = new PDO("mysql:host=" . Settings::getDBHost() . ";dbname=passky", Settings::getDBUsername(), Settings::getDBPassword());
            $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

            $stmt = $conn->prepare("SELECT COUNT(*) AS 'amount' FROM users");
            $stmt->execute();

            return ($stmt->rowCount() == 1) ? $stmt->fetch()['amount'] : -1;
        }catch(PDOException $e) {
            return -1;
        }
        $conn = null;
    }

    public static function getPasswordCount($user_id) : int{
        try{
            $conn = new PDO("mysql:host=" . Settings::getDBHost() . ";dbname=passky", Settings::getDBUsername(), Settings::getDBPassword());
            $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

            $stmt = $conn->prepare("SELECT COUNT(*) AS 'amount' FROM user_passwords WHERE user_id = :user_id;");
            $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
            $stmt->execute();

            return ($stmt->rowCount() == 1) ? $stmt->fetch()['amount'] : -1;
        }catch(PDOException $e) {
            return -1;
        }
        $conn = null;
    }

    public static function getInfo() : string{
        $JSON_OBJ = new StdClass;
        $JSON_OBJ->version = "v5.0.0";
        $JSON_OBJ->users = self::getUserCount();
        $JSON_OBJ->maxUsers = Settings::getMaxAccounts();
        $JSON_OBJ->maxPasswords = Settings::getMaxPasswords();
        $JSON_OBJ->location = Settings::getLocation();
        return Display::json(0, $JSON_OBJ);
    }

    public static function createAccount(string $username, string $password, string $email) : string{

        $amount_of_accounts = self::getUserCount();
        if($amount_of_accounts == -1) return Display::json(505);
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

    public static function getToken(string $username, string $password, string $otp) : string{
        if(!preg_match("/^[a-z0-9.]{6,30}$/i", $username)) return Display::json(12);
        if(!preg_match("/^[a-z0-9]{128}$/i", $password)) return Display::json(5);

        $user = new User;
        $user->fromUsername($username);

        switch($user->response){
            case 1:
                return Display::json(1);
            break;
            case 505:
                return Display::json(505);
            break;
        }

        if(self::is2FaValid($user->username, $otp, $user->secret, $user->yubico_otp) == 0) return Display::json(19);
     
        if(!password_verify($password, $user->password)) return Display::json(2);

        $token_array = json_decode(file_get_contents('../tokens.json'), true);
        $userID = $username . "-" . self::getUserIpAddress();
        if(empty($token_array[$userID])){
            $token = hash("sha256", self::generateCodes());
            $token_array[$userID] = $token;
            file_put_contents('../tokens.json', json_encode($token_array));
        }else{
            $token = $token_array[$userID];
        }

        $username = strtolower($username);

        $today = date('Y-m-d');
        if($user->accessed != $today){
            try{
                $conn = new PDO("mysql:host=" . Settings::getDBHost() . ";dbname=passky", Settings::getDBUsername(), Settings::getDBPassword());
                $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
                $stmt = $conn->prepare("UPDATE users SET accessed = :accessed WHERE username = :username");
                $stmt->bindParam(':username', $username, PDO::PARAM_STR);
                $stmt->bindParam(':accessed', $today, PDO::PARAM_STR);
                $stmt->execute();
            }catch(PDOException $e) {}
            $conn = null;
        }

        try{

        	$conn = new PDO("mysql:host=" . Settings::getDBHost() . ";dbname=passky", Settings::getDBUsername(), Settings::getDBPassword());
        	$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        	$stmt = $conn->prepare("SELECT p.password_id AS id, p.website, p.username, p.password, p.message FROM passwords p JOIN user_passwords up ON up.password_id = p.password_id JOIN users u ON u.user_id = up.user_id WHERE u.username = :username");
        	$stmt->bindParam(':username', $username, PDO::PARAM_STR);
        	$stmt->execute();

            $JSON_OBJ = new StdClass;
            $JSON_OBJ->token = $token;
            $JSON_OBJ->auth = ($user->secret != null);
            $JSON_OBJ->yubico = $user->yubico_otp;

        	if($stmt->rowCount() > 0){
                $JSON_OBJ->passwords = $stmt->fetchAll(PDO::FETCH_ASSOC);
                return Display::json(0, $JSON_OBJ);
        	}

            return Display::json(8, $JSON_OBJ);

        }catch(PDOException $e) {
            return Display::json(505);
        }
        $conn = null;
    }

    public static function deleteAccount(string $username, string $token) : string{
        if(!preg_match("/^[a-z0-9.]{6,30}$/i", $username)) return Display::json(1);
        if(!self::isTokenValid($username, $token)) return Display::json(25);

        $user = new User;
        $user->fromUsername($username);

        switch($user->response){
            case 1:
                return Display::json(1);
            break;
            case 505:
                return Display::json(505);
            break;
        }

        $passwords_obj = json_decode(self::getPasswords($user->username, $token), true);
        if($passwords_obj["error"] == 0){
            foreach($passwords_obj["passwords"] as &$password_data){
                self::deletePassword($user->username, $token, $password_data['id']);
            }
        }

        try{

            $conn = new PDO("mysql:host=" . Settings::getDBHost() . ";dbname=passky", Settings::getDBUsername(), Settings::getDBPassword());
            $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

            $stmt = $conn->prepare("DELETE FROM users WHERE user_id = :user_id;");
            $stmt->bindParam(':user_id', $user->user_id, PDO::PARAM_INT);

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

    public static function savePassword(string $username, string $token, string $website, string $username2, string $password2, string $message) : string{

        if(!preg_match("/^[a-z0-9.]{6,30}$/i", $username)) return Display::json(1);
        if(!self::isTokenValid($username, $token)) return Display::json(25);

        if(!(strlen($password2) >= 5 && strlen($password2) <= 255)) return Display::json(5);
        if(!(strlen($username2) >= 3 && strlen($username2) <= 255)) return Display::json(1);
        if(false === filter_var($website, FILTER_VALIDATE_DOMAIN) || strlen($website) > 255 || str_contains($website, ' ')) return Display::json(9);
        if(strlen($message) > 10000) return Display::json(18);

        $user = new User;
        $user->fromUsername($username);

        switch($user->response){
            case 1:
                return Display::json(1);
            break;
            case 505:
                return Display::json(505);
            break;
        }

        $website = strtolower($website);

        $password_count = self::getPasswordCount($user->user_id);
        if($password_count == -1) return Display::json(505);
        if($password_count >= Settings::getMaxPasswords()) return Display::json(16);

        try{

            $conn = new PDO("mysql:host=" . Settings::getDBHost() . ";dbname=passky", Settings::getDBUsername(), Settings::getDBPassword());
            $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

            $conn->beginTransaction();

            $stmt = $conn->prepare("INSERT INTO passwords(website, username, password, message) VALUES(:website, :username, :password, :message);");
            $stmt->bindParam(':website', $website, PDO::PARAM_STR);
            $stmt->bindParam(':username', $username2, PDO::PARAM_STR);
            $stmt->bindParam(':password', $password2, PDO::PARAM_STR);
            $stmt->bindParam(':message', $message, PDO::PARAM_STR);

            $stmt->execute();
            $password_id = $conn->lastInsertId("password_id");

            $stmt = $conn->prepare("INSERT INTO user_passwords(password_id, user_id) VALUES(:password_id, :user_id);");
            $stmt->bindParam(':password_id', $password_id, PDO::PARAM_INT);
            $stmt->bindParam(':user_id', $user->user_id, PDO::PARAM_INT);

            $stmt->execute();

            return ($conn->commit()) ? Display::json(0) : Display::json(3);
        }catch(PDOException $e) {
            return Display::json(505);
        }
        $conn = null;
    }

    public static function importPasswords(string $username, string $token, string $json_passwords) : string{

        if(!preg_match("/^[a-z0-9.]{6,30}$/i", $username)) return Display::json(1);
        if(!self::isTokenValid($username, $token)) return Display::json(25);

        $password_obj = json_decode($json_passwords, true);
        if($password_obj === null && json_last_error() !== JSON_ERROR_NONE) return Display::json(14);

        $user = new User;
        $user->fromUsername($username);

        switch($user->response){
            case 1:
                return Display::json(1);
            break;
            case 505:
                return Display::json(505);
            break;
        }

        $password_count = self::getPasswordCount($user->user_id);
        if($password_count == -1) return Display::json(505);
        if($password_count + count($password_obj) >= Settings::getMaxPasswords()) return Display::json(16);

        $num_success = 0;
        $num_error = 0;

        foreach($password_obj as &$password_data){
            if(!(strlen($password_data["password"]) >= 5 && strlen($password_data["password"]) <= 255)){ $num_error++; continue; }
            if(!(strlen($password_data["username"]) >= 3 && strlen($password_data["username"]) <= 255)){ $num_error++; continue; }
            if(false === filter_var($password_data["website"], FILTER_VALIDATE_DOMAIN) || strlen($password_data["website"]) > 255 || str_contains($password_data["website"], ' ')){ $num_error++; continue; }
            if(strlen($password_data["message"]) > 10000){ $num_error++; continue; }

            $website = strtolower($password_data["website"]);

            try{

                $conn = new PDO("mysql:host=" . Settings::getDBHost() . ";dbname=passky", Settings::getDBUsername(), Settings::getDBPassword());
                $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
                $conn->beginTransaction();
    
                $stmt = $conn->prepare("INSERT INTO passwords(website, username, password, message) VALUES(:website, :username, :password, :message);");
                $stmt->bindParam(':website',  $website, PDO::PARAM_STR);
                $stmt->bindParam(':username', $password_data["username"], PDO::PARAM_STR);
                $stmt->bindParam(':password', $password_data["password"], PDO::PARAM_STR);
                $stmt->bindParam(':message', $password_data["message"], PDO::PARAM_STR);
    
                $stmt->execute();
                $password_id = $conn->lastInsertId("password_id");
    
                $stmt = $conn->prepare("INSERT INTO user_passwords(password_id, user_id) VALUES(:password_id, :user_id);");
                $stmt->bindParam(':password_id', $password_id, PDO::PARAM_INT);
                $stmt->bindParam(':user_id', $user->user_id, PDO::PARAM_INT);
    
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

    public static function editPassword(string $username, string $token, int $password_id, string $website, string $username2, string $password2, string $message) : string{
        if(!preg_match("/^[a-z0-9.]{6,30}$/i", $username)) return Display::json(1);
        if(!self::isTokenValid($username, $token)) return Display::json(25);

        if(!(strlen($password2) >= 5 && strlen($password2) <= 255)) return Display::json(5);
        if(!(strlen($username2) >= 3 && strlen($username2) <= 255)) return Display::json(1);
        if(false === filter_var($website, FILTER_VALIDATE_DOMAIN) || strlen($website) > 255 || str_contains($website, ' ')) return Display::json(9);
        if(strlen($message) > 10000) return Display::json(18);

        $user = new User;
        $user->fromUsername($username);

        switch($user->response){
            case 1:
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
        	$conn = new PDO("mysql:host=" . Settings::getDBHost() . ";dbname=passky", Settings::getDBUsername(), Settings::getDBPassword());
        	$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

            $stmt = $conn->prepare("UPDATE passwords SET website = :website, username = :username, password = :password, message = :message WHERE password_id = :password_id");
            $stmt->bindParam(':website', $website, PDO::PARAM_STR);
            $stmt->bindParam(':username', $username2, PDO::PARAM_STR);
            $stmt->bindParam(':password', $password2, PDO::PARAM_STR);
            $stmt->bindParam(':message', $message, PDO::PARAM_STR);
            $stmt->bindParam(':password_id', $password_id, PDO::PARAM_INT);
        	$stmt->execute();

        	return ($stmt->rowCount() == 1) ? Display::json(0) : Display::json(13);
        }catch(PDOException $e) {
        	return Display::json(505);
        }
        $conn = null;

    }

    public static function deletePassword(string $username, string $token, int $password_id) : string{
        if(!preg_match("/^[a-z0-9.]{6,30}$/i", $username)) return Display::json(1);
        if(!self::isTokenValid($username, $token)) return Display::json(25);

        $user = new User;
        $user->fromUsername($username);

        switch($user->response){
            case 1:
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

    public static function getPasswords(string $username, string $token) : string{
        if(!preg_match("/^[a-z0-9.]{6,30}$/i", $username)) return Display::json(1);
        if(!self::isTokenValid($username, $token)) return Display::json(25);

        $user = new User;
        $user->fromUsername($username);

        switch($user->response){
            case 1:
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

        	$stmt = $conn->prepare("SELECT p.password_id AS id, p.website, p.username, p.password, p.message FROM passwords p JOIN user_passwords up ON up.password_id = p.password_id JOIN users u ON u.user_id = up.user_id WHERE u.username = :username");
        	$stmt->bindParam(':username', $username, PDO::PARAM_STR);
        	$stmt->execute();

            $JSON_OBJ = new StdClass;

        	if($stmt->rowCount() > 0){
                $JSON_OBJ->passwords = $stmt->fetchAll(PDO::FETCH_ASSOC);
                return Display::json(0, $JSON_OBJ);
        	}

            return Display::json(8, $JSON_OBJ);

        }catch(PDOException $e) {
            return Display::json(505);
        }
        $conn = null;
    }

    public static function enable2Fa(string $username, string $token) : string{
        if(!preg_match("/^[a-z0-9.]{6,30}$/i", $username)) return Display::json(1);
        if(!self::isTokenValid($username, $token)) return Display::json(25);

        $user = new User;
        $user->fromUsername($username);

        switch($user->response){
            case 1:
                return Display::json(1);
            break;
            case 505:
                return Display::json(505);
            break;
        }

        if($user->secret != null) return Display::json(26);

        $google2fa = new Google2FA();
        $secret = $google2fa->generateSecretKey();

        $codes = self::generateCodes();

        try{
            $username = strtolower($username);
        	$conn = new PDO("mysql:host=" . Settings::getDBHost() . ";dbname=passky", Settings::getDBUsername(), Settings::getDBPassword());
        	$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        	$stmt = $conn->prepare("UPDATE users SET 2fa_secret = :secret WHERE username = :username");
            $stmt->bindParam(':secret', $secret, PDO::PARAM_STR);
            $stmt->bindParam(':username', $username, PDO::PARAM_STR);
        	$stmt->execute();

        	$stmt = $conn->prepare("UPDATE users SET backup_codes = :codes WHERE username = :username");
            $stmt->bindParam(':codes', $codes, PDO::PARAM_STR);
            $stmt->bindParam(':username', $username, PDO::PARAM_STR);
        	$stmt->execute();

            $JSON_OBJ = new StdClass;
            $JSON_OBJ->secret = $secret;
            $JSON_OBJ->qrcode = $google2fa->getQRCodeUrl("Passky", $username, $secret);
            $JSON_OBJ->codes = $codes;
        	return Display::json(0, $JSON_OBJ);
        }catch(PDOException $e) {
        	return Display::json(505);
        }
        $conn = null;
    }

    public static function disable2Fa(string $username, string $token) : string{
        if(!preg_match("/^[a-z0-9.]{6,30}$/i", $username)) return Display::json(1);
        if(!self::isTokenValid($username, $token)) return Display::json(25);

        $user = new User;
        $user->fromUsername($username);

        switch($user->response){
            case 1:
                return Display::json(1);
            break;
            case 505:
                return Display::json(505);
            break;
        }
        
        if($user->secret == null) return Display::json(27);

        try{
            $username = strtolower($username);
        	$conn = new PDO("mysql:host=" . Settings::getDBHost() . ";dbname=passky", Settings::getDBUsername(), Settings::getDBPassword());
        	$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        	$stmt = $conn->prepare("UPDATE users SET 2fa_secret = null WHERE username = :username");
            $stmt->bindParam(':username', $username, PDO::PARAM_STR);
        	$stmt->execute();

        	return Display::json(0);
        }catch(PDOException $e) {
        	return Display::json(505);
        }
        $conn = null;
    }

    public static function addYubiKey(string $username, string $token, string $id){
        if(!preg_match("/^[a-z0-9.]{6,30}$/i", $username)) return Display::json(1);
        if(!self::isTokenValid($username, $token)) return Display::json(25);
        if(strlen($id) != 44) return Display::json(23);

        $user = new User;
        $user->fromUsername($username);

        switch($user->response){
            case 1:
                return Display::json(1);
            break;
            case 505:
                return Display::json(505);
            break;
        }

        if(!self::isYubiOTPValid($id)) return Display::json(23);
        $id = substr($id, 0, 12);

        if($user->yubico_otp == null){
            $yubico_otp = $id;
        }else{
            $yubi_keys = explode(';', $user->yubico_otp);
            if(count($yubi_keys) >= 5) return Display::json(20);
            if(in_array($id, $yubi_keys)) return Display::json(21);
            $yubico_otp = $user->yubico_otp . ";" . $id;
        }

        $codes = self::generateCodes();

        try{
            $username = strtolower($username);
        	$conn = new PDO("mysql:host=" . Settings::getDBHost() . ";dbname=passky", Settings::getDBUsername(), Settings::getDBPassword());
        	$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        	$stmt = $conn->prepare("UPDATE users SET yubico_otp = :yubico_otp WHERE username = :username");
            $stmt->bindParam(':yubico_otp', $yubico_otp, PDO::PARAM_STR);
            $stmt->bindParam(':username', $username, PDO::PARAM_STR);
        	$stmt->execute();

        	$stmt = $conn->prepare("UPDATE users SET backup_codes = :codes WHERE username = :username");
            $stmt->bindParam(':codes', $codes, PDO::PARAM_STR);
            $stmt->bindParam(':username', $username, PDO::PARAM_STR);
        	$stmt->execute();

            $JSON_OBJ = new StdClass;
            $JSON_OBJ->yubico = $yubico_otp;
            $JSON_OBJ->codes = $codes;
        	return Display::json(0, $JSON_OBJ);
        }catch(PDOException $e) {
        	return Display::json(505);
        }
        $conn = null;
    }

    public static function removeYubiKey(string $username, string $token, string $id){
        if(!preg_match("/^[a-z0-9.]{6,30}$/i", $username)) return Display::json(1);
        if(!self::isTokenValid($username, $token)) return Display::json(25);
        if(strlen($id) != 44) return Display::json(23);

        $user = new User;
        $user->fromUsername($username);

        switch($user->response){
            case 1:
                return Display::json(1);
            break;
            case 505:
                return Display::json(505);
            break;
        }

        if(!self::isYubiOTPValid($id)) return Display::json(23);
        $id = substr($id, 0, 12);

        if($user->yubico_otp == null) return Display::json(24);

        $yubi_keys = explode(';', $user->yubico_otp);
        if(!in_array($id, $yubi_keys)) return Display::json(24);

        $yubico_otp = str_replace(';' . $id, '', $user->yubico_otp);
        $yubico_otp = str_replace($id, '', $yubico_otp);

        try{
            $username = strtolower($username);
        	$conn = new PDO("mysql:host=" . Settings::getDBHost() . ";dbname=passky", Settings::getDBUsername(), Settings::getDBPassword());
        	$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

            $stmt = $conn->prepare("UPDATE users SET yubico_otp = :yubico_otp WHERE username = :username");
            $stmt->bindParam(':yubico_otp', $yubico_otp, PDO::PARAM_STR);
            $stmt->bindParam(':username', $username, PDO::PARAM_STR);
        	$stmt->execute();

            $JSON_OBJ = new StdClass;
            $JSON_OBJ->yubico = $yubico_otp;
        	return Display::json(0, $JSON_OBJ);
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
