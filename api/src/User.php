<?php

require_once "Settings.php";

class User {

	public ?int $user_id = null;
	public ?string $username = null;
	public ?string $email = null;
	public ?string $password = null;
	public ?string $secret = null;
	public ?string $yubico_otp = null;
	public ?string $backup_codes = null;
	public ?int $max_passwords = null;
	public ?string $created = null;
	public ?string $accessed = null;
	public int $response = 505;

	public function fromUsername($username){
		try{
			$conn = Settings::createConnection();

			$stmt = $conn->prepare("SELECT * FROM users WHERE username = :username");
			$stmt->bindParam(':username', $username, PDO::PARAM_STR);
			$stmt->execute();

			if($stmt->rowCount() == 1){
				$result = $stmt->fetch();

				$this->user_id = $result['user_id'];
				$this->username = $result['username'];
				$this->email = $result['email'];
				$this->password = $result['password'];
				$this->secret = $result['2fa_secret'];
				$this->yubico_otp = $result['yubico_otp'];
				$this->backup_codes = $result['backup_codes'];
				$this->max_passwords = $result['max_passwords'];
				$this->created = $result['created'];
				$this->accessed = $result['accessed'];
				$this->response = 0;
			}else{
				$this->response = 1;
			}
		}catch(PDOException $e) {
			$this->response = 505;
		}
		$conn = null;
	}
}
?>