import { expect } from "bun:test";

import type { EncryptedPasswordInput } from "../src/types.ts";

for (const name of Object.keys(Bun.env)) {
	if (/^(DATABASE|MYSQL|REDIS|MAIL|YUBI|CF_TURNSTILE|BURROWGATE|LOKI|ACCOUNT|LIMITER|REPORTS|ARGON2)_/.test(name)) {
		delete Bun.env[name];
	}
}

Bun.env.DATABASE_URL = "sqlite://:memory:";
Bun.env.MAIL_ENABLED = "false";
Bun.env.YUBI_CLOUD = "http://127.0.0.1:9/verify";
Bun.env.LIMITER_ENABLED = "false";
Bun.env.LOG_PRESET = "minimal";
Bun.env.ADMIN_USERNAME = "admin";
Bun.env.ADMIN_PASSWORD = "a-strong-admin-password-for-tests";
Bun.env.METRICS_ENABLED = "true";
Bun.env.METRICS_TOKEN = "";
Bun.env.TRUSTED_PROXIES = "127.0.0.1";

export const { createApp } = await import("../src/app.ts");
export const { config } = await import("../src/config.ts");
export const { Database } = await import("../src/database.ts");
export const { Maintenance } = await import("../src/maintenance.ts");

export const clientHash = "a".repeat(128);
export const otherClientHash = "b".repeat(128);
export const encryptedValue = "x".repeat(36);
export const otherEncryptedValue = "y".repeat(36);

export type JsonObject = Record<string, unknown>;
type AppOptions = NonNullable<Parameters<typeof createApp>[2]>;

interface ApiRequestOptions {
	username?: string;
	password?: string;
	fields?: Record<string, string>;
	headers?: Record<string, string>;
	rawBody?: string;
	ip?: string | null;
	origin?: string;
	path?: "/" | "/index.php";
}

export async function json(response: Response): Promise<JsonObject> {
	return response.json() as Promise<JsonObject>;
}

export async function expectError(response: Promise<Response>, error: number): Promise<JsonObject> {
	const body = await json(await response);

	expect(body.error).toBe(error);
	expect(typeof body.info).toBe("string");

	return body;
}

export function encryptedFields(
	overrides: Partial<Record<"website" | "username" | "password" | "message", string>> = {},
): EncryptedPasswordInput & Record<string, string> {
	return {
		website: encryptedValue,
		username: encryptedValue,
		password: encryptedValue,
		message: encryptedValue,
		...overrides,
	} as EncryptedPasswordInput & Record<string, string>;
}

export async function createFixture(
	legacyApi: AppOptions["legacyApi"] = { limiterEnabled: false },
	appOptions: Omit<AppOptions, "legacyApi" | "logging"> = {},
) {
	const database = new Database();
	await database.initialize();

	const maintenance = new Maintenance(database);
	const created = createApp(database, maintenance, {
		...appOptions,
		logging: false,
		legacyApi,
	});

	function apiRequest(action: string, options: ApiRequestOptions = {}): Promise<Response> {
		const headers = new Headers(options.headers);
		let body: string | undefined;

		if (options.ip !== null) headers.set("x-real-ip", options.ip ?? "192.0.2.10");

		if (options.username !== undefined && options.password !== undefined) {
			headers.set("authorization", `Basic ${btoa(`${options.username}:${options.password}`)}`);
		}

		if (options.origin !== undefined) headers.set("origin", options.origin);

		if (options.rawBody !== undefined) {
			headers.set("content-type", "application/json");
			body = options.rawBody;
		} else if (options.fields !== undefined) {
			headers.set("content-type", "application/x-www-form-urlencoded");
			body = new URLSearchParams(options.fields).toString();
		}

		return created.app.handle(
			new Request(`http://passky.test${options.path ?? "/"}?action=${encodeURIComponent(action)}`, {
				method: body === undefined ? "GET" : "POST",
				headers,
				...(body === undefined ? {} : { body }),
			}),
		);
	}

	async function createAccount(username = "testuser", password = clientHash, email = `${username}@example.com`): Promise<void> {
		await expectError(
			apiRequest("createAccount", {
				username,
				password,
				fields: { email },
			}),
			0,
		);
	}

	async function getToken(username = "testuser", password = clientHash, ip = "192.0.2.10", otp = ""): Promise<string> {
		const body = await expectError(
			apiRequest("getToken", {
				username,
				password,
				ip,
				fields: { otp },
			}),
			8,
		);

		expect(typeof body.token).toBe("string");
		return String(body.token);
	}

	async function createAuthenticatedAccount(username = "testuser", password = clientHash, ip = "192.0.2.10"): Promise<string> {
		await createAccount(username, password);

		return getToken(username, password, ip);
	}

	async function adminSession(): Promise<{ cookie: string; csrf: string }> {
		const login = await created.app.handle(
			new Request("http://passky.test/admin/login", {
				method: "POST",
				headers: { "content-type": "application/x-www-form-urlencoded" },
				body: new URLSearchParams({
					username: "admin",
					password: "a-strong-admin-password-for-tests",
					"cf-turnstile-response": "development-test-key",
				}),
			}),
		);

		expect(login.status).toBe(303);
		const setCookie = login.headers.get("set-cookie") ?? "";
		expect(setCookie).toContain("HttpOnly");
		expect(setCookie).toContain("SameSite=Strict");

		const cookie = setCookie.split(";", 1)[0] ?? "";
		const dashboard = await created.app.handle(new Request("http://passky.test/", { headers: { cookie } }));
		const html = await dashboard.text();
		const csrf = html.match(/name="csrf" value="([^"]+)"/)?.[1] ?? "";

		expect(html).toContain("Accounts");
		expect(csrf).toHaveLength(64);

		return { cookie, csrf };
	}

	function adminPost(path: string, cookie: string, fields: Record<string, string>): Promise<Response> {
		return created.app.handle(
			new Request(`http://passky.test${path}`, {
				method: "POST",
				headers: {
					cookie,
					"content-type": "application/x-www-form-urlencoded",
				},
				body: new URLSearchParams(fields),
			}),
		);
	}

	async function close(): Promise<void> {
		created.legacyApi.close();
		maintenance.stop();
		await database.close();
	}

	return {
		adminPost,
		adminSession,
		apiRequest,
		app: created.app,
		close,
		createAccount,
		createAuthenticatedAccount,
		database,
		getToken,
		maintenance,
	};
}

export type Fixture = Awaited<ReturnType<typeof createFixture>>;
