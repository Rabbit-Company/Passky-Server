import { SQL } from "bun";

import { config, isMysql, isSqlite } from "./config.ts";
import { addDays, dateOnly } from "./time.ts";
import type { AdminAccountRow, AdminAccountStats, AdminLicenseStats, EncryptedPasswordInput, LicenseRow, PasswordRow, ReportRow, UserRow } from "./types.ts";

const sqliteSchema = [
	`CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(30) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    "2fa_secret" VARCHAR(20),
    yubico_otp VARCHAR(64),
    backup_codes VARCHAR(69),
    max_passwords INTEGER NOT NULL DEFAULT 1000,
    premium_expires DATE,
    created DATE NOT NULL DEFAULT CURRENT_DATE,
    accessed DATE NOT NULL DEFAULT CURRENT_DATE
  )`,
	`CREATE TABLE IF NOT EXISTS passwords (
    password_id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner VARCHAR(30) NOT NULL,
    website VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    message VARCHAR(10000) NOT NULL
  )`,
	`CREATE TABLE IF NOT EXISTS licenses (
    license VARCHAR(30) PRIMARY KEY,
    duration INTEGER NOT NULL DEFAULT 365,
    created DATE NOT NULL DEFAULT CURRENT_DATE,
    used DATE,
    linked VARCHAR(30)
  )`,
	"CREATE INDEX IF NOT EXISTS owner_idx ON passwords (owner)",
] as const;

const mysqlSchema = [
	`CREATE TABLE IF NOT EXISTS users (
    user_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    username CHAR(30) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    \`2fa_secret\` CHAR(20),
    yubico_otp VARCHAR(64),
    backup_codes VARCHAR(69),
    max_passwords INT NOT NULL DEFAULT 1000,
    premium_expires DATE,
    created DATE NOT NULL DEFAULT (CURRENT_DATE),
    accessed DATE NOT NULL DEFAULT (CURRENT_DATE)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
	`CREATE TABLE IF NOT EXISTS passwords (
    password_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    owner CHAR(30) NOT NULL,
    website VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    message VARCHAR(10000) NOT NULL,
    INDEX owner_idx (owner)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
	`CREATE TABLE IF NOT EXISTS licenses (
    license CHAR(30) NOT NULL PRIMARY KEY,
    duration INT NOT NULL DEFAULT 365,
    created DATE NOT NULL DEFAULT (CURRENT_DATE),
    used DATE,
    linked CHAR(30)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
] as const;

const postgresSchema = [
	`CREATE TABLE IF NOT EXISTS users (
    user_id BIGSERIAL PRIMARY KEY,
    username VARCHAR(30) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    "2fa_secret" VARCHAR(20),
    yubico_otp VARCHAR(64),
    backup_codes VARCHAR(69),
    max_passwords INTEGER NOT NULL DEFAULT 1000,
    premium_expires DATE,
    created DATE NOT NULL DEFAULT CURRENT_DATE,
    accessed DATE NOT NULL DEFAULT CURRENT_DATE
  )`,
	`CREATE TABLE IF NOT EXISTS passwords (
    password_id BIGSERIAL PRIMARY KEY,
    owner VARCHAR(30) NOT NULL,
    website VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    message VARCHAR(10000) NOT NULL
  )`,
	`CREATE TABLE IF NOT EXISTS licenses (
    license VARCHAR(30) PRIMARY KEY,
    duration INTEGER NOT NULL DEFAULT 365,
    created DATE NOT NULL DEFAULT CURRENT_DATE,
    used DATE,
    linked VARCHAR(30)
  )`,
	"CREATE INDEX IF NOT EXISTS owner_idx ON passwords (owner)",
] as const;

function normalizeUser(row: UserRow): UserRow {
	return {
		...row,
		premium_expires: dateOnly(row.premium_expires),
		created: dateOnly(row.created) ?? "",
		accessed: dateOnly(row.accessed) ?? "",
	};
}

export class Database {
	private readonly client =
		isMysql() && config.database.mysqlSsl
			? new SQL({
					url: config.database.url,
					adapter: "mysql",
					tls: {
						rejectUnauthorized: true,
						ca: Bun.file(config.database.mysqlSslCa),
					},
				})
			: new SQL(config.database.url);

	async initialize(): Promise<void> {
		const schema = isSqlite() ? sqliteSchema : isMysql() ? mysqlSchema : postgresSchema;

		for (const statement of schema) {
			try {
				await this.client.unsafe(statement);
			} catch (error) {
				if (!(await this.tablesExist())) throw error;
			}
		}
	}

	private async tablesExist(): Promise<boolean> {
		try {
			await Promise.all([this.client`SELECT 1 FROM users LIMIT 1`, this.client`SELECT 1 FROM passwords LIMIT 1`, this.client`SELECT 1 FROM licenses LIMIT 1`]);

			return true;
		} catch {
			return false;
		}
	}

	async close(): Promise<void> {
		await this.client.close();
	}

	async userCount(): Promise<number> {
		const rows = await this.client`SELECT COUNT(*) AS amount FROM users`;

		return Number(rows[0]?.amount ?? 0);
	}

	async passwordCount(): Promise<number> {
		const rows = await this.client`SELECT COUNT(*) AS amount FROM passwords`;

		return Number(rows[0]?.amount ?? 0);
	}

	async userPasswordCount(owner: string): Promise<number> {
		const rows = await this.client`SELECT COUNT(*) AS amount FROM passwords WHERE owner = ${owner}`;

		return Number(rows[0]?.amount ?? 0);
	}

	async usernameTaken(username: string): Promise<boolean> {
		const rows = await this.client`SELECT user_id FROM users WHERE username = ${username} LIMIT 1`;

		return rows.length > 0;
	}

	async findUser(username: string): Promise<UserRow | null> {
		const rows = await this.client`SELECT * FROM users WHERE username = ${username} LIMIT 1`;

		return rows[0] ? normalizeUser(rows[0] as UserRow) : null;
	}

	async createUser(username: string, email: string, password: string, maxPasswords: number): Promise<void> {
		await this.client`
      INSERT INTO users (username, email, password, max_passwords)
      VALUES (${username}, ${email}, ${password}, ${maxPasswords})
    `;
	}

	async updateUserPassword(username: string, password: string): Promise<void> {
		await this.client`UPDATE users SET password = ${password} WHERE username = ${username}`;
	}

	async updateLastAccess(username: string, accessed: string): Promise<void> {
		await this.client`UPDATE users SET accessed = ${accessed} WHERE username = ${username}`;
	}

	async getPasswords(owner: string): Promise<PasswordRow[]> {
		const rows = await this.client`
      SELECT password_id AS id, website, username, password, message
      FROM passwords
      WHERE owner = ${owner}
    `;

		return rows.map((row: Record<string, unknown>) => ({
			...row,
			id: Number(row.id),
		})) as PasswordRow[];
	}

	async passwordOwnedBy(owner: string, passwordId: number): Promise<boolean> {
		const rows = await this.client`
      SELECT password_id FROM passwords WHERE owner = ${owner} AND password_id = ${passwordId} LIMIT 1
    `;

		return rows.length > 0;
	}

	async savePassword(owner: string, input: EncryptedPasswordInput): Promise<void> {
		await this.client`
      INSERT INTO passwords (owner, website, username, password, message)
      VALUES (${owner}, ${input.website}, ${input.username}, ${input.password}, ${input.message})
    `;
	}

	async importPasswords(owner: string, inputs: EncryptedPasswordInput[]): Promise<void> {
		await this.client.begin(async (transaction) => {
			for (const input of inputs) {
				await transaction`
          INSERT INTO passwords (owner, website, username, password, message)
          VALUES (${owner}, ${input.website}, ${input.username}, ${input.password}, ${input.message})
        `;
			}
		});
	}

	async editPassword(owner: string, passwordId: number, input: EncryptedPasswordInput): Promise<void> {
		await this.client`
      UPDATE passwords
      SET website = ${input.website}, username = ${input.username}, password = ${input.password}, message = ${input.message}
      WHERE password_id = ${passwordId} AND owner = ${owner}
    `;
	}

	async deletePassword(owner: string, passwordId: number): Promise<void> {
		await this.client`DELETE FROM passwords WHERE password_id = ${passwordId} AND owner = ${owner}`;
	}

	async deletePasswords(owner: string): Promise<void> {
		await this.client`DELETE FROM passwords WHERE owner = ${owner}`;
	}

	async deleteAccount(username: string): Promise<void> {
		await this.client.begin(async (transaction) => {
			await transaction`DELETE FROM passwords WHERE owner = ${username}`;
			await transaction`DELETE FROM users WHERE username = ${username}`;
		});
	}

	async enableTwoFactor(username: string, secret: string, backupCodes: string): Promise<void> {
		if (isMysql()) {
			await this.client.unsafe("UPDATE users SET `2fa_secret` = ?, backup_codes = ? WHERE username = ?", [secret, backupCodes, username]);
			return;
		}

		if (isSqlite()) {
			await this.client.unsafe('UPDATE users SET "2fa_secret" = ?, backup_codes = ? WHERE username = ?', [secret, backupCodes, username]);
			return;
		}

		await this.client.unsafe('UPDATE users SET "2fa_secret" = $1, backup_codes = $2 WHERE username = $3', [secret, backupCodes, username]);
	}

	async disableTwoFactor(username: string): Promise<void> {
		if (isMysql()) {
			await this.client.unsafe("UPDATE users SET `2fa_secret` = NULL WHERE username = ?", [username]);
			return;
		}

		if (isSqlite()) {
			await this.client.unsafe('UPDATE users SET "2fa_secret" = NULL WHERE username = ?', [username]);
			return;
		}

		await this.client.unsafe('UPDATE users SET "2fa_secret" = NULL WHERE username = $1', [username]);
	}

	async updateYubiKeys(username: string, yubicoOtp: string | null, backupCodes?: string): Promise<void> {
		if (backupCodes === undefined) {
			await this.client`UPDATE users SET yubico_otp = ${yubicoOtp} WHERE username = ${username}`;
			return;
		}

		await this.client`
      UPDATE users SET yubico_otp = ${yubicoOtp}, backup_codes = ${backupCodes} WHERE username = ${username}
    `;
	}

	async usernamesForEmail(email: string): Promise<string[]> {
		const rows = await this.client`SELECT username FROM users WHERE email = ${email}`;

		return rows.map((row: Record<string, unknown>) => String(row.username));
	}

	async findLicense(license: string): Promise<LicenseRow | null> {
		const rows = await this.client`SELECT * FROM licenses WHERE license = ${license} LIMIT 1`;
		const row = rows[0] as LicenseRow | undefined;

		if (!row) return null;

		return {
			...row,
			duration: Number(row.duration),
			created: dateOnly(row.created) ?? "",
			used: dateOnly(row.used),
		};
	}

	async redeemLicense(username: string, license: string, maxPasswords: number, currentDate: string): Promise<string | null> {
		return this.client.begin(async (transaction) => {
			const claimed = await transaction`
        UPDATE licenses SET used = ${currentDate}, linked = ${username} WHERE license = ${license} AND linked IS NULL
      `;
			if (claimed.count === 0) return null;

			const [licenseRow] = await transaction`SELECT duration FROM licenses WHERE license = ${license}`;
			const [userRow] = await transaction`SELECT premium_expires FROM users WHERE username = ${username}`;
			const activeUntil = dateOnly(userRow?.premium_expires);
			const start = activeUntil !== null && activeUntil > currentDate ? activeUntil : currentDate;
			const premiumExpires = addDays(start, Number(licenseRow?.duration ?? 0));

			await transaction`
        UPDATE users
        SET max_passwords = ${maxPasswords}, premium_expires = ${premiumExpires}
        WHERE username = ${username}
      `;

			return premiumExpires;
		});
	}

	async expirePremiumAccounts(maxPasswords: number, today: string): Promise<void> {
		await this.client`
      UPDATE users
      SET max_passwords = ${maxPasswords}, premium_expires = NULL
      WHERE premium_expires IS NOT NULL AND premium_expires < ${today}
    `;
	}

	async report(): Promise<ReportRow[]> {
		const rows = await this.client`
      SELECT created AS date, COUNT(created) AS newcomers FROM users GROUP BY created ORDER BY created
    `;

		return rows.map((row: Record<string, unknown>) => ({
			date: dateOnly(row.date) ?? "",
			newcomers: Number(row.newcomers),
		}));
	}

	async activeUserCount(since: string): Promise<number> {
		const rows = await this.client`SELECT COUNT(accessed) AS amount FROM users WHERE accessed >= ${since}`;

		return Number(rows[0]?.amount ?? 0);
	}

	async adminAccountStats(): Promise<AdminAccountStats> {
		const [accounts, passwords, premiumAccounts] = await Promise.all([
			this.client`SELECT COUNT(*) AS amount FROM users`,
			this.client`SELECT COUNT(*) AS amount FROM passwords`,
			this.client`SELECT COUNT(*) AS amount FROM users WHERE premium_expires IS NOT NULL`,
		]);

		return {
			accounts: Number(accounts[0]?.amount ?? 0),
			passwords: Number(passwords[0]?.amount ?? 0),
			premiumAccounts: Number(premiumAccounts[0]?.amount ?? 0),
		};
	}

	async adminAccountCount(search: string): Promise<number> {
		const pattern = `%${search}%`;
		const rows = search
			? await this.client`SELECT COUNT(*) AS amount FROM users WHERE username LIKE ${pattern} OR email LIKE ${pattern}`
			: await this.client`SELECT COUNT(*) AS amount FROM users`;

		return Number(rows[0]?.amount ?? 0);
	}

	async adminAccounts(search: string, limit = 25, offset = 0): Promise<AdminAccountRow[]> {
		const pattern = `%${search}%`;
		const rows = search
			? await this.client`
          SELECT u.user_id, u.username, u.email, u.backup_codes, u.created, u.accessed,
            u.max_passwords, u.premium_expires,
            (SELECT COUNT(*) FROM passwords p WHERE p.owner = u.username) AS passwords
          FROM users u
          WHERE u.username LIKE ${pattern} OR u.email LIKE ${pattern}
          ORDER BY u.user_id DESC
          LIMIT ${limit} OFFSET ${offset}
        `
			: await this.client`
          SELECT u.user_id, u.username, u.email, u.backup_codes, u.created, u.accessed,
            u.max_passwords, u.premium_expires,
            (SELECT COUNT(*) FROM passwords p WHERE p.owner = u.username) AS passwords
          FROM users u
          ORDER BY u.user_id DESC
          LIMIT ${limit} OFFSET ${offset}
        `;

		return rows.map((row: Record<string, unknown>) => ({
			...row,
			user_id: Number(row.user_id),
			passwords: Number(row.passwords),
			max_passwords: Number(row.max_passwords),
			created: dateOnly(row.created) ?? "",
			accessed: dateOnly(row.accessed) ?? "",
			premium_expires: dateOnly(row.premium_expires),
		})) as AdminAccountRow[];
	}

	async adminUpdateAccount(username: string, email: string | null, maxPasswords: number, disableTwoFactor: boolean, disablePremium: boolean): Promise<void> {
		await this.client.begin(async (transaction) => {
			if (email === null) {
				await transaction`UPDATE users SET max_passwords = ${maxPasswords} WHERE username = ${username}`;
			} else {
				await transaction`
          UPDATE users SET email = ${email}, max_passwords = ${maxPasswords} WHERE username = ${username}
        `;
			}

			if (disablePremium) {
				await transaction`
          UPDATE users SET premium_expires = NULL, max_passwords = ${config.account.maxPasswords}
          WHERE username = ${username}
        `;
			}
		});

		if (disableTwoFactor) {
			if (isMysql()) {
				await this.client.unsafe("UPDATE users SET `2fa_secret` = NULL, yubico_otp = NULL, backup_codes = NULL WHERE username = ?", [username]);
			} else if (isSqlite()) {
				await this.client.unsafe('UPDATE users SET "2fa_secret" = NULL, yubico_otp = NULL, backup_codes = NULL WHERE username = ?', [username]);
			} else {
				await this.client.unsafe('UPDATE users SET "2fa_secret" = NULL, yubico_otp = NULL, backup_codes = NULL WHERE username = $1', [username]);
			}
		}
	}

	async adminLicenseStats(): Promise<AdminLicenseStats> {
		const [licenses, unusedLicenses] = await Promise.all([
			this.client`SELECT COUNT(*) AS amount FROM licenses`,
			this.client`SELECT COUNT(*) AS amount FROM licenses WHERE linked IS NULL`,
		]);

		return {
			licenses: Number(licenses[0]?.amount ?? 0),
			unusedLicenses: Number(unusedLicenses[0]?.amount ?? 0),
		};
	}

	async adminLicenseCount(search: string): Promise<number> {
		const pattern = `%${search}%`;
		const rows = search
			? await this.client`SELECT COUNT(*) AS amount FROM licenses WHERE license LIKE ${pattern} OR linked LIKE ${pattern}`
			: await this.client`SELECT COUNT(*) AS amount FROM licenses`;

		return Number(rows[0]?.amount ?? 0);
	}

	async adminLicenses(search: string, limit = 25, offset = 0): Promise<LicenseRow[]> {
		const pattern = `%${search}%`;
		const rows = search
			? await this.client`
          SELECT * FROM licenses WHERE license LIKE ${pattern} OR linked LIKE ${pattern}
          ORDER BY created DESC, license ASC LIMIT ${limit} OFFSET ${offset}
        `
			: await this.client`SELECT * FROM licenses ORDER BY created DESC, license ASC LIMIT ${limit} OFFSET ${offset}`;

		return rows.map((row: Record<string, unknown>) => ({
			...row,
			duration: Number(row.duration),
			created: dateOnly(row.created) ?? "",
			used: dateOnly(row.used),
		})) as LicenseRow[];
	}

	async createLicenses(licenses: string[], duration: number): Promise<void> {
		await this.client.begin(async (transaction) => {
			for (const license of licenses) {
				await transaction`INSERT INTO licenses (license, duration) VALUES (${license}, ${duration})`;
			}
		});
	}

	async deleteLicense(license: string): Promise<void> {
		await this.client`DELETE FROM licenses WHERE license = ${license}`;
	}
}
