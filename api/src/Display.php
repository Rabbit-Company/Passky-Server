<?php
require_once 'Errors.php';

class Display{

	public static function json(int $error_code, $JSON_OBJ = null) : string{
		if($JSON_OBJ === null) $JSON_OBJ = new StdClass;
		$JSON_OBJ->error = $error_code;
		$JSON_OBJ->info = Errors::getError($error_code);
		return json_encode($JSON_OBJ);
	}
}
?>