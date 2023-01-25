<?php

class Schema{

	/*####################################################################################*/
	/*###################################### SQLite ######################################*/
	/*####################################################################################*/

	public static function SQLite() : string{
		return '
			-- Created: 10/01/2023
			-- Modified: 10/01/2023
			-- Author: Abdelaziz Elrashed <aeemh.sdn@gmail.com>
			-- Database: SQLite

			-- Create tables section -------------------------------------------------

			-- Table users

			CREATE TABLE IF NOT EXISTS "users"
			(
				"user_id" INTEGER PRIMARY KEY AUTOINCREMENT,
				"username" VARCHAR(30) NOT NULL,
				"email" VARCHAR(255) NOT NULL,
				"password" VARCHAR(255) NOT NULL,
				"2fa_secret" VARCHAR(20),
				"yubico_otp" VARCHAR(64),
				"backup_codes" VARCHAR(69),
				"max_passwords" Int NOT NULL DEFAULT 1000,
				"premium_expires" Date,
				"created" Date NOT NULL DEFAULT (CURRENT_DATE),
				"accessed" Date NOT NULL DEFAULT (CURRENT_DATE),
				UNIQUE ("username")
			);

			-- Table passwords

			CREATE TABLE IF NOT EXISTS "passwords"
			(
				"password_id" INTEGER PRIMARY KEY AUTOINCREMENT,
				"owner" VARCHAR(30) NOT NULL,
				"website" VARCHAR(255) NOT NULL,
				"username" VARCHAR(255) NOT NULL,
				"password" VARCHAR(255) NOT NULL,
				"message" VarChar(10000) NOT NULL
			);

			-- Table licenses

			CREATE TABLE IF NOT EXISTS "licenses"
			(
				"license" VARCHAR(30) NOT NULL PRIMARY KEY,
				"duration" Int NOT NULL DEFAULT 365,
				"created" Date NOT NULL DEFAULT (CURRENT_DATE),
				"used" Date,
				"linked" VARCHAR(30) DEFAULT NULL
			);

			CREATE INDEX IF NOT EXISTS "owner_idx" ON "passwords" ("owner");
		';
	}

	/*###################################################################################*/
	/*###################################### MySQL ######################################*/
	/*###################################################################################*/

	public static function MySQL() : string{
		return '
			-- Created: 30/03/2021
			-- Modified: 10/10/2022
			-- Author: Rabbit Company
			-- Database: MySQL 8.0

			-- Create database section -------------------------------------------------

			CREATE DATABASE IF NOT EXISTS `MYSQL_DATABASE`;

			-- Create tables section -------------------------------------------------

			-- Table passky.users

			CREATE TABLE IF NOT EXISTS `MYSQL_DATABASE`.`users`
			(
				`user_id` BigInt UNSIGNED NOT NULL AUTO_INCREMENT,
				`username` Char(30) NOT NULL,
				`email` Char(255) NOT NULL,
				`password` Char(255) NOT NULL,
				`2fa_secret` Char(20),
				`yubico_otp` Char(64),
				`backup_codes` Char(69),
				`max_passwords` Int NOT NULL DEFAULT 1000,
				`premium_expires` Date,
				`created` Date NOT NULL DEFAULT (CURRENT_DATE),
				`accessed` Date NOT NULL DEFAULT (CURRENT_DATE),
				PRIMARY KEY (`user_id`),
				UNIQUE `username` (`username`)
			);

			-- Table passky.passwords

			CREATE TABLE IF NOT EXISTS `MYSQL_DATABASE`.`passwords`
			(
				`password_id` BigInt UNSIGNED NOT NULL AUTO_INCREMENT,
				`owner` Char(30) NOT NULL,
				`website` Char(255) NOT NULL,
				`username` Char(255) NOT NULL,
				`password` Char(255) NOT NULL,
				`message` VarChar(10000) NOT NULL,
				PRIMARY KEY (`password_id`)
			);

			-- Table passky.licenses

			CREATE TABLE IF NOT EXISTS `MYSQL_DATABASE`.`licenses`
			(
				`license` Char(30) NOT NULL,
				`duration` Int NOT NULL DEFAULT 365,
				`created` Date NOT NULL DEFAULT (CURRENT_DATE),
				`used` Date,
				`linked` Char(30) DEFAULT NULL,
				PRIMARY KEY (`license`)
			);

			CREATE INDEX IF NOT EXISTS `owner_idx` ON `passwords` (`owner`);
		';
	}
}

?>