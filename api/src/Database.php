<?php
use PragmaRX\Google2FA\Google2FA;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

require_once "Errors.php";
require_once "Display.php";
require_once "Settings.php";
require_once "User.php";

class Database{

	public static function isUsernameTaken(string $username) : int{
		try{
			$conn = Settings::createConnection();

			$stmt = $conn->prepare("SELECT user_id FROM users WHERE username = :username");
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
		if(!empty($_SERVER['HTTP_CLIENT_IP'])) return hash("sha256", $_SERVER['HTTP_CLIENT_IP'] . "passky2020" . date("Ymd"));
		if(!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) return hash("sha256", $_SERVER['HTTP_X_FORWARDED_FOR'] . "passky2020" . date("Ymd"));
		return hash("sha256", $_SERVER['REMOTE_ADDR'] . "passky2020" . date("Ymd"));
	}

	public static function userSentToManyRequests(string $action) : bool{

		if(!Settings::getLimiter()) return false;

		$timerOptions = [
			'getInfo' => Settings::getLimiterGetInfo(),
			'getStats' => Settings::getLimiterGetStats(),
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
		$username = strtolower($username);
		if($token == null || strlen($token) != 64) return 0;
		$token_array = json_decode(file_get_contents('../tokens.json'), true);
		$userID = $username . "-" . self::getUserIpAddress();
		if(!empty($token_array[$userID]))
			if($token_array[$userID] == $token) return 1;
		return 0;
	}

	public static function getUserCount() : int{
		try{
			$conn = Settings::createConnection();

			$stmt = $conn->prepare("SELECT COUNT(*) AS 'amount' FROM users");
			$stmt->execute();

			return ($stmt->rowCount() == 1) ? $stmt->fetch()['amount'] : -1;
		}catch(PDOException $e) {
			return -1;
		}
		$conn = null;
	}

	public static function getPasswordCount() : int{
		try{
			$conn = Settings::createConnection();

			$stmt = $conn->prepare("SELECT TABLE_ROWS AS 'amount' FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'passwords'");
			$stmt->execute();

			return ($stmt->rowCount() == 1) ? $stmt->fetch()['amount'] : -1;
		}catch(PDOException $e) {
			return -1;
		}
		$conn = null;
	}

	public static function getUserPasswordCount($username) : int{
		try{
			$conn = Settings::createConnection();

			$stmt = $conn->prepare("SELECT COUNT(*) AS 'amount' FROM passwords WHERE owner = :owner");
			$stmt->bindParam(':owner', $username, PDO::PARAM_STR);
			$stmt->execute();

			return ($stmt->rowCount() == 1) ? $stmt->fetch()['amount'] : -1;
		}catch(PDOException $e) {
			return -1;
		}
		$conn = null;
	}

	public static function getInfo() : string{
		$JSON_OBJ = new StdClass;
		$JSON_OBJ->version = "v8.0.0";
		$JSON_OBJ->users = self::getUserCount();
		$JSON_OBJ->maxUsers = Settings::getMaxAccounts();
		$JSON_OBJ->passwords = self::getPasswordCount();
		$JSON_OBJ->maxPasswords = Settings::getMaxPasswords();
		$JSON_OBJ->location = Settings::getLocation();
		return Display::json(0, $JSON_OBJ);
	}

	public static function getStats() : string{
		$JSON_OBJ = new StdClass;
		$JSON_OBJ->cpu = sys_getloadavg()[0];
		$JSON_OBJ->cores = Settings::getCores();

		$free = shell_exec('free');
		$free = (string)trim($free);
		$free_arr = explode("\n", $free);
		$mem = explode(" ", $free_arr[1]);
		$mem = array_filter($mem, function($value) { return ($value !== null && $value !== false && $value !== ''); });
		$mem = array_merge($mem);

		$JSON_OBJ->memoryUsed = $mem[2];
		$JSON_OBJ->memoryTotal = $mem[1];

		$diskTotal = disk_total_space(".");
		$JSON_OBJ->diskUsed = ($diskTotal - disk_free_space("."));
		$JSON_OBJ->diskTotal = $diskTotal;
		return Display::json(0, $JSON_OBJ);
	}

	public static function createAccount(string $username, string $password, string $email) : string{

		if(Settings::getMaxAccounts() > 0){
			$amount_of_accounts = self::getUserCount();
			if($amount_of_accounts == -1) return Display::json(505);
			if($amount_of_accounts >= Settings::getMaxAccounts()) return Display::json(15);
		}

		$sub_email = filter_var($email, FILTER_SANITIZE_EMAIL);

		if(!preg_match("/^[a-z0-9._]{6,30}$/i", $username)) return Display::json(12);
		if(!filter_var($sub_email, FILTER_VALIDATE_EMAIL)) return Display::json(6);
		if(!preg_match("/^[a-z0-9]{128}$/i", $password)) return Display::json(5);

		$username = strtolower($username);
		$email = strtolower($email);
		$encrypted_password = self::encryptPassword($password);

		switch(self::isUsernameTaken($username)){
			case 1:
				return Display::json(4);
			break;
			case 505:
				return Display::json(505);
			break;
		}

		try{
			$conn = Settings::createConnection();

			$stmt = $conn->prepare("INSERT INTO users(username, email, password, max_passwords) VALUES(:username, :email, :password, :max_passwords);");
			$stmt->bindParam(':username', $username, PDO::PARAM_STR);
			$stmt->bindParam(':email', $email, PDO::PARAM_STR);
			$stmt->bindParam(':password', $encrypted_password, PDO::PARAM_STR);
			$stmt->bindParam(':max_passwords', Settings::getMaxPasswords(), PDO::PARAM_INT);

			return ($stmt->execute()) ? Display::json(0) : Display::json(3);
		}catch(PDOException $e) {
			return Display::json(505);
		}
		$conn = null;
	}

	public static function getToken(string $username, string $password, string $otp) : string{
		if(!preg_match("/^[a-z0-9._]{6,30}$/i", $username)) return Display::json(12);
		if(!preg_match("/^[a-z0-9]{128}$/i", $password)) return Display::json(5);
		$username = strtolower($username);

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

		$today = date('Y-m-d');
		if($user->accessed != $today){
			try{
				$conn = Settings::createConnection();

				$stmt = $conn->prepare("UPDATE users SET accessed = :accessed WHERE username = :username");
				$stmt->bindParam(':username', $username, PDO::PARAM_STR);
				$stmt->bindParam(':accessed', $today, PDO::PARAM_STR);
				$stmt->execute();
			}catch(PDOException $e) {}
			$conn = null;
		}

		try{
			$conn = Settings::createConnection();

			$stmt = $conn->prepare("SELECT password_id AS id, website, username, password, message FROM passwords WHERE owner = :owner");
			$stmt->bindParam(':owner', $username, PDO::PARAM_STR);
			$stmt->execute();

			$JSON_OBJ = new StdClass;
			$JSON_OBJ->token = $token;
			$JSON_OBJ->auth = ($user->secret != null);
			$JSON_OBJ->yubico = $user->yubico_otp;
			$JSON_OBJ->max_passwords = $user->max_passwords;

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
		if(!preg_match("/^[a-z0-9._]{6,30}$/i", $username)) return Display::json(1);
		if(!self::isTokenValid($username, $token)) return Display::json(25);
		$username = strtolower($username);

		try{
			$conn = Settings::createConnection();

			$stmt = $conn->prepare("DELETE FROM passwords WHERE owner = :owner;");
			$stmt->bindParam(':owner', $username, PDO::PARAM_STR);
			if(!($stmt->execute())) return Display::json(11);

			$stmt = $conn->prepare("DELETE FROM users WHERE username = :username;");
			$stmt->bindParam(':username', $username, PDO::PARAM_STR);
			return ($stmt->execute()) ? Display::json(0) : Display::json(11);
		}catch(PDOException $e) {
			return Display::json(505);
		}
		$conn = null;
	}

	public static function isPasswordOwnedByUser(string $username, int $password_id) : int{
		if(!preg_match("/^[a-z0-9._]{6,30}$/i", $username)) return 3;

		try{
			$conn = Settings::createConnection();

			$stmt = $conn->prepare("SELECT password_id FROM passwords WHERE owner = :owner AND password_id = :password_id");
			$stmt->bindParam(':owner', $username, PDO::PARAM_STR);
			$stmt->bindParam(':password_id', $password_id, PDO::PARAM_INT);
			$stmt->execute();

			return ($stmt->rowCount() == 1) ? 1 : 2;
		}catch(PDOException $e) {
			return 505;
		}
		$conn = null;
	}

	public static function savePassword(string $username, string $token, string $website, string $username2, string $password2, string $message) : string{
		if(!preg_match("/^[a-z0-9._]{6,30}$/i", $username)) return Display::json(1);
		if(!self::isTokenValid($username, $token)) return Display::json(25);
		$username = strtolower($username);

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

		if(!(strlen($website) >= 36 && strlen($website) <= 255) || str_contains($website, ' ')) return Display::json(300);
		if(!(strlen($username2) >= 36 && strlen($username2) <= 255) || str_contains($username2, ' ')) return Display::json(301);
		if(!(strlen($password2) >= 36 && strlen($password2) <= 255) || str_contains($password2, ' ')) return Display::json(302);
		if(!(strlen($message) >= 36 && strlen($message) <= 10000) || str_contains($message, ' ')) return Display::json(303);

		if($user->max_passwords >= 0){
			$password_count = self::getUserPasswordCount($username);
			if($password_count == -1) return Display::json(505);
			if($password_count >= $user->max_passwords) return Display::json(16);
		}

		try{
			$conn = Settings::createConnection();

			$stmt = $conn->prepare("INSERT INTO passwords(owner, website, username, password, message) VALUES(:owner, :website, :username, :password, :message)");
			$stmt->bindParam(':owner', $username, PDO::PARAM_STR);
			$stmt->bindParam(':website', $website, PDO::PARAM_STR);
			$stmt->bindParam(':username', $username2, PDO::PARAM_STR);
			$stmt->bindParam(':password', $password2, PDO::PARAM_STR);
			$stmt->bindParam(':message', $message, PDO::PARAM_STR);

			return ($stmt->execute()) ? Display::json(0) : Display::json(3);
		}catch(PDOException $e) {
			return Display::json(505);
		}
		$conn = null;
	}

	public static function importPasswords(string $username, string $token, string $json_passwords) : string{
		if(!preg_match("/^[a-z0-9._]{6,30}$/i", $username)) return Display::json(1);
		if(!self::isTokenValid($username, $token)) return Display::json(25);
		$username = strtolower($username);

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

		if($user->max_passwords >= 0){
			$password_count = self::getUserPasswordCount($username);
			if($password_count == -1) return Display::json(505);
			if($password_count + count($password_obj) >= $user->max_passwords) return Display::json(16);
		}

		$num_success = 0;
		$num_error = 0;

		foreach($password_obj as &$password_data){
			if(!(strlen($password_data["website"]) >= 36 && strlen($password_data["website"]) <= 255) || str_contains($password_data["website"], ' ')){ $num_error++; continue; }
			if(!(strlen($password_data["username"]) >= 36 && strlen($password_data["username"]) <= 255) || str_contains($password_data["username"], ' ')){ $num_error++; continue; }
			if(!(strlen($password_data["password"]) >= 36 && strlen($password_data["password"]) <= 255) || str_contains($password_data["password"], ' ')){ $num_error++; continue; }
			if(!(strlen($password_data["message"]) >= 36 && strlen($password_data["message"]) <= 10000) || str_contains($password_data["message"], ' ')){ $num_error++; continue; }

			try{
				$conn = Settings::createConnection();

				$stmt = $conn->prepare("INSERT INTO passwords(owner, website, username, password, message) VALUES(:owner, :website, :username, :password, :message)");
				$stmt->bindParam(':owner', $username, PDO::PARAM_STR);
				$stmt->bindParam(':website', $password_data["website"], PDO::PARAM_STR);
				$stmt->bindParam(':username', $password_data["username"], PDO::PARAM_STR);
				$stmt->bindParam(':password', $password_data["password"], PDO::PARAM_STR);
				$stmt->bindParam(':message', $password_data["message"], PDO::PARAM_STR);

				($stmt->execute()) ? $num_success++ : $num_error++;
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
		if(!preg_match("/^[a-z0-9._]{6,30}$/i", $username)) return Display::json(1);
		if(!self::isTokenValid($username, $token)) return Display::json(25);
		$username = strtolower($username);

		if(!(strlen($website) >= 36 && strlen($website) <= 255) || str_contains($website, ' ')) return Display::json(300);
		if(!(strlen($username2) >= 36 && strlen($username2) <= 255) || str_contains($username2, ' ')) return Display::json(301);
		if(!(strlen($password2) >= 36 && strlen($password2) <= 255) || str_contains($password2, ' ')) return Display::json(302);
		if(!(strlen($message) >= 36 && strlen($message) <= 10000) || str_contains($message, ' ')) return Display::json(303);

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
			$conn = Settings::createConnection();

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
		if(!preg_match("/^[a-z0-9._]{6,30}$/i", $username)) return Display::json(1);
		if(!self::isTokenValid($username, $token)) return Display::json(25);
		$username = strtolower($username);

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
			$conn = Settings::createConnection();

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
		if(!preg_match("/^[a-z0-9._]{6,30}$/i", $username)) return Display::json(1);
		if(!self::isTokenValid($username, $token)) return Display::json(25);
		$username = strtolower($username);

		try{
			$conn = Settings::createConnection();

			$stmt = $conn->prepare("SELECT password_id AS id, website, username, password, message FROM passwords WHERE owner = :owner");
			$stmt->bindParam(':owner', $username, PDO::PARAM_STR);
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
		if(!preg_match("/^[a-z0-9._]{6,30}$/i", $username)) return Display::json(1);
		if(!self::isTokenValid($username, $token)) return Display::json(25);
		$username = strtolower($username);

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
			$conn = Settings::createConnection();

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
		if(!preg_match("/^[a-z0-9._]{6,30}$/i", $username)) return Display::json(1);
		if(!self::isTokenValid($username, $token)) return Display::json(25);
		$username = strtolower($username);

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
			$conn = Settings::createConnection();

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
		if(!preg_match("/^[a-z0-9._]{6,30}$/i", $username)) return Display::json(1);
		if(!self::isTokenValid($username, $token)) return Display::json(25);
		if(strlen($id) != 44) return Display::json(23);
		$username = strtolower($username);

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
			$conn = Settings::createConnection();

			$stmt = $conn->prepare("UPDATE users SET yubico_otp = :yubico_otp, backup_codes = :backup_codes WHERE username = :username");
			$stmt->bindParam(':yubico_otp', $yubico_otp, PDO::PARAM_STR);
			$stmt->bindParam(':backup_codes', $codes, PDO::PARAM_STR);
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
		if(!preg_match("/^[a-z0-9._]{6,30}$/i", $username)) return Display::json(1);
		if(!self::isTokenValid($username, $token)) return Display::json(25);
		if(strlen($id) != 44) return Display::json(23);
		$username = strtolower($username);

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
			$conn = Settings::createConnection();

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
		if(!Settings::getMail()) return Display::json(28);
		$sub_email = filter_var($email, FILTER_SANITIZE_EMAIL);
		if(!filter_var($sub_email, FILTER_VALIDATE_EMAIL)) return Display::json(6);

		try{
			$conn = Settings::createConnection();

			$stmt = $conn->prepare("SELECT username FROM users WHERE email = :email");
			$stmt->bindParam(':email', $sub_email, PDO::PARAM_STR);
			$stmt->execute();

			if($stmt->rowCount() == 0) return Display::json(17);

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
				$mail->Host = Settings::getMailHost();
				$mail->SMTPAuth = true;
				$mail->Username = Settings::getMailUsername();
				$mail->Password = Settings::getMailPassword();
				$mail->SMTPSecure = (Settings::getMailTLS()) ? PHPMailer::ENCRYPTION_STARTTLS : PHPMailer::ENCRYPTION_SMTPS;
				$mail->Port = Settings::getMailPort();

				$mail->setFrom(Settings::getMailUsername(), 'Passky');
				$mail->addAddress($email);
				$mail->addReplyTo(Settings::getMailUsername(), 'Passky');

				$mail->isHTML(true);
				$mail->Subject = 'Usernames under your email';
				$mail->Body = $html;
				$mail->AltBody = $message;

				if($mail->send()) return Display::json(0);
				return Display::json(506);
			} catch (Exception $e) {
				return Display::json(506);
			}
		}catch(PDOException $e) {
			return Display::json(505);
		}
		$conn = null;
	}
}
?>