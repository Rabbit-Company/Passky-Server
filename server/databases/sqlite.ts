import DB from "./database";

namespace SQLite {
	export async function initialize() {
		await DB.connection`PRAGMA journal_mode = WAL;`;

		await DB.connection`
			CREATE TABLE IF NOT EXISTS "users"(
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
		`;

		await DB.connection`
			CREATE TABLE IF NOT EXISTS "passwords"(
				"password_id" INTEGER PRIMARY KEY AUTOINCREMENT,
				"owner" VARCHAR(30) NOT NULL,
				"website" VARCHAR(255) NOT NULL,
				"username" VARCHAR(255) NOT NULL,
				"password" VARCHAR(255) NOT NULL,
				"message" VarChar(10000) NOT NULL
			);
		`;

		await DB.connection`
			CREATE TABLE IF NOT EXISTS "licenses"(
				"license" VARCHAR(30) NOT NULL PRIMARY KEY,
				"duration" Int NOT NULL DEFAULT 365,
				"created" Date NOT NULL DEFAULT (CURRENT_DATE),
				"used" Date,
				"linked" VARCHAR(30) DEFAULT NULL
			);
		`;

		await DB.connection`
			CREATE INDEX IF NOT EXISTS "owner_idx" ON "passwords" ("owner");
		`;
	}
}

export default SQLite;
