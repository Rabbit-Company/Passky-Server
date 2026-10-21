import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { generateTOTP, verifyTOTP } from "@rabbit-company/totp";

import { clientHash, encryptedValue, otherClientHash } from "./helpers.ts";
import { Cache, legacyRedisUrl } from "../src/cache.ts";
import { parseTrustedProxies, resolveSqliteFile } from "../src/config.ts";
import { legacyResponse } from "../src/errors.ts";
import { routeLabel } from "../src/metrics.ts";
import {
	anonymizeIp,
	configuredAdminPasswordEntropy,
	constantTimeEqual,
	createTwoFactorSecret,
	generateBackupCodes,
	generateNonce,
	generateToken,
	hashClientPassword,
	isClientHashValid,
	isEmailValid,
	isEncryptedFieldValid,
	isUsernameValid,
	passwordNeedsRehash,
	verifyClientPassword,
	verifySecondFactor,
	verifyYubiOtp,
} from "../src/security.ts";
import { addDays, dateOnly, subDays, today } from "../src/time.ts";
import { TokenStore } from "../src/tokens.ts";

const yubicoOtp = `cccccccccccb${"cbdefghijklnrtuv".repeat(2)}`;

function yubicoReply(overrides: Record<string, string> = {}) {
	return spyOn(globalThis, "fetch").mockImplementation((async (input: string | URL | Request) => {
		const url = new URL(input instanceof Request ? input.url : String(input));
		const fields = {
			h: "signature",
			t: "2026-10-21T00:00:00Z0000",
			otp: url.searchParams.get("otp") ?? "",
			nonce: url.searchParams.get("nonce") ?? "",
			sl: "100",
			status: "OK",
			...overrides,
		};

		return new Response(
			Object.entries(fields)
				.map(([key, value]) => `${key}=${value}`)
				.join("\r\n"),
		);
	}) as typeof fetch);
}

afterEach(() => {
	mock.restore();
	process.env.TZ = "UTC";
});

describe("security helpers", () => {
	test("validates usernames, emails, client hashes, and encrypted fields", () => {
		expect(isUsernameValid("valid.user_1")).toBe(true);
		expect(isUsernameValid("short")).toBe(false);
		expect(isUsernameValid("invalid-user")).toBe(false);
		expect(isEmailValid("person+tag@example.com")).toBe(true);
		expect(isEmailValid("not-an-email")).toBe(false);
		expect(isClientHashValid(clientHash)).toBe(true);
		expect(isClientHashValid("a".repeat(127))).toBe(false);
		expect(isEncryptedFieldValid(encryptedValue, 255)).toBe(true);
		expect(isEncryptedFieldValid("x".repeat(35), 255)).toBe(false);
		expect(isEncryptedFieldValid(`${encryptedValue} `, 255)).toBe(false);
	});

	test("hashes and verifies client passwords with current Argon2id parameters", async () => {
		const hash = await hashClientPassword(clientHash);

		expect(hash).toStartWith("$argon2id$");
		expect(await verifyClientPassword(clientHash, hash)).toBe(true);
		expect(await verifyClientPassword(otherClientHash, hash)).toBe(false);
		expect(passwordNeedsRehash(hash)).toBe(false);
		expect(passwordNeedsRehash("$argon2id$invalid")).toBe(true);
		expect(passwordNeedsRehash("$2y$10$legacy")).toBe(true);
	});

	test("generates tokens, backup codes, nonces, and TOTP data in legacy formats", async () => {
		const token = generateToken();
		const backupCodes = generateBackupCodes();
		const nonce = generateNonce();
		const setup = createTwoFactorSecret("testuser");

		expect(token).toMatch(/^[a-f0-9]{64}$/);
		expect(backupCodes).toMatch(/^\d{6}(;\d{6}){9}$/);
		expect(nonce).toMatch(/^\d{6}(p\d{6}){4}$/);
		expect(setup.secret).toHaveLength(20);
		expect(setup.qrcode).toContain("issuer=Passky");
		expect(await verifySecondFactor(await generateTOTP(setup.secret), setup.secret, null)).toBe(true);
		expect(await verifySecondFactor("invalid", setup.secret, null)).toBe(false);
		expect(await verifySecondFactor(null, null, null)).toBe(true);
	});

	test("verifies RFC 6238 vectors and 16-character secrets created by the PHP server", async () => {
		const rfcSecret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
		const phpSecret = "JBSWY3DPEHPK3PXP";

		expect(await verifyTOTP("287082", rfcSecret, { timestamp: 59_000 })).toBe(true);
		expect(await verifyTOTP("287082", rfcSecret, { timestamp: 59_000 + 120_000 })).toBe(false);
		expect(await verifySecondFactor(await generateTOTP(phpSecret), phpSecret, null)).toBe(true);
	});

	test("accepts a YubiKey OTP only when status, nonce, and OTP all match", async () => {
		yubicoReply();
		expect(await verifyYubiOtp(yubicoOtp)).toBe(true);

		for (const overrides of [
			{ status: "REPLAYED_OTP" },
			{ status: "BAD_OTP", h: "status=OK" },
			{ nonce: "000000p000000" },
			{ otp: `${yubicoOtp.slice(0, 43)}c` },
		]) {
			mock.restore();
			yubicoReply(overrides);
			expect(await verifyYubiOtp(yubicoOtp)).toBe(false);
		}
	});

	test("rejects malformed YubiKey OTPs without contacting the validation server", async () => {
		const fetchSpy = yubicoReply();

		expect(await verifyYubiOtp("x".repeat(44))).toBe(false);
		expect(await verifyYubiOtp(yubicoOtp.slice(0, 43))).toBe(false);
		expect(await verifySecondFactor(`cccccccccccb${"a".repeat(31)}&`, null, "cccccccccccb")).toBe(false);
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	test("compares secrets safely and anonymizes IPs deterministically by date", () => {
		expect(constantTimeEqual("same", "same")).toBe(true);
		expect(constantTimeEqual("same", "different")).toBe(false);
		expect(constantTimeEqual("short", "longer")).toBe(false);

		const first = anonymizeIp("192.0.2.10", "2026-08-14");
		expect(first).toHaveLength(64);
		expect(anonymizeIp("192.0.2.10", "2026-08-14")).toBe(first);
		expect(anonymizeIp("192.0.2.10", "2026-08-15")).not.toBe(first);
	});
});

describe("cache, date, and response helpers", () => {
	test("handles UTC date arithmetic across month and leap-year boundaries", () => {
		expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
		expect(addDays("2024-02-28", 2)).toBe("2024-03-01");
		expect(addDays("2025-12-31", 1)).toBe("2026-01-01");
		expect(subDays("2026-01-01", 1)).toBe("2025-12-31");
		expect(today()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});

	test("stores, expires, and deletes in-memory cache entries", async () => {
		const cache = new Cache();

		await cache.set("active", "value", 60);
		expect(await cache.get("active")).toBe("value");
		await cache.delete("active");
		expect(await cache.get("active")).toBeNull();

		await cache.set("expired", "value", 0);
		cache.purgeExpired();
		expect(await cache.get("expired")).toBeNull();
		cache.close();
	});

	test("reads database dates correctly regardless of the server time zone", () => {
		for (const zone of ["UTC", "Europe/Ljubljana", "America/Los_Angeles", "Pacific/Kiritimati"]) {
			process.env.TZ = zone;

			expect(dateOnly(new Date(2026, 9, 21))).toBe("2026-10-21");
			expect(dateOnly(new Date("2026-10-21T00:00:00.000Z"))).toBe("2026-10-21");
			expect(dateOnly("2026-10-21")).toBe("2026-10-21");
			expect(dateOnly("2026-10-21 00:00:00")).toBe("2026-10-21");
			expect(dateOnly(null)).toBeNull();
		}
	});

	test("translates phpredis TLS hosts into Redis connection URLs", () => {
		expect(legacyRedisUrl("tlsv1.2://eu2-example.upstash.io", 30276, "p@ss/word")).toBe("rediss://:p%40ss%2Fword@eu2-example.upstash.io:30276");
		expect(legacyRedisUrl("tls://cache.example.com", 6380, "")).toBe("rediss://cache.example.com:6380");
		expect(legacyRedisUrl("ssl://cache.example.com", 6380, "")).toBe("rediss://cache.example.com:6380");
		expect(legacyRedisUrl("127.0.0.1", 6379, "")).toBe("redis://127.0.0.1:6379");

		const client = new Bun.RedisClient(legacyRedisUrl("tlsv1.2://eu2-example.upstash.io", 30276, "secret"));
		client.close();
	});

	test("deletes cache entries by prefix without touching similar keys", async () => {
		const cache = new Cache();

		await cache.set("token_alice-one", "1", 60);
		await cache.set("token_alice-two", "2", 60);
		await cache.set("token_alice.smith-one", "3", 60);
		await cache.deletePrefix("token_alice-");

		expect(await cache.get("token_alice-one")).toBeNull();
		expect(await cache.get("token_alice-two")).toBeNull();
		expect(await cache.get("token_alice.smith-one")).toBe("3");
		cache.close();
	});

	test("revokes every token of one account across client IPs", async () => {
		const tokens = new TokenStore();
		const laptop = await tokens.issue("alice", "192.0.2.10");
		const phone = await tokens.issue("alice", "198.51.100.7");
		const other = await tokens.issue("alice.smith", "192.0.2.10");

		expect(await tokens.issue("alice", "192.0.2.10")).toBe(laptop);
		expect(await tokens.verify("alice", "198.51.100.7", laptop)).toBe(false);

		await tokens.revoke("alice");

		expect(await tokens.verify("alice", "192.0.2.10", laptop)).toBe(false);
		expect(await tokens.verify("alice", "198.51.100.7", phone)).toBe(false);
		expect(await tokens.verify("alice.smith", "192.0.2.10", other)).toBe(true);
		tokens.close();
	});

	test("trusts private proxy networks by default and supports explicit opt-out", () => {
		expect(parseTrustedProxies("")).toContain("172.16.0.0/12");
		expect(parseTrustedProxies("")).toContain("127.0.0.0/8");
		expect(parseTrustedProxies("")).not.toContain("0.0.0.0/0");
		expect(parseTrustedProxies(" 203.0.113.5 , 198.51.100.0/24 ")).toEqual(["203.0.113.5", "198.51.100.0/24"]);
		expect(parseTrustedProxies("none")).toEqual([]);
		expect(parseTrustedProxies("NONE")).toEqual([]);
	});

	test("finds SQLite databases mounted at the PHP image location", () => {
		const root = mkdtempSync(join(tmpdir(), "passky-paths-"));
		const current = join(root, "app", "databases");
		const legacy = join(root, "var", "www", "html", "databases");

		try {
			mkdirSync(current, { recursive: true });
			expect(resolveSqliteFile("passky", current, legacy)).toBe(join(current, "passky.db"));

			mkdirSync(legacy, { recursive: true });
			expect(resolveSqliteFile("passky", current, legacy)).toBe(join(legacy, "passky.db"));

			writeFileSync(join(legacy, "passky.db"), "");
			expect(resolveSqliteFile("passky", current, legacy)).toBe(join(legacy, "passky.db"));

			writeFileSync(join(current, "passky.db"), "");
			expect(resolveSqliteFile("passky.db", current, legacy)).toBe(join(current, "passky.db"));
			expect(resolveSqliteFile("/srv/passky.db", current, legacy)).toBe("/srv/passky.db");
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});

	test("keeps metrics labels bounded for arbitrary request paths", () => {
		expect(routeLabel("/")).toBe("/");
		expect(routeLabel("/index.php")).toBe("/index.php");
		expect(routeLabel("/admin/accounts/someone")).toBe("/admin/accounts/:username");
		expect(routeLabel("/admin/licenses/AAAAA-BBBBB/delete")).toBe("/admin/licenses/:license/delete");
		expect(routeLabel("/random-path-123")).toBe("unmatched");
		expect(routeLabel("/admin/accounts/a/b/c")).toBe("unmatched");
	});

	test("keeps legacy error shape and checks configured admin password entropy", () => {
		expect(legacyResponse(25)).toEqual({
			error: 25,
			info: "Token is incorrect!",
		});
		expect(Number(configuredAdminPasswordEntropy())).toBeGreaterThan(0);
	});
});
