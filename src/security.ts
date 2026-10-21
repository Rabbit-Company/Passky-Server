import { timingSafeEqual } from "node:crypto";

import Blake2b from "@rabbit-company/blake2b";
import PasswordEntropy from "@rabbit-company/password-entropy";
import PasswordGenerator from "@rabbit-company/password-generator";
import { generateTOTPSecret, generateTOTPURI, verifyTOTP } from "@rabbit-company/totp";

import { config } from "./config.ts";

const USERNAME_PATTERN = /^[a-z0-9._]{6,30}$/i;
const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z0-9-]{2,}$/i;
const CLIENT_HASH_PATTERN = /^[a-z0-9]{128}$/i;
const YUBICO_OTP_PATTERN = /^[cbdefghijklnrtuv]{44}$/i;

export function isUsernameValid(username: string): boolean {
	return USERNAME_PATTERN.test(username);
}

export function isEmailValid(email: string): boolean {
	return email.length <= 200 && EMAIL_PATTERN.test(email);
}

export function isClientHashValid(password: string): boolean {
	return CLIENT_HASH_PATTERN.test(password);
}

export function isEncryptedFieldValid(value: string, maximum: number): boolean {
	return value.length >= 36 && value.length <= maximum && !value.includes(" ");
}

export async function hashClientPassword(password: string): Promise<string> {
	return Bun.password.hash(password, {
		algorithm: "argon2id",
		memoryCost: config.argon2.memoryCost,
		timeCost: config.argon2.timeCost,
	});
}

export async function verifyClientPassword(password: string, storedHash: string): Promise<boolean> {
	if (/^\$2[aby]\$/i.test(storedHash)) {
		return Bun.password.verify(password.slice(0, 72), storedHash, "bcrypt");
	}

	return Bun.password.verify(password, storedHash);
}

export function passwordNeedsRehash(storedHash: string): boolean {
	if (!storedHash.startsWith("$argon2id$")) return true;

	const parameters = storedHash.match(/\$m=(\d+),t=(\d+),p=(\d+)\$/);
	if (!parameters) return true;

	return Number(parameters[1]) !== config.argon2.memoryCost || Number(parameters[2]) !== config.argon2.timeCost;
}

export function generateToken(): string {
	return Blake2b.hash(PasswordGenerator.generate(64), undefined, 32);
}

export function generateBackupCodes(): string {
	return Array.from({ length: 10 }, () => String(PasswordGenerator.randRange(100_000, 1_000_000))).join(";");
}

export function generateNonce(): string {
	return Array.from({ length: 5 }, () => String(PasswordGenerator.randRange(100_000, 1_000_000))).join("p");
}

export function anonymizeIp(ip: string, date: string): string {
	return new Bun.CryptoHasher("sha256").update(`${ip}passky2020${date.replaceAll("-", "")}`).digest("hex");
}

export function constantTimeEqual(left: string, right: string): boolean {
	const leftBytes = Buffer.from(left);
	const rightBytes = Buffer.from(right);

	return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes);
}

export async function verifySecondFactor(otp: string | null, secret: string | null, yubicoIds: string | null): Promise<boolean> {
	if (!secret && !yubicoIds) return true;
	if (!otp) return false;

	if (otp.length === 6) {
		return secret ? verifyTOTP(otp, secret, { window: 1 }) : false;
	}

	if (otp.length === 44) {
		return Boolean(yubicoIds?.split(";").includes(otp.slice(0, 12))) && verifyYubiOtp(otp);
	}

	return false;
}

function parseYubicoResponse(body: string): Map<string, string> {
	const fields = new Map<string, string>();

	for (const line of body.split(/\r?\n/)) {
		const separator = line.indexOf("=");
		if (separator > 0) fields.set(line.slice(0, separator).trim(), line.slice(separator + 1).trim());
	}

	return fields;
}

export async function verifyYubiOtp(otp: string): Promise<boolean> {
	if (!YUBICO_OTP_PATTERN.test(otp)) return false;

	const nonce = generateNonce();
	const url = new URL(config.yubico.cloudUrl);
	url.searchParams.set("id", String(config.yubico.clientId));
	url.searchParams.set("nonce", nonce);
	url.searchParams.set("otp", otp);
	url.searchParams.set("sl", "secure");
	url.searchParams.set("timestamp", "1");

	try {
		const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
		const fields = parseYubicoResponse(await response.text());

		return response.ok && fields.get("status") === "OK" && fields.get("nonce") === nonce && fields.get("otp") === otp;
	} catch {
		return false;
	}
}

export function createTwoFactorSecret(username: string): {
	secret: string;
	qrcode: string;
	codes: string;
} {
	const secret = generateTOTPSecret(20);

	return {
		secret,
		qrcode: generateTOTPURI({
			issuer: "Passky",
			accountName: username,
			secret,
		}),
		codes: generateBackupCodes(),
	};
}

export function configuredAdminPasswordEntropy(): number | null {
	return config.admin.password ? PasswordEntropy.calculate(config.admin.password) : null;
}
