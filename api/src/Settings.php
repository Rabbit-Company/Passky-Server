<?php

class Settings{

/*

	SERVER SETTINGS

*/

	public static function getVersion() : string{
		return '8.0.1';
	}

	public static function getLocation() : string{
		return getenv('SERVER_LOCATION', true) ?: getenv('SERVER_LOCATION') ?: 'US';
	}

	public static function getCores() : int{
		return getenv('SERVER_CORES', true) ?: getenv('SERVER_CORES') ?: 1;
	}

/*

	ADMIN SETTINGS

*/

	public static function getAdminUsername() : string{
		return getenv('ADMIN_USERNAME', true) ?: getenv('ADMIN_USERNAME') ?: 'admin';
	}

	public static function getAdminPassword() : string{
		return getenv('ADMIN_PASSWORD', true) ?: getenv('ADMIN_PASSWORD') ?: 'fehu2UPmpragklWoJcbr4BajxoaGns';
	}

	public static function getCFTSiteKey() : string{
		return getenv('CF_TURNSTILE_SITE_KEY', true) ?: getenv('CF_TURNSTILE_SITE_KEY') ?: '1x00000000000000000000AA';
	}

	public static function getCFTSecretKey() : string{
		return getenv('CF_TURNSTILE_SECRET_KEY', true) ?: getenv('CF_TURNSTILE_SECRET_KEY') ?: '1x0000000000000000000000000000000AA';
	}

/*

	DATABASE SETTINGS

*/

	public static function getDBHost() : string{
		return getenv('MYSQL_HOST', true) ?: getenv('MYSQL_HOST') ?: 'passky-database';
	}

	public static function getDBPort() : string{
		return getenv('MYSQL_PORT', true) ?: getenv('MYSQL_PORT') ?: '3306';
	}

	public static function getDBName() : string{
		return getenv('MYSQL_DATABASE', true) ?: getenv('MYSQL_DATABASE') ?: 'passky';
	}

	public static function getDBUsername() : string{
		return getenv('MYSQL_USER', true) ?: getenv('MYSQL_USER') ?: 'passky';
	}

	public static function getDBPassword() : string{
		return getenv('MYSQL_PASSWORD', true) ?: getenv('MYSQL_PASSWORD') ?: 'uDWjSd8wB2HRBHei489o';
	}

	public static function getDBSSL() : bool{
		return getenv('MYSQL_SSL', true) === 'true';
	}

	public static function getDBSSLCA() : string{
		return getenv('MYSQL_SSL_CA', true) ?: getenv('MYSQL_SSL_CA') ?: '/etc/ssl/certs/ca-certificates.crt';
	}

	public static function getDBCacheMode() : int{
		return getenv('MYSQL_CACHE_MODE', true) ?: getenv('MYSQL_CACHE_MODE') ?: 0;
	}

	public static function createConnection(){
		$options = array();
		if(self::getDBSSL()) $options = array(PDO::MYSQL_ATTR_SSL_CA => self::getDBSSLCA());

		$conn = new PDO('mysql:host=' . self::getDBHost() . ';port=' . self::getDBPort() . ';dbname=' . self::getDBName(), self::getDBUsername(), self::getDBPassword(), $options);
		$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

		return $conn;
	}

/*

	REDIS SETTINGS

*/

	public static function getRedisHost() : string{
		return getenv('REDIS_HOST', true) ?: getenv('REDIS_HOST') ?: '127.0.0.1';
	}

	public static function getRedisPort() : int{
		return getenv('REDIS_PORT', true) ?: getenv('REDIS_PORT') ?: 6379;
	}

	public static function getRedisPassword() : string{
		return getenv('REDIS_PASSWORD', true) ?: getenv('REDIS_PASSWORD') ?: '';
	}

	public static function getRedisLocalHost() : string{
		return getenv('REDIS_LOCAL_HOST', true) ?: getenv('REDIS_LOCAL_HOST') ?: '127.0.0.1';
	}

	public static function getRedisLocalPort() : int{
		return getenv('REDIS_LOCAL_PORT', true) ?: getenv('REDIS_LOCAL_PORT') ?: 6379;
	}

	public static function getRedisLocalPassword() : string{
		return getenv('REDIS_LOCAL_PASSWORD', true) ?: getenv('REDIS_LOCAL_PASSWORD') ?: '';
	}

/*

	EMAIL SETTINGS

*/

	public static function getMail() : bool{
		return getenv('MAIL_ENABLED', true) === 'true';
	}

	public static function getMailHost() : string{
		return getenv('MAIL_HOST', true) ?: getenv('MAIL_HOST') ?: 'mail.passky.org';
	}

	public static function getMailPort() : int{
		return getenv('MAIL_PORT', true) ?: getenv('MAIL_PORT') ?: 587;
	}

	public static function getMailUsername() : string{
		return getenv('MAIL_USERNAME', true) ?: getenv('MAIL_USERNAME') ?: 'info@passky.org';
	}

	public static function getMailPassword() : string{
		return getenv('MAIL_PASSWORD', true) ?: getenv('MAIL_PASSWORD') ?: 'secret';
	}

	public static function getMailTLS() : bool{
		return getenv('MAIL_USE_TLS', true) === 'true';
	}

/*

	ACCOUNT SETTINGS

*/

	public static function getMaxAccounts() : int{
		return getenv('ACCOUNT_MAX', true) ?: getenv('ACCOUNT_MAX') ?: 100;
	}

	public static function getMaxPasswords() : int{
		return getenv('ACCOUNT_MAX_PASSWORDS', true) ?: getenv('ACCOUNT_MAX_PASSWORDS') ?: 1000;
	}

	public static function getPremium() : int{
		return getenv('ACCOUNT_PREMIUM', true) ?: getenv('ACCOUNT_PREMIUM') ?: -1;
	}

/*

	YUBICO SETTINGS

*/

	public static function getYubiCloud() : string{
		return getenv('YUBI_CLOUD', true) ?: getenv('YUBI_CLOUD') ?: 'https://api.yubico.com/wsapi/2.0/verify';
	}

	public static function getYubiId() : int{
		return getenv('YUBI_ID', true) ?: getenv('YUBI_ID') ?: 67857;
	}

/*

	API CALL LIMITER (Brute force mitigation)

*/

	public static function getLimiter() : bool{
		return getenv('LIMITER_ENABLED', true) === 'true';
	}

	public static function getLimiterGetInfo() : int{
		return getenv('LIMITER_GET_INFO', true) ?: getenv('LIMITER_GET_INFO') ?: -1;
	}

	public static function getLimiterGetStats() : int{
		return getenv('LIMITER_GET_STATS', true) ?: getenv('LIMITER_GET_STATS') ?: -1;
	}

	public static function getLimiterGetToken() : int{
		return getenv('LIMITER_GET_TOKEN', true) ?: getenv('LIMITER_GET_TOKEN') ?: 3;
	}

	public static function getLimiterGetPasswords() : int{
		return getenv('LIMITER_GET_PASSWORDS', true) ?: getenv('LIMITER_GET_PASSWORDS') ?: 2;
	}

	public static function getLimiterSavePassword() : int{
		return getenv('LIMITER_SAVE_PASSWORD', true) ?: getenv('LIMITER_SAVE_PASSWORD') ?: 2;
	}

	public static function getLimiterEditPassword() : int{
		return getenv('LIMITER_EDIT_PASSWORD', true) ?: getenv('LIMITER_EDIT_PASSWORD') ?: 2;
	}

	public static function getLimiterDeletePassword() : int{
		return getenv('LIMITER_DELETE_PASSWORD', true) ?: getenv('LIMITER_DELETE_PASSWORD') ?: 2;
	}

	public static function getLimiterDeletePasswords() : int{
		return getenv('LIMITER_DELETE_PASSWORDS', true) ?: getenv('LIMITER_DELETE_PASSWORDS') ?: 10;
	}

	public static function getLimiterCreateAccount() : int{
		return getenv('LIMITER_CREATE_ACCOUNT', true) ?: getenv('LIMITER_CREATE_ACCOUNT') ?: 10;
	}

	public static function getLimiterDeleteAccount() : int{
		return getenv('LIMITER_DELETE_ACCOUNT', true) ?: getenv('LIMITER_DELETE_ACCOUNT') ?: 10;
	}

	public static function getLimiterImportPasswords() : int{
		return getenv('LIMITER_IMPORT_PASSWORDS', true) ?: getenv('LIMITER_IMPORT_PASSWORDS') ?: 10;
	}

	public static function getLimiterForgotUsername() : int{
		return getenv('LIMITER_FORGOT_USERNAME', true) ?: getenv('LIMITER_FORGOT_USERNAME') ?: 60;
	}

	public static function getLimiterEnable2fa() : int{
		return getenv('LIMITER_ENABLE_2FA', true) ?: getenv('LIMITER_ENABLE_2FA') ?: 10;
	}

	public static function getLimiterDisable2fa() : int{
		return getenv('LIMITER_DISABLE_2FA', true) ?: getenv('LIMITER_DISABLE_2FA') ?: 10;
	}

	public static function getLimiterAddYubiKey() : int{
		return getenv('LIMITER_ADD_YUBIKEY', true) ?: getenv('LIMITER_ADD_YUBIKEY') ?: 10;
	}

	public static function getLimiterRemoveYubiKey() : int{
		return getenv('LIMITER_REMOVE_YUBIKEY', true) ?: getenv('LIMITER_REMOVE_YUBIKEY') ?: 10;
	}

	public static function getLimiterUpgradeAccount() : int{
		return getenv('LIMITER_UPGRADE_ACCOUNT', true) ?: getenv('LIMITER_UPGRADE_ACCOUNT') ?: 10;
	}

	public static function getLimiterGetReport() : int{
		return getenv('LIMITER_GET_REPORT', true) ?: getenv('LIMITER_GET_REPORT') ?: -1;
	}

/*

	SECURITY

*/

	public static function calculateHashingCost() : int{
		$timeTarget = 0.1; // 100 milliseconds
		$cost = 8;
		do {
			$cost++;
			$start = microtime(true);
			password_hash('random_string_for_hashing', PASSWORD_BCRYPT, [ 'cost' => $cost ]);
			$end = microtime(true);
		}while(($end - $start) < $timeTarget);
		return $cost-1;
	}

/*

	LOCAL STORAGE

*/

	public static function createRedisConnection($local){
		$redis = null;

		$host = self::getRedisHost();
		$port = self::getRedisPort();
		$pass = self::getRedisPassword();

		if($local){
			$host = self::getRedisLocalHost();
			$port = self::getRedisLocalPort();
			$pass = self::getRedisLocalPassword();
		}

		try{
			$redis = new Redis();
			$redis->connect($host, $port);
			$redis->auth($pass);
		}catch(Exception){}
		return $redis;
	}

	public static function writeLocalData($key, $value, $expiration, $local) : bool{
		$redis = self::createRedisConnection($local);

		if($redis !== null){
			$redis->setEx($key, $expiration, $value);
			return true;
		}

		$data = json_decode(file_get_contents('../data.json'), true);
		$data[$key] = $value;
		file_put_contents('../data.json', json_encode($data));
		return true;
	}

	public static function readLocalData($key, $local){
		$redis = self::createRedisConnection($local);

		if($redis !== null){
			$value = $redis->get($key);
			return ($value !== false) ? $value : null;
		}

		$data = json_decode(file_get_contents('../data.json'), true);
		return (!empty($data[$key])) ? $data[$key] : null;
	}

	public static function ttlLocalData($key, $local) : int{
		$redis = self::createRedisConnection($local);

		if($redis !== null){
			return $redis->ttl($key);
		}

		return -1;
	}

	public static function increaseLocalData($key, $amount, $local){
		$redis = self::createRedisConnection($local);

		if($redis !== null){
			$redis->incrBy($key, $amount);
			return true;
		}

		$data = json_decode(file_get_contents('../data.json'), true);
		if($data[$key] !== null && is_numeric($data[$key])){
			$data[$key] = $data[$key] + $amount;
			file_put_contents('../data.json', json_encode($data));
		}
		return true;
	}

	public static function decreaseLocalData($key, $amount, $local){
		$redis = self::createRedisConnection($local);

		if($redis !== null){
			$redis->decrBy($key, $amount);
			return true;
		}

		$data = json_decode(file_get_contents('../data.json'), true);
		if($data[$key] !== null && is_numeric($data[$key])){
			$data[$key] = $data[$key] - $amount;
			file_put_contents('../data.json', json_encode($data));
		}
		return true;
	}

	public static function removeLocalData($key, $local){
		$redis = self::createRedisConnection($local);

		if($redis !== null){
			return $redis->del($key);
		}

		$data = json_decode(file_get_contents('../data.json'), true);
		unset($data[$key]);
		file_put_contents('../data.json', json_encode($data));
		return true;
	}

	public static function purgeLocalData(){
		file_put_contents('../data.json', '{}');
		return true;
	}
}
?>