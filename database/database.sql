/*
Created: 30/03/2021
Modified: 15/06/2021
Author: Rabbit Company
Database: MySQL 8.0
*/

-- Create database section -------------------------------------------------

CREATE DATABASE IF NOT EXISTS `passky`;

-- Create tables section -------------------------------------------------

-- Table passky.users

CREATE TABLE IF NOT EXISTS `passky`.`users`
(
  `user_id` Int NOT NULL AUTO_INCREMENT,
  `username` Char(30) NOT NULL,
  `email` Char(255) NOT NULL,
  `password` Char(255) NOT NULL,
  `2fa_secret` Char(20),
  `yubico_otp` Char(64),
  `backup_codes` Char(69),
  `created` Date NOT NULL DEFAULT CURRENT_DATE,
  `accessed` Date NOT NULL DEFAULT CURRENT_DATE,
  PRIMARY KEY (`user_id`),
  UNIQUE `username` (`username`)
);

-- Table passky.passwords

CREATE TABLE IF NOT EXISTS `passky`.`passwords`
(
  `password_id` Int NOT NULL AUTO_INCREMENT,
  `owner` Char(30) NOT NULL,
  `website` Char(255) NOT NULL,
  `username` Char(255) NOT NULL,
  `password` Char(255) NOT NULL,
  `message` VarChar(10000) NOT NULL,
  PRIMARY KEY (`password_id`),
  UNIQUE `password_id` (`password_id`)
);

CREATE INDEX `owner_idx` ON `passky`.`passwords` (`owner`);