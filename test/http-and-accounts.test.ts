import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";

import { clientHash, config, createFixture, encryptedFields, expectError, json, otherClientHash, type Fixture } from "./helpers.ts";
import { verifyClientPassword } from "../src/security.ts";

let fixture: Fixture;

beforeEach(async () => {
	fixture = await createFixture();
});

afterEach(async () => {
	await fixture.close();
});

describe("HTTP routing and legacy compatibility", () => {
	test("uses the configured trusted proxy list for middleware IP extraction", () => {
		expect(config.proxy.trustedProxies).toEqual(["127.0.0.1"]);
	});

	test("serves server information through both legacy entry points", async () => {
		for (const path of ["/", "/index.php"] as const) {
			const response = await fixture.apiRequest("getInfo", {
				path,
				origin: "https://app.passky.org",
			});
			const body = await json(response);

			expect(response.status).toBe(200);
			expect(response.headers.get("x-content-type-options")).toBe("nosniff");
			expect(response.headers.get("access-control-allow-origin")).toBe("*");
			expect(response.headers.get("access-control-allow-credentials")).toBeNull();
			expect(body.error).toBe(0);
			expect(body.version).toBe(config.version);
			expect(body.hashingAlgorithm).toBe("argon2id");
			expect(body.hashingMemoryCost).toBe(config.argon2.memoryCost);
			expect(body.users).toBe(0);
			expect(body.passwords).toBe(0);
		}
	});

	test("caches server counts instead of counting rows on every getInfo", async () => {
		const userCount = spyOn(fixture.database, "userCount");
		const passwordCount = spyOn(fixture.database, "passwordCount");

		await Promise.all([fixture.apiRequest("getInfo"), fixture.apiRequest("getInfo")]);
		expect(userCount).toHaveBeenCalledTimes(1);
		expect(passwordCount).toHaveBeenCalledTimes(1);

		await fixture.createAccount();
		userCount.mockClear();
		const info = await expectError(fixture.apiRequest("getInfo"), 0);

		expect(info.users).toBe(0);
		expect(userCount).not.toHaveBeenCalled();
	});

	test("reports legacy errors for invalid actions and missing arguments", async () => {
		await expectError(fixture.apiRequest("doesNotExist"), 401);
		await expectError(fixture.apiRequest("getToken"), 403);
	});

	test("serves health, metrics, preflight, and not-found responses", async () => {
		const health = await fixture.app.handle(new Request("http://passky.test/health"));
		expect(health.status).toBe(200);
		expect(await json(health)).toEqual({ status: "success" });

		const metrics = await fixture.app.handle(new Request("http://passky.test/metrics"));
		expect(metrics.status).toBe(200);
		expect(metrics.headers.get("content-type")).toContain("openmetrics");
		expect(await metrics.text()).toContain("passky_http_requests");

		const preflight = await fixture.app.handle(new Request("http://passky.test/index.php", { method: "OPTIONS" }));
		expect(preflight.status).toBe(204);

		const missing = await fixture.app.handle(new Request("http://passky.test/not-found"));
		expect(missing.status).toBe(404);
		expect((await json(missing)).error).toBe(404);
	});

	test("answers browser preflight requests for authenticated legacy calls", async () => {
		const preflight = await fixture.app.handle(
			new Request("http://passky.test/?action=getToken", {
				method: "OPTIONS",
				headers: {
					origin: "https://vault.passky.org",
					"access-control-request-method": "POST",
					"access-control-request-headers": "authorization, content-type",
				},
			}),
		);
		const allowedHeaders = preflight.headers.get("access-control-allow-headers")?.toLowerCase() ?? "";

		expect(preflight.status).toBe(204);
		expect(preflight.headers.get("access-control-allow-origin")).toBe("*");
		expect(preflight.headers.get("access-control-allow-methods")).toContain("POST");
		expect(allowedHeaders).toContain("authorization");
		expect(allowedHeaders).toContain("content-type");
	});

	test("accepts multipart form submissions like the PHP $_POST parser", async () => {
		const token = await fixture.createAuthenticatedAccount();
		const body = new FormData();

		for (const [name, value] of Object.entries(encryptedFields())) body.set(name, value);

		const response = await fixture.app.handle(
			new Request("http://passky.test/?action=savePassword", {
				method: "POST",
				headers: {
					authorization: `Basic ${btoa(`testuser:${token}`)}`,
					"x-real-ip": "192.0.2.10",
				},
				body,
			}),
		);

		expect((await json(response)).error).toBe(0);
		expect(await fixture.database.userPasswordCount("testuser")).toBe(1);
	});

	test("does not let request paths or methods grow metrics without bound", async () => {
		await fixture.app.handle(
			new Request("http://passky.test/admin/licenses/warmup/delete", {
				method: "POST",
			}),
		);
		const metrics = () => fixture.app.handle(new Request("http://passky.test/metrics")).then((response) => response.text());
		const before = (await metrics()).length;

		for (let index = 0; index < 50; index += 1) {
			await fixture.app.handle(
				new Request(`http://passky.test/admin/licenses/K${index}/delete`, {
					method: "POST",
				}),
			);
			await fixture.app.handle(
				new Request(`http://passky.test/admin/accounts/user${index}`, {
					method: "POST",
				}),
			);
		}

		const after = await metrics();
		expect(after).not.toContain("K10");
		expect(after).toContain('route="/admin/licenses/:license/delete"');
		expect(after.length - before).toBeLessThan(2_000);
	});

	test("keeps process and filesystem statistics private by default", async () => {
		const body = await expectError(fixture.apiRequest("getStats"), 33);

		expect(body).toEqual({ error: 33, info: "Statistics are disabled on this server." });
	});

	test("reports process and filesystem statistics when enabled", async () => {
		await fixture.close();
		fixture = await createFixture({ limiterEnabled: false, statsEnabled: true });

		const body = await expectError(fixture.apiRequest("getStats"), 0);

		expect(Number(body.cores)).toBeGreaterThan(0);
		expect(Number(body.memoryTotal)).toBeGreaterThan(0);
		expect(Number(body.diskTotal)).toBeGreaterThan(0);
	});

	test("rate limits an action per anonymized client IP", async () => {
		await fixture.close();
		fixture = await createFixture({
			limiterEnabled: true,
			limiterWindows: { getInfo: 60 },
		});

		await expectError(fixture.apiRequest("getInfo", { ip: "192.0.2.1" }), 0);
		await expectError(fixture.apiRequest("getInfo", { ip: "192.0.2.1" }), 429);
		await expectError(fixture.apiRequest("getInfo", { ip: "192.0.2.2" }), 0);
	});
});

describe("accounts and authentication", () => {
	test("validates account inputs and rejects duplicate usernames case-insensitively", async () => {
		await expectError(
			fixture.apiRequest("createAccount", {
				username: "short",
				password: clientHash,
				fields: { email: "valid@example.com" },
			}),
			12,
		);
		await expectError(
			fixture.apiRequest("createAccount", {
				username: "validuser",
				password: clientHash,
				fields: { email: "invalid" },
			}),
			6,
		);
		await expectError(
			fixture.apiRequest("createAccount", {
				username: "validuser",
				password: "not-a-client-hash",
				fields: { email: "valid@example.com" },
			}),
			5,
		);

		await fixture.createAccount("validuser");
		await expectError(
			fixture.apiRequest("createAccount", {
				username: "VALIDUSER",
				password: clientHash,
				fields: { email: "another@example.com" },
			}),
			4,
		);
		expect(await fixture.database.userCount()).toBe(1);
	});

	test("distinguishes unknown users, invalid passwords, and malformed hashes", async () => {
		await fixture.createAccount();

		await expectError(
			fixture.apiRequest("getToken", {
				username: "unknownuser",
				password: clientHash,
				fields: { otp: "" },
			}),
			1,
		);
		await expectError(
			fixture.apiRequest("getToken", {
				username: "testuser",
				password: otherClientHash,
				fields: { otp: "" },
			}),
			2,
		);
		await expectError(
			fixture.apiRequest("getToken", {
				username: "testuser",
				password: "invalid",
				fields: { otp: "" },
			}),
			5,
		);
	});

	test("issues stable 64-character tokens that are bound to the client IP", async () => {
		const token = await fixture.createAuthenticatedAccount();
		const repeated = await fixture.getToken();

		expect(token).toHaveLength(64);
		expect(repeated).toBe(token);
		await expectError(
			fixture.apiRequest("getPasswords", {
				username: "testuser",
				password: token,
				ip: "192.0.2.99",
				fields: {},
			}),
			25,
		);
	});

	test("accepts configured proxy headers but ignores the legacy client-ip header", async () => {
		const token = await fixture.createAuthenticatedAccount();

		await expectError(
			fixture.apiRequest("getPasswords", {
				username: "testuser",
				password: token,
				ip: null,
				headers: { "x-forwarded-for": "192.0.2.10" },
				fields: {},
			}),
			8,
		);
		await expectError(
			fixture.apiRequest("getPasswords", {
				username: "testuser",
				password: token,
				ip: null,
				headers: { "client-ip": "192.0.2.10" },
				fields: {},
			}),
			25,
		);
	});

	test("deletes the account, its passwords, and its active token", async () => {
		const token = await fixture.createAuthenticatedAccount();
		await expectError(
			fixture.apiRequest("savePassword", {
				username: "testuser",
				password: token,
				fields: encryptedFields(),
			}),
			0,
		);

		await expectError(
			fixture.apiRequest("deleteAccount", {
				username: "testuser",
				password: token,
				fields: {},
			}),
			0,
		);

		expect(await fixture.database.findUser("testuser")).toBeNull();
		expect(await fixture.database.passwordCount()).toBe(0);
		await expectError(
			fixture.apiRequest("getPasswords", {
				username: "testuser",
				password: token,
				fields: {},
			}),
			25,
		);
	});

	test("revokes tokens on every device so a re-registered username starts clean", async () => {
		await fixture.createAccount("victimuser");
		const phoneToken = await fixture.getToken("victimuser", clientHash, "198.51.100.7");
		const laptopToken = await fixture.getToken("victimuser", clientHash, "192.0.2.10");

		await expectError(
			fixture.apiRequest("deleteAccount", {
				username: "victimuser",
				password: laptopToken,
				fields: {},
			}),
			0,
		);

		await fixture.createAccount("victimuser", otherClientHash, "new-owner@example.com");
		const newToken = await fixture.getToken("victimuser", otherClientHash, "192.0.2.10");
		await expectError(
			fixture.apiRequest("savePassword", {
				username: "victimuser",
				password: newToken,
				fields: encryptedFields(),
			}),
			0,
		);

		await expectError(
			fixture.apiRequest("getPasswords", {
				username: "victimuser",
				password: phoneToken,
				ip: "198.51.100.7",
				fields: {},
			}),
			25,
		);
	});

	test("keeps unavailable mail and invalid YubiKey errors compatible", async () => {
		const token = await fixture.createAuthenticatedAccount();

		await expectError(
			fixture.apiRequest("forgotUsername", {
				fields: { email: "testuser@example.com" },
			}),
			28,
		);
		await expectError(
			fixture.apiRequest("addYubiKey", {
				username: "testuser",
				password: token,
				fields: { id: "invalid" },
			}),
			23,
		);
		await expectError(
			fixture.apiRequest("removeYubiKey", {
				username: "testuser",
				password: token,
				fields: { id: "invalid" },
			}),
			23,
		);
	});

	test("upgrades a legacy PHP bcrypt password hash after login", async () => {
		const phpBcrypt = "$2y$10$ODe5GQvgkDznYSxN54NFPOarpfibiM4AtyxbmE7cRnmCpvVdvFvYS";
		await fixture.database.createUser("legacyuser", "legacy@example.com", phpBcrypt, 1_000);

		await fixture.getToken("legacyuser", clientHash);

		const user = await fixture.database.findUser("legacyuser");
		expect(user?.password.startsWith("$argon2id$")).toBe(true);
		expect(await verifyClientPassword(clientHash, user?.password ?? "")).toBe(true);
	});
});
