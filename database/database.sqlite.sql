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