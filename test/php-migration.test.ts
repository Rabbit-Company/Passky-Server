import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { Database as SQLite } from "bun:sqlite";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { generateTOTP } from "@rabbit-company/totp";

import { addDays, today } from "../src/time.ts";

const phpSqliteSchema = `
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
  CREATE TABLE IF NOT EXISTS "passwords"
  (
    "password_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "owner" VARCHAR(30) NOT NULL,
    "website" VARCHAR(255) NOT NULL,
    "username" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "message" VarChar(10000) NOT NULL
  );
  CREATE TABLE IF NOT EXISTS "licenses"
  (
    "license" VARCHAR(30) NOT NULL PRIMARY KEY,
    "duration" Int NOT NULL DEFAULT 365,
    "created" Date NOT NULL DEFAULT (CURRENT_DATE),
    "used" Date,
    "linked" VARCHAR(30) DEFAULT NULL
  );
  CREATE INDEX IF NOT EXISTS "owner_idx" ON "passwords" ("owner");
`;

const legacyHash = "1".repeat(128);
const totpHash = "2".repeat(128);
const premiumHash = "3".repeat(128);
const totpSecret = "JBSWY3DPEHPK3PXP";
const license = "LEGAC-YLICE-NSEKE-YAAAA-00001";
const encrypted = (seed: string) => seed.repeat(36);

let root: string;
let databaseFile: string;
let baseUrl: string;
let server: ReturnType<typeof Bun.spawn>;
let originalSchema: string[];

async function phpBcrypt(clientHash: string): Promise<string> {
	const hash = await Bun.password.hash(clientHash.slice(0, 72), {
		algorithm: "bcrypt",
		cost: 10,
	});

	return hash.replace(/^\$2[ab]\$/, "$2y$");
}

function tableSchema(file: string): string[] {
	const database = new SQLite(file, { readonly: true });
	const rows = database
		.query("SELECT sql FROM sqlite_master WHERE type = 'table' AND name IN ('users', 'passwords', 'licenses') ORDER BY name")
		.all() as Array<{ sql: string }>;
	database.close();

	return rows.map((row) => row.sql);
}

function freePort(): number {
	const probe = Bun.serve({
		port: 0,
		hostname: "127.0.0.1",
		fetch: () => new Response(),
	});
	const port = probe.port ?? 0;
	probe.stop(true);

	return port;
}

async function api(
	action: string,
	options: {
		username?: string;
		password?: string;
		fields?: Record<string, string>;
		body?: string;
	} = {},
): Promise<Record<string, unknown>> {
	const headers = new Headers();
	if (options.username !== undefined) headers.set("authorization", `Basic ${btoa(`${options.username}:${options.password}`)}`);

	let body: string | undefined = options.body;
	if (options.fields !== undefined) {
		headers.set("content-type", "application/x-www-form-urlencoded");
		body = new URLSearchParams(options.fields).toString();
	}

	const response = await fetch(`${baseUrl}/index.php?action=${action}`, {
		method: body === undefined ? "GET" : "POST",
		headers,
		...(body === undefined ? {} : { body }),
	});

	expect(response.status).toBe(200);
	expect(response.headers.get("content-type")).toContain("application/json");

	return response.json() as Promise<Record<string, unknown>>;
}

async function token(username: string, password: string, otp = ""): Promise<string> {
	const response = await api("getToken", {
		username,
		password,
		fields: { otp },
	});
	expect([0, 8]).toContain(Number(response.error));

	return String(response.token);
}

beforeAll(async () => {
	root = mkdtempSync(join(tmpdir(), "passky-php-migration-"));
	databaseFile = join(root, "passky.db");

	const database = new SQLite(databaseFile);
	for (const statement of phpSqliteSchema.split(";")) {
		if (statement.trim()) database.run(statement);
	}

	const insertUser = database.prepare(`
    INSERT INTO users (username, email, password, "2fa_secret", yubico_otp, backup_codes, max_passwords, premium_expires, created, accessed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
	insertUser.run("legacyuser", "legacy@example.com", await phpBcrypt(legacyHash), null, null, null, 1000, null, "2023-01-10", "2024-01-01");
	insertUser.run(
		"totpuser",
		"totp@example.com",
		await phpBcrypt(totpHash),
		totpSecret,
		null,
		"111111;222222;333333;444444;555555;666666;777777;888888;999999;123456",
		1000,
		null,
		"2023-02-01",
		"2024-02-01",
	);
	insertUser.run("premiumuser", "premium@example.com", await phpBcrypt(premiumHash), null, null, null, -1, addDays(today(), 100), "2023-03-01", "2024-03-01");

	const insertPassword = database.prepare("INSERT INTO passwords (password_id, owner, website, username, password, message) VALUES (?, ?, ?, ?, ?, ?)");
	insertPassword.run(7, "legacyuser", encrypted("a"), encrypted("b"), encrypted("c"), encrypted("d"));
	insertPassword.run(9, "legacyuser", encrypted("e"), encrypted("f"), encrypted("g"), encrypted("h"));

	database.run("INSERT INTO licenses (license, duration, created) VALUES (?, 30, '2024-01-01')", [license]);
	database.run(
		"INSERT INTO licenses (license, duration, created, used, linked) VALUES ('USEDL-ICENS-EKEYA-AAAAA-00002', 365, '2024-01-01', '2024-01-02', 'premiumuser')",
	);
	database.close();

	originalSchema = tableSchema(databaseFile);

	const port = freePort();
	baseUrl = `http://127.0.0.1:${port}`;
	server = Bun.spawn([process.execPath, join(import.meta.dir, "..", "src", "index.ts")], {
		cwd: root,
		env: {
			PATH: Bun.env.PATH ?? "",
			TZ: "UTC",
			SERVER_HOST: "127.0.0.1",
			SERVER_PORT: String(port),
			DATABASE_ENGINE: "sqlite",
			DATABASE_FILE: databaseFile,
			REDIS_HOST: "127.0.0.1",
			REDIS_PORT: "1",
			REDIS_LOCAL_HOST: "127.0.0.1",
			MYSQL_CACHE_MODE: "0",
			ACCOUNT_MAX: "100",
			ACCOUNT_MAX_PASSWORDS: "1000",
			ACCOUNT_PREMIUM: "-1",
			LIMITER_ENABLED: "false",
			LOG_PRESET: "minimal",
			ADMIN_PASSWORD: "",
		},
		stdout: "pipe",
		stderr: "pipe",
	});

	for (let attempt = 0; attempt < 100; attempt += 1) {
		try {
			if ((await fetch(`${baseUrl}/health`)).ok) return;
		} catch {}
		await Bun.sleep(50);
	}

	server.kill();
	throw new Error(`Passky Server did not start: ${await new Response(server.stderr as ReadableStream).text()}`);
}, 30_000);

afterAll(async () => {
	server?.kill("SIGTERM");
	await server?.exited;
	rmSync(root, { recursive: true, force: true });
});

describe("upgrade from a PHP-era SQLite database", () => {
	test("reports the existing users and passwords", async () => {
		const info = await api("getInfo");

		expect(info.error).toBe(0);
		expect(info.users).toBe(3);
		expect(info.passwords).toBe(2);
	});

	test("signs in with a PHP bcrypt hash, returns existing passwords, and upgrades only that hash", async () => {
		const response = await api("getToken", {
			username: "LegacyUser",
			password: legacyHash,
			fields: { otp: "" },
		});

		expect(response.error).toBe(0);
		expect(response.token).toMatch(/^[a-f0-9]{64}$/);
		expect(response.auth).toBe(false);
		expect(response.yubico).toBeNull();
		expect(response.max_passwords).toBe(1000);
		expect(response.premium_expires).toBeNull();
		expect(response.passwords).toEqual([
			{
				id: 7,
				website: encrypted("a"),
				username: encrypted("b"),
				password: encrypted("c"),
				message: encrypted("d"),
			},
			{
				id: 9,
				website: encrypted("e"),
				username: encrypted("f"),
				password: encrypted("g"),
				message: encrypted("h"),
			},
		]);

		const sameBcryptPrefix = `${legacyHash.slice(0, 72)}${"0".repeat(56)}`;
		await expect(
			api("getToken", {
				username: "legacyuser",
				password: sameBcryptPrefix,
				fields: { otp: "" },
			}),
		).resolves.toMatchObject({ error: 2 });

		const database = new SQLite(databaseFile, { readonly: true });
		const users = database.query("SELECT username, password, accessed FROM users ORDER BY username").all() as Array<Record<string, string>>;
		database.close();

		expect(users.find((user) => user.username === "legacyuser")?.password).toStartWith("$argon2id$");
		expect(users.find((user) => user.username === "legacyuser")?.accessed).toBe(today());
		expect(users.find((user) => user.username === "premiumuser")?.password).toStartWith("$2y$");
		expect(await token("legacyuser", legacyHash)).toBe(String(response.token));
	});

	test("keeps PHP Google2FA secrets working", async () => {
		await expect(
			api("getToken", {
				username: "totpuser",
				password: totpHash,
				fields: { otp: "" },
			}),
		).resolves.toMatchObject({ error: 19 });

		const response = await api("getToken", {
			username: "totpuser",
			password: totpHash,
			fields: { otp: await generateTOTP(totpSecret) },
		});

		expect(response.error).toBe(8);
		expect(response.auth).toBe(true);
	});

	test("edits, deletes, saves, and imports passwords on migrated rows", async () => {
		const auth = {
			username: "legacyuser",
			password: await token("legacyuser", legacyHash),
		};
		const fields = {
			website: encrypted("w"),
			username: encrypted("x"),
			password: encrypted("y"),
			message: encrypted("z"),
		};

		await expect(api("editPassword", { ...auth, fields: { password_id: "9", ...fields } })).resolves.toMatchObject({ error: 0 });
		await expect(api("deletePassword", { ...auth, fields: { password_id: "7" } })).resolves.toMatchObject({ error: 0 });
		await expect(api("savePassword", { ...auth, fields })).resolves.toMatchObject({ error: 0 });
		await expect(
			api("importPasswords", {
				...auth,
				body: JSON.stringify([fields, { website: "short" }]),
			}),
		).resolves.toMatchObject({ error: 0, import_success: 1, import_error: 1 });

		const listed = await api("getPasswords", { ...auth, fields: {} });
		const passwords = listed.passwords as Array<Record<string, unknown>>;

		expect(passwords).toHaveLength(3);
		expect(passwords[0]).toEqual({ id: 9, ...fields });
		expect(passwords.map((password) => typeof password.id)).toEqual(["number", "number", "number"]);
	});

	test("redeems an existing license and rejects one used before the upgrade", async () => {
		const auth = {
			username: "legacyuser",
			password: await token("legacyuser", legacyHash),
		};

		await expect(api("upgradeAccount", { ...auth, fields: { license } })).resolves.toMatchObject({
			error: 0,
			max_passwords: -1,
			premium_expires: addDays(today(), 30),
		});
		await expect(
			api("upgradeAccount", {
				...auth,
				fields: { license: "USEDL-ICENS-EKEYA-AAAAA-00002" },
			}),
		).resolves.toMatchObject({ error: 30 });

		const premium = await api("getToken", {
			username: "premiumuser",
			password: premiumHash,
			fields: { otp: "" },
		});
		expect(premium.max_passwords).toBe(-1);
		expect(premium.premium_expires).toBe(addDays(today(), 100));
	});

	test("deletes an account and its passwords", async () => {
		const auth = {
			username: "totpuser",
			password: await token("totpuser", totpHash, await generateTOTP(totpSecret)),
		};

		await expect(api("deleteAccount", { ...auth, fields: {} })).resolves.toMatchObject({ error: 0 });
		await expect(api("getPasswords", { ...auth, fields: {} })).resolves.toMatchObject({ error: 25 });

		const database = new SQLite(databaseFile, { readonly: true });
		expect(database.query("SELECT COUNT(*) AS amount FROM users").get()).toEqual({ amount: 2 });
		database.close();
	});

	test("leaves the PHP table definitions untouched and shuts down cleanly", async () => {
		server.kill("SIGTERM");

		expect(await server.exited).toBe(0);
		expect(tableSchema(databaseFile)).toEqual(originalSchema);
	});
});
