/*
Created: 30/03/2021
Modified: 10/10/2022
Author: Rabbit Company
Database: MySQL 8.0
*/

-- Create database section -------------------------------------------------

CREATE DATABASE IF NOT EXISTS `MYSQL_DATABASE`;

-- Create tables section -------------------------------------------------

-- Table passky.users

CREATE TABLE IF NOT EXISTS `MYSQL_DATABASE`.`users`
(
  `user_id` Int UNSIGNED NOT NULL AUTO_INCREMENT,
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
  `password_id` Int UNSIGNED NOT NULL AUTO_INCREMENT,
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

CREATE INDEX `owner_idx` ON `MYSQL_DATABASE`.`passwords` (`owner`);