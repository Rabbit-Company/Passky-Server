<?php

require_once "Settings.php";

class License {

	public ?string $license = null;
	public ?int $duration = null;
	public ?string $created = null;
	public ?string $used = null;
	public ?string $linked = null;
	public int $response = 505;

	public function fromLicense($license){
		try{
			$conn = Settings::createConnection();

			$stmt = $conn->prepare("SELECT * FROM licenses WHERE license = :license");
			$stmt->bindParam(':license', $license, PDO::PARAM_STR);
			$stmt->execute();

			if($stmt->rowCount() == 1){
				$result = $stmt->fetch();

				$this->license = $result['license'];
				$this->duration = $result['duration'];
				$this->created = $result['created'];
				$this->used = $result['used'];
				$this->linked = $result['linked'];
				$this->response = 0;
			}else{
				$this->response = 29;
			}
		}catch(PDOException $e) {
			$this->response = 505;
		}
		$conn = null;
	}
}
?>