<?php
require_once "Errors.php";
require_once "Display.php";

class Database{

    static string $mysql_host = "localhost";
    static string $mysql_database = "rabbitc_passky";
    static string $mysql_username = "rabbitc_passky";
    static string $mysql_password = "uDWjSd8wB2HRBHei489o";

    public static function isUsernameTaken(string $username) : int{
        try{
        	$conn = new PDO("mysql:host=" . self::$mysql_host . ";dbname=" . self::$mysql_database, self::$mysql_username, self::$mysql_password);
        	$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        	$stmt = $conn->prepare("SELECT * FROM users WHERE username = :username");
        	$stmt->bindParam(':username', strtolower($username), PDO::PARAM_STR);
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
        if(!empty($_SERVER['HTTP_CLIENT_IP'])){
            $ip = $_SERVER['HTTP_CLIENT_IP'];
        }elseif(!empty($_SERVER['HTTP_X_FORWARDED_FOR'])){
            $ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
        }else{
            $ip = $_SERVER['REMOTE_ADDR'];
        }
        return $ip;
    }

    public static function isPasswordCorrect(string $username, string $password) : int {
       try{
        	$conn = new PDO("mysql:host=" . self::$mysql_host . ";dbname=" . self::$mysql_database, self::$mysql_username, self::$mysql_password);
        	$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        	$stmt = $conn->prepare("SELECT password FROM users WHERE username = :username");
        	$stmt->bindParam(':username', strtolower($username), PDO::PARAM_STR);
        	$stmt->execute();

        	if($stmt->rowCount() == 1){
        		$row = $stmt->fetch();
                return (password_verify($password, $row["password"])) ? 1 : 0;
        	} else {
        		return 2;
        	}

        }catch(PDOException $e) {
        	return 505;
        }
        $conn = null;
    }

    public static function getUserCount(){
        try{
    		$conn = new PDO("mysql:host=" . self::$mysql_host . ";dbname=" . self::$mysql_database, self::$mysql_username, self::$mysql_password);
            $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

            $stmt = $conn->prepare("SELECT COUNT(*) AS 'amount' FROM users");
            $stmt->execute();

    		if($stmt->rowCount() == 1){
    			$row = $stmt->fetch();
                $JSON_OBJ = new StdClass;
                $JSON_OBJ->amount = $row['amount'];
                return Display::json(0, $JSON_OBJ);
    		}else{
    			return Display::json(505);
    		}

        }catch(PDOException $e) {
    		return Display::json(505);
        }
        $conn = null;
    }

    public static function createAccount(string $username, string $email, string $password) : int{

        $sub_email = filter_var($email, FILTER_SANITIZE_EMAIL);

        if(!(strlen($username) >= 6 && strlen($username) <= 30) || strpos($username, ' ')) return Display::json(1);
        if(!filter_var($sub_email, FILTER_VALIDATE_EMAIL)) return Display::json(6);
        if(!(strlen($password) >= 8 && strlen($password) <= 255) || strpos($password, ' ')) return Display::json(5);

        switch(self::isUsernameTaken($username)){
            case 1:
                return Display::json(4);
            break;
            case 505:
                return Display::json(505);
            break;
        }

        try{

            $conn = new PDO("mysql:host=" . self::$mysql_host . ";dbname=" . self::$mysql_database, self::$mysql_username, self::$mysql_password);
            $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

            $stmt = $conn->prepare("INSERT INTO users(username, email, password) VALUES(:username, :email, :password);");
            $stmt->bindParam(':username', strtolower($username), PDO::PARAM_STR);
            $stmt->bindParam(':email', strtolower($email), PDO::PARAM_STR);
            $stmt->bindParam(':password', self::encryptPassword($password), PDO::PARAM_STR);

            return ($stmt->execute()) ? Display::json(0) : Display::json(3);
        }catch(PDOException $e) {
            return Display::json(505);
        }
        $conn = null;
    }

    public static function deleteAccount(string $username, string $password) : int{
        if(!(strlen($password) >= 8 && strlen($password) <= 255) || strpos($password, ' ')) return Display::json(5);
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

        //TODO: deleteAccount
    }

    public static function savePassword(string $username, string $password, string $website, string $username2, string $password2){

        if(!(strlen($username) >= 6 && strlen($username) <= 30) || strpos($username, ' ')) return Display::json(1);
        if(!(strlen($password) >= 8 && strlen($password) <= 255) || strpos($password, ' ')) return Display::json(5);

        if(!(strlen($password2) >= 8 && strlen($password2) <= 255) || strpos($password2, ' ')) return Display::json(5);
        if(!(strlen($username2) >= 3 && strlen($username2) <= 255)) return Display::json(1);
        if(false === filter_var($website, FILTER_VALIDATE_DOMAIN) || strlen($website) > 255) return Display::json(9);

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

        try{

            $conn = new PDO("mysql:host=" . self::$mysql_host . ";dbname=" . self::$mysql_database, self::$mysql_username, self::$mysql_password);
            $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

            $stmt = $conn->prepare("INSERT INTO passwords(website, username, password) VALUES(:website, :username, :password);");
            $stmt->bindParam(':website', strtolower($website), PDO::PARAM_STR);
            $stmt->bindParam(':username', $username2, PDO::PARAM_STR);
            $stmt->bindParam(':password', $password2, PDO::PARAM_STR);

            return ($stmt->execute()) ? Display::json(0) : Display::json(3);
        }catch(PDOException $e) {
            return Display::json(505);
        }
        $conn = null;

        //TODO: savePassword
    }

    public static function getPasswords(string $username, string $password) : string{
        if(!(strlen($password) >= 8 && strlen($password) <= 255) || strpos($password, ' ')) return Display::json(5);

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

        try{

        	$conn = new PDO("mysql:host=" . self::$mysql_host . ";dbname=" . self::$mysql_database, self::$mysql_username, self::$mysql_password);
        	$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        	$stmt = $conn->prepare("SELECT p.website, p.username, p.password FROM passwords p JOIN user_passwords up ON up.password_id = p.password_id JOIN users u ON u.user_id = up.user_id WHERE u.username = :username");
        	$stmt->bindParam(':username', strtolower($username), PDO::PARAM_STR);
        	$stmt->execute();

        	if($stmt->rowCount() > 0){
                $JSON_OBJ = new StdClass;
                $JSON_OBJ->passwords = $stmt->fetchAll(\PDO::FETCH_ASSOC);
                return Display::json(0, $JSON_OBJ);
        	}else{
    			return Display::json(8);
        	}

        }catch(PDOException $e) {
    		return Display::json(505);
        }
        $conn = null;
    }

}

?>
