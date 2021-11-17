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
  `created` Date DEFAULT CURRENT_DATE,
  `accessed` Date DEFAULT CURRENT_DATE,
  PRIMARY KEY (`user_id`),
  UNIQUE `user_id` (`user_id`)
);

ALTER TABLE `passky`.`users` ADD UNIQUE IF NOT EXISTS `username` (`username`);

-- Table passky.passwords

CREATE TABLE IF NOT EXISTS `passky`.`passwords`
(
  `password_id` Int NOT NULL AUTO_INCREMENT,
  `website` Char(255) NOT NULL,
  `username` Char(255) NOT NULL,
  `password` Char(255) NOT NULL,
  `message` VarChar(10000),
  PRIMARY KEY (`password_id`),
  UNIQUE `password_id` (`password_id`)
);

-- Table passky.user_passwords

CREATE TABLE IF NOT EXISTS `passky`.`user_passwords`
(
  `password_id` Int NOT NULL,
  `user_id` Int NOT NULL
);

ALTER TABLE `passky`.`user_passwords` ADD PRIMARY KEY IF NOT EXISTS (`password_id`, `user_id`);

-- Create foreign keys (relationships) section -------------------------------------------------

ALTER TABLE `passky`.`user_passwords` ADD CONSTRAINT `Relationship1` FOREIGN KEY IF NOT EXISTS (`password_id`) REFERENCES `passky`.`passwords` (`password_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `passky`.`user_passwords` ADD CONSTRAINT `Relationship2` FOREIGN KEY IF NOT EXISTS (`user_id`) REFERENCES `passky`.`users` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
