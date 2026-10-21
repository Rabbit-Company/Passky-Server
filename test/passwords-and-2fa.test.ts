import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import { generateTOTP } from "@rabbit-company/totp";

import {
	clientHash,
	createFixture,
	encryptedFields,
	encryptedValue,
	expectError,
	json,
	otherClientHash,
	otherEncryptedValue,
	type Fixture,
	type JsonObject,
} from "./helpers.ts";

let fixture: Fixture;

function yubiKeyOtp(publicId: string): string {
	return `${publicId}${"cbdefghijklnrtuv".repeat(2)}`;
}

function acceptYubicoOtps() {
	return spyOn(globalThis, "fetch").mockImplementation((async (input: string | URL | Request) => {
		const url = new URL(input instanceof Request ? input.url : String(input));

		return new Response(`otp=${url.searchParams.get("otp")}\r\nnonce=${url.searchParams.get("nonce")}\r\nstatus=OK\r\n`);
	}) as typeof fetch);
}

beforeEach(async () => {
	fixture = await createFixture();
});

afterEach(async () => {
	mock.restore();
	await fixture.close();
});

describe("encrypted passwords", () => {
	test("saves, lists, edits, and deletes encrypted passwords", async () => {
		const token = await fixture.createAuthenticatedAccount();
		await expectError(
			fixture.apiRequest("savePassword", {
				username: "testuser",
				password: token,
				fields: encryptedFields(),
			}),
			0,
		);

		const listed = await expectError(
			fixture.apiRequest("getPasswords", {
				username: "testuser",
				password: token,
				fields: {},
			}),
			0,
		);
		const passwords = listed.passwords as JsonObject[];
		expect(passwords).toHaveLength(1);
		expect(passwords[0]?.website).toBe(encryptedValue);
		expect(typeof passwords[0]?.id).toBe("number");

		const id = String(passwords[0]?.id);
		await expectError(
			fixture.apiRequest("editPassword", {
				username: "testuser",
				password: token,
				fields: {
					password_id: id,
					...encryptedFields({ website: otherEncryptedValue }),
				},
			}),
			0,
		);
		expect((await fixture.database.getPasswords("testuser"))[0]?.website).toBe(otherEncryptedValue);

		await expectError(
			fixture.apiRequest("deletePassword", {
				username: "testuser",
				password: token,
				fields: { password_id: id },
			}),
			0,
		);
		await expectError(
			fixture.apiRequest("getPasswords", {
				username: "testuser",
				password: token,
				fields: {},
			}),
			8,
		);
	});

	test("rejects password ids that are not plain integers", async () => {
		const token = await fixture.createAuthenticatedAccount();
		await expectError(
			fixture.apiRequest("savePassword", {
				username: "testuser",
				password: token,
				fields: encryptedFields(),
			}),
			0,
		);
		const id = String((await fixture.database.getPasswords("testuser"))[0]?.id);

		for (const passwordId of [`${id}abc`, `${id}.0`, ` ${id}`, "-1", "", "1e3"]) {
			await expectError(
				fixture.apiRequest("deletePassword", {
					username: "testuser",
					password: token,
					fields: { password_id: passwordId },
				}),
				10,
			);
		}

		expect(await fixture.database.userPasswordCount("testuser")).toBe(1);
	});

	test("scopes password edits and deletes to the owner at the database level", async () => {
		await fixture.createAccount("recordowner");
		await fixture.createAccount("otheruser", otherClientHash);
		await fixture.database.savePassword("recordowner", encryptedFields());
		const id = Number((await fixture.database.getPasswords("recordowner"))[0]?.id);

		await fixture.database.editPassword("otheruser", id, encryptedFields({ website: otherEncryptedValue }));
		await fixture.database.deletePassword("otheruser", id);

		const [stored] = await fixture.database.getPasswords("recordowner");
		expect(stored?.website).toBe(encryptedValue);
	});

	test("returns field-specific legacy encryption validation errors", async () => {
		const token = await fixture.createAuthenticatedAccount();

		for (const [field, error] of [
			["website", 300],
			["username", 301],
			["password", 302],
			["message", 303],
		] as const) {
			await expectError(
				fixture.apiRequest("savePassword", {
					username: "testuser",
					password: token,
					fields: encryptedFields({ [field]: "too-short" }),
				}),
				error,
			);
		}

		expect(await fixture.database.passwordCount()).toBe(0);
	});

	test("does not let one account edit or delete another account's password", async () => {
		const ownerToken = await fixture.createAuthenticatedAccount("recordowner", clientHash);
		await expectError(
			fixture.apiRequest("savePassword", {
				username: "recordowner",
				password: ownerToken,
				fields: encryptedFields(),
			}),
			0,
		);
		const id = String((await fixture.database.getPasswords("recordowner"))[0]?.id);

		const attackerToken = await fixture.createAuthenticatedAccount("otheruser", otherClientHash);
		await expectError(
			fixture.apiRequest("editPassword", {
				username: "otheruser",
				password: attackerToken,
				fields: {
					password_id: id,
					...encryptedFields({ website: otherEncryptedValue }),
				},
			}),
			10,
		);
		await expectError(
			fixture.apiRequest("deletePassword", {
				username: "otheruser",
				password: attackerToken,
				fields: { password_id: id },
			}),
			10,
		);

		expect(await fixture.database.userPasswordCount("recordowner")).toBe(1);
	});

	test("imports valid passwords, counts invalid passwords, and rejects malformed JSON", async () => {
		const token = await fixture.createAuthenticatedAccount();

		await expectError(
			fixture.apiRequest("importPasswords", {
				username: "testuser",
				password: token,
				rawBody: "not-json",
			}),
			14,
		);
		await expectError(
			fixture.apiRequest("importPasswords", {
				username: "testuser",
				password: token,
				rawBody: JSON.stringify({ not: "an array" }),
			}),
			14,
		);

		const imported = await expectError(
			fixture.apiRequest("importPasswords", {
				username: "testuser",
				password: token,
				rawBody: JSON.stringify([encryptedFields(), encryptedFields({ password: "invalid" }), null]),
			}),
			0,
		);

		expect(imported.import_success).toBe(1);
		expect(imported.import_error).toBe(2);
		expect(await fixture.database.userPasswordCount("testuser")).toBe(1);
	});

	test("enforces account limits for individual saves and bulk imports", async () => {
		const token = await fixture.createAuthenticatedAccount();
		await fixture.database.adminUpdateAccount("testuser", null, 1, false, false);

		await expectError(
			fixture.apiRequest("savePassword", {
				username: "testuser",
				password: token,
				fields: encryptedFields(),
			}),
			0,
		);
		await expectError(
			fixture.apiRequest("savePassword", {
				username: "testuser",
				password: token,
				fields: encryptedFields({ website: otherEncryptedValue }),
			}),
			16,
		);
		await expectError(
			fixture.apiRequest("importPasswords", {
				username: "testuser",
				password: token,
				rawBody: JSON.stringify([encryptedFields()]),
			}),
			16,
		);
	});

	test("deletes all passwords while preserving the account", async () => {
		const token = await fixture.createAuthenticatedAccount();
		await fixture.database.importPasswords("testuser", [encryptedFields(), encryptedFields()]);

		await expectError(
			fixture.apiRequest("deletePasswords", {
				username: "testuser",
				password: token,
				fields: {},
			}),
			0,
		);

		expect(await fixture.database.userPasswordCount("testuser")).toBe(0);
		expect(await fixture.database.findUser("testuser")).not.toBeNull();
	});
});

describe("two-factor authentication", () => {
	test("enables TOTP, requires a valid code, and disables it", async () => {
		const token = await fixture.createAuthenticatedAccount();
		const enabled = await expectError(
			fixture.apiRequest("enable2fa", {
				username: "testuser",
				password: token,
				fields: {},
			}),
			0,
		);

		const secret = String(enabled.secret);
		expect(secret).toHaveLength(20);
		expect(String(enabled.qrcode)).toContain("otpauth://totp/");
		expect(String(enabled.codes).split(";")).toHaveLength(10);

		await expectError(
			fixture.apiRequest("enable2fa", {
				username: "testuser",
				password: token,
				fields: {},
			}),
			26,
		);
		await expectError(
			fixture.apiRequest("getToken", {
				username: "testuser",
				password: clientHash,
				fields: { otp: "invalid" },
			}),
			19,
		);

		const otp = await generateTOTP(secret);
		const login = await json(
			await fixture.apiRequest("getToken", {
				username: "testuser",
				password: clientHash,
				fields: { otp },
			}),
		);
		expect([0, 8]).toContain(Number(login.error));

		await expectError(
			fixture.apiRequest("disable2fa", {
				username: "testuser",
				password: token,
				fields: {},
			}),
			0,
		);
		await expectError(
			fixture.apiRequest("disable2fa", {
				username: "testuser",
				password: token,
				fields: {},
			}),
			27,
		);
	});

	test("checks the password before revealing that two-factor authentication is required", async () => {
		const token = await fixture.createAuthenticatedAccount();
		await expectError(
			fixture.apiRequest("enable2fa", {
				username: "testuser",
				password: token,
				fields: {},
			}),
			0,
		);
		const fetchSpy = acceptYubicoOtps();

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
				password: otherClientHash,
				fields: { otp: yubiKeyOtp("cccccccccccb") },
			}),
			2,
		);
		await expectError(
			fixture.apiRequest("getToken", {
				username: "testuser",
				password: clientHash,
				fields: { otp: "" },
			}),
			19,
		);
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	test("links, signs in with, limits, and removes YubiKeys using the PHP storage format", async () => {
		const token = await fixture.createAuthenticatedAccount();
		acceptYubicoOtps();

		const first = await expectError(
			fixture.apiRequest("addYubiKey", {
				username: "testuser",
				password: token,
				fields: { id: yubiKeyOtp("cccccccccccb") },
			}),
			0,
		);
		expect(first.yubico).toBe("cccccccccccb");
		expect(String(first.codes).split(";")).toHaveLength(10);

		await expectError(
			fixture.apiRequest("addYubiKey", {
				username: "testuser",
				password: token,
				fields: { id: yubiKeyOtp("cccccccccccb") },
			}),
			21,
		);

		for (const publicId of ["cccccccccccd", "ccccccccccce", "cccccccccccf", "cccccccccccg"]) {
			await expectError(
				fixture.apiRequest("addYubiKey", {
					username: "testuser",
					password: token,
					fields: { id: yubiKeyOtp(publicId) },
				}),
				0,
			);
		}
		expect((await fixture.database.findUser("testuser"))?.yubico_otp).toBe("cccccccccccb;cccccccccccd;ccccccccccce;cccccccccccf;cccccccccccg");

		await expectError(
			fixture.apiRequest("addYubiKey", {
				username: "testuser",
				password: token,
				fields: { id: yubiKeyOtp("ccccccccccch") },
			}),
			20,
		);

		await expectError(
			fixture.apiRequest("getToken", {
				username: "testuser",
				password: clientHash,
				fields: { otp: "" },
			}),
			19,
		);
		await expectError(
			fixture.apiRequest("getToken", {
				username: "testuser",
				password: clientHash,
				fields: { otp: yubiKeyOtp("ccccccccccch") },
			}),
			19,
		);
		const login = await json(
			await fixture.apiRequest("getToken", {
				username: "testuser",
				password: clientHash,
				fields: { otp: yubiKeyOtp("ccccccccccce") },
			}),
		);
		expect(login.error).toBe(8);
		expect(login.yubico).toBe("cccccccccccb;cccccccccccd;ccccccccccce;cccccccccccf;cccccccccccg");

		const removed = await expectError(
			fixture.apiRequest("removeYubiKey", {
				username: "testuser",
				password: token,
				fields: { id: yubiKeyOtp("cccccccccccb") },
			}),
			0,
		);
		expect(removed.yubico).toBe("cccccccccccd;ccccccccccce;cccccccccccf;cccccccccccg");

		await expectError(
			fixture.apiRequest("removeYubiKey", {
				username: "testuser",
				password: token,
				fields: { id: yubiKeyOtp("cccccccccccb") },
			}),
			24,
		);
	});

	test("reads YubiKey lists left behind by the PHP removal logic", async () => {
		await fixture.createAccount();
		await fixture.database.updateYubiKeys("testuser", ";cccccccccccd");
		acceptYubicoOtps();

		const login = await json(
			await fixture.apiRequest("getToken", {
				username: "testuser",
				password: clientHash,
				fields: { otp: yubiKeyOtp("cccccccccccd") },
			}),
		);
		expect(login.error).toBe(8);

		await fixture.database.updateYubiKeys("testuser", "");
		await expectError(
			fixture.apiRequest("getToken", {
				username: "testuser",
				password: clientHash,
				fields: { otp: "" },
			}),
			8,
		);
	});
});
