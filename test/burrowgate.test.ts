import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import { clientHash, createFixture, json, type Fixture } from "./helpers.ts";

const secret = "burrowgate-origin-secret-for-tests";

let fixture: Fixture;

async function hmac(value: string, key = secret): Promise<string> {
	const cryptoKey = await crypto.subtle.importKey("raw", new TextEncoder().encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
	const signature = new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(value)));

	return Array.from(signature, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function signed(
	path: string,
	options: {
		method?: string;
		clientIp?: string;
		username?: string;
		password?: string;
		fields?: Record<string, string>;
		headers?: Record<string, string>;
		timestamp?: number;
		signedPath?: string;
		key?: string;
	} = {},
): Promise<Request> {
	const method = options.method ?? (options.fields ? "POST" : "GET");
	const clientIp = options.clientIp ?? "203.0.113.20";
	const timestamp = String(options.timestamp ?? Math.floor(Date.now() / 1_000));
	const canonical = [method, options.signedPath ?? path, "session-1", clientIp, "SI", timestamp].join("\n");
	const headers = new Headers({
		...options.headers,
		"x-burrowgate-session-id": "session-1",
		"x-burrowgate-client-ip": clientIp,
		"x-burrowgate-country": "SI",
		"x-burrowgate-timestamp": timestamp,
		"x-burrowgate-signature": await hmac(canonical, options.key),
	});

	if (options.username !== undefined) headers.set("authorization", `Basic ${btoa(`${options.username}:${options.password}`)}`);
	if (options.fields) headers.set("content-type", "application/x-www-form-urlencoded");

	return new Request(`http://passky.test${path}`, {
		method,
		headers,
		...(options.fields ? { body: new URLSearchParams(options.fields).toString() } : {}),
	});
}

async function call(request: Request): Promise<{ status: number; body: Record<string, unknown> }> {
	const response = await fixture.app.handle(request);

	return { status: response.status, body: await json(response) };
}

async function createSignedAccount(): Promise<void> {
	const response = await call(
		await signed("/?action=createAccount", { username: "testuser", password: clientHash, fields: { email: "testuser@example.com" } }),
	);

	expect(response.body.error).toBe(0);
}

function reportedUser(response: Response): { username: string | null; signature: string | null } {
	return {
		username: response.headers.get("x-burrowgate-origin-user"),
		signature: response.headers.get("x-burrowgate-origin-user-signature"),
	};
}

beforeEach(async () => {
	fixture = await createFixture({ limiterEnabled: false }, { burrowgate: { secret } });
});

afterEach(async () => {
	await fixture.close();
});

describe("BurrowGate origin verification", () => {
	test("rejects requests that did not pass through BurrowGate", async () => {
		const direct = await call(new Request("http://passky.test/?action=getInfo"));

		expect(direct.status).toBe(403);
		expect(direct.body.error).toBe(999);

		const admin = await fixture.app.handle(new Request("http://passky.test/"));
		expect(admin.status).toBe(403);
	});

	test("accepts signed requests", async () => {
		const response = await call(await signed("/?action=getInfo"));

		expect(response.status).toBe(200);
		expect(response.body.error).toBe(0);
	});

	test("rejects tampered paths, wrong secrets, and stale timestamps", async () => {
		for (const request of [
			await signed("/?action=getStats", { signedPath: "/?action=getInfo" }),
			await signed("/?action=getInfo", { key: "another-secret" }),
			await signed("/?action=getInfo", {
				timestamp: Math.floor(Date.now() / 1_000) - 300,
			}),
		]) {
			const response = await call(request);

			expect(response.status).toBe(403);
			expect(response.body.error).toBe(999);
		}
	});

	test("binds tokens to the signed client IP and ignores forwarded IP headers", async () => {
		await call(
			await signed("/?action=createAccount", {
				username: "testuser",
				password: clientHash,
				fields: { email: "testuser@example.com" },
			}),
		);
		const login = await call(
			await signed("/?action=getToken", {
				username: "testuser",
				password: clientHash,
				fields: { otp: "" },
				clientIp: "203.0.113.20",
				headers: {
					"cf-connecting-ip": "198.51.100.1",
					"x-real-ip": "198.51.100.1",
				},
			}),
		);
		const token = String(login.body.token);

		expect(login.body.error).toBe(8);

		const sameClient = await call(
			await signed("/?action=getPasswords", {
				username: "testuser",
				password: token,
				fields: {},
				clientIp: "203.0.113.20",
			}),
		);
		expect(sameClient.body.error).toBe(8);

		const spoofed = await call(
			await signed("/?action=getPasswords", {
				username: "testuser",
				password: token,
				fields: {},
				clientIp: "198.51.100.1",
				headers: {
					"cf-connecting-ip": "203.0.113.20",
					"x-real-ip": "203.0.113.20",
				},
			}),
		);
		expect(spoofed.body.error).toBe(25);
	});

	test("keeps the local health check and metrics reachable without a signature", async () => {
		expect((await fixture.app.handle(new Request("http://passky.test/health"))).status).toBe(200);
		expect((await fixture.app.handle(new Request("http://passky.test/metrics"))).status).toBe(200);
	});

	test("does not report usernames unless enabled", async () => {
		await createSignedAccount();
		const login = await fixture.app.handle(await signed("/?action=getToken", { username: "testuser", password: clientHash, fields: { otp: "" } }));

		expect((await json(login)).error).toBe(8);
		expect(reportedUser(login)).toEqual({ username: null, signature: null });
	});
});

describe("BurrowGate username reporting", () => {
	beforeEach(async () => {
		await fixture.close();
		fixture = await createFixture({ limiterEnabled: false }, { burrowgate: { secret, reportUsernames: true } });
		await createSignedAccount();
	});

	test("reports verified Passky usernames with a valid signature", async () => {
		const request = await signed("/?action=getToken", { username: "TestUser", password: clientHash, fields: { otp: "" } });
		const login = await fixture.app.handle(request);
		const token = String((await json(login)).token);
		const reported = reportedUser(login);

		expect(reported.username).toBe("testuser");
		expect(reported.signature).toBe(await hmac([request.headers.get("x-burrowgate-signature"), "testuser"].join("\n")));

		const passwords = await fixture.app.handle(await signed("/?action=getPasswords", { username: "testuser", password: token, fields: {} }));
		expect(reportedUser(passwords).username).toBe("testuser");
	});

	test("never reports usernames that were not verified", async () => {
		for (const request of [
			await signed("/?action=getToken", { username: "testuser", password: "b".repeat(128), fields: { otp: "" } }),
			await signed("/?action=getToken", { username: "unknownuser", password: clientHash, fields: { otp: "" } }),
			await signed("/?action=getPasswords", { username: "testuser", password: "c".repeat(64), fields: {} }),
			await signed("/?action=createAccount", { username: "newaccount", password: clientHash, fields: { email: "new@example.com" } }),
			await signed("/?action=getInfo"),
		]) {
			expect(reportedUser(await fixture.app.handle(request))).toEqual({ username: null, signature: null });
		}
	});

	test("reports the administrator only after signing in", async () => {
		const loginPage = await fixture.app.handle(await signed("/"));
		expect(reportedUser(loginPage).username).toBeNull();

		const login = await fixture.app.handle(
			await signed("/admin/login", {
				fields: { username: "admin", password: "a-strong-admin-password-for-tests", "cf-turnstile-response": "development-test-key" },
			}),
		);
		const cookie = login.headers.get("set-cookie")?.split(";", 1)[0] ?? "";
		expect(reportedUser(login).username).toBe("admin");

		const dashboard = await fixture.app.handle(await signed("/?section=overview", { headers: { cookie } }));
		expect(reportedUser(dashboard).username).toBe("admin");
	});
});
