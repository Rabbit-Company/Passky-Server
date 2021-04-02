/*
Created: 30/03/2021
Modified: 30/03/2021
Author: Rabbit Company
Database: MySQL 8.0
*/

-- Create database section -------------------------------------------------
CREATE DATABASE `passky`;

-- Create tables section -------------------------------------------------

-- Table passky.users

CREATE TABLE `passky`.`users`
(
  `user_id` Int NOT NULL AUTO_INCREMENT,
  `username` Char(30) NOT NULL,
  `email` Char(255) NOT NULL,
  `password` Char(255) NOT NULL,
  `2fa_secret` Char(20),
  PRIMARY KEY (`user_id`),
  UNIQUE `user_id` (`user_id`)
);

ALTER TABLE `passky`.`users` ADD UNIQUE `username` (`username`);

-- Table passky.passwords

CREATE TABLE `passky`.`passwords`
(
  `password_id` Int NOT NULL AUTO_INCREMENT,
  `website` Char(255) NOT NULL,
  `username` Char(255) NOT NULL,
  `password` Char(255) NOT NULL,
  PRIMARY KEY (`password_id`),
  UNIQUE `password_id` (`password_id`)
);

-- Table passky.user_passwords

CREATE TABLE `passky`.`user_passwords`
(
  `password_id` Int NOT NULL,
  `user_id` Int NOT NULL
);

ALTER TABLE `passky`.`user_passwords` ADD PRIMARY KEY (`password_id`, `user_id`);

-- Create foreign keys (relationships) section -------------------------------------------------

ALTER TABLE `passky`.`user_passwords` ADD CONSTRAINT `Relationship1` FOREIGN KEY (`password_id`) REFERENCES `passky`.`passwords` (`password_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `passky`.`user_passwords` ADD CONSTRAINT `Relationship2` FOREIGN KEY (`user_id`) REFERENCES `passky`.`users` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
