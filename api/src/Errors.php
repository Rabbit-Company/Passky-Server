<?php

class Errors{

	public static $errors = array (
		"0" => "Successful",
		"1" => "Username is invalid!",
		"2" => "Password is incorrect!",
		"3" => "Something went wrong while inserting data to the database!",
		"4" => "Username is already registered!",
		"5" => "Password must be encrypted with sha512 algorithm!",
		"6" => "Email is invalid!",
		"8" => "You don't have any saved password.",
		"10" => "User does not own this password!",
		"11" => "Something went wrong while deleting data from database!",
		"12" => "Username must be 6 to 30 characters long, and may only contain letters, numbers and dots!",
		"13" => "Something went wrong while updating data in database!",
		"14" => "Json is invalid!",
		"15" => "This server cannot accept more users!",
		"16" => "You have reached the maximum amount of stored passwords!",
		"17" => "Account with this email doesn't exist!",
		"19" => "OTP is incorrect!",
		"20" => "You can only link up to 5 Yubikeys!",
		"21" => "This Yubikey is already linked with your account.",
		"23" => "Provided Yubikey OTP is invalid!",
		"24" => "Yubikey with provided ID isn't linked to your account.",
		"25" => "Token is incorrect!",
		"26" => "Two-factor authentication is already enabled.",
		"27" => "Two-factor authentication is not enabled.",
		"28" => "Mail is not enabled on this server.",
		"300" => "Website needs to be encrypted with XChaCha20.",
		"301" => "Username needs to be encrypted with XChaCha20.",
		"302" => "Password needs to be encrypted with XChaCha20.",
		"303" => "Message needs to be encrypted with XChaCha20.",
		"400" => "Action was not provided in GET!",
		"401" => "Action is invalid!",
		"403" => "You didn't provide all required values in POST.",
		"404" => "Can't connect into API.",
		"429" => "You are sending too many requests! Please wait before executing this action again.",
		"505" => "Something went wrong while connecting to the database!",
		"506" => "Something went wrong while connecting to the mail server!",
		"999" => "You do NOT have permission to use this endpoint."
	);

	public static function getError(string $error_code) : string{
		return self::$errors[$error_code];
	}
}
?>