import nodemailer from "nodemailer";
import { statfs } from "node:fs/promises";
import { freemem, loadavg, totalmem } from "node:os";
import { Algorithm, RateLimiter } from "@rabbit-company/web-middleware/rate-limit";

import { config, type LegacyAction } from "./config.ts";
import type { Database } from "./database.ts";
import { legacyResponse, type LegacyResponse } from "./errors.ts";
import type { Maintenance } from "./maintenance.ts";
import { apiActionCounter } from "./metrics.ts";
import {
	anonymizeIp,
	createTwoFactorSecret,
	generateBackupCodes,
	hashClientPassword,
	isClientHashValid,
	isEmailValid,
	isEncryptedFieldValid,
	isUsernameValid,
	passwordNeedsRehash,
	verifyClientPassword,
	verifySecondFactor,
	verifyYubiOtp,
} from "./security.ts";
import { today } from "./time.ts";
import type { TokenStore } from "./tokens.ts";
import type { EncryptedPasswordInput, PasswordRow } from "./types.ts";

export interface LegacyRequest {
	action: string;
	username: string | null;
	password: string | null;
	fields: URLSearchParams;
	rawBody: string;
	clientIp: string;
}

export interface LegacyApiOptions {
	limiterEnabled?: boolean;
	limiterWindows?: Partial<Record<LegacyAction, number>>;
	reportsEnabled?: boolean;
}

const supportedActions = new Set<LegacyAction>([
	"getInfo",
	"getStats",
	"getToken",
	"createAccount",
	"getPasswords",
	"savePassword",
	"importPasswords",
	"editPassword",
	"deletePassword",
	"deletePasswords",
	"deleteAccount",
	"forgotUsername",
	"enable2fa",
	"disable2fa",
	"addYubiKey",
	"removeYubiKey",
	"upgradeAccount",
	"getReport",
]);

const requiredFields: Record<LegacyAction, string[]> = {
	getInfo: [],
	getStats: [],
	getToken: ["auth", "otp"],
	createAccount: ["auth", "email"],
	getPasswords: ["auth"],
	savePassword: ["auth", "website", "username", "password", "message"],
	importPasswords: ["auth", "rawBody"],
	editPassword: ["auth", "password_id", "website", "username", "password", "message"],
	deletePassword: ["auth", "password_id"],
	deletePasswords: ["auth"],
	deleteAccount: ["auth"],
	forgotUsername: ["email"],
	enable2fa: ["auth"],
	disable2fa: ["auth"],
	addYubiKey: ["auth", "id"],
	removeYubiKey: ["auth", "id"],
	upgradeAccount: ["auth", "license"],
	getReport: [],
};

function normalizePasswords(passwords: PasswordRow[]): Array<Record<string, unknown>> {
	return passwords.map((password) => ({
		...password,
		id: Number(password.id),
	}));
}

interface ServerCounts {
	users: number;
	passwords: number;
}

function countCacheMilliseconds(): number {
	return config.database.cacheMode >= 2 ? 12 * 60 * 60 * 1_000 : 60 * 1_000;
}

function parsePasswordId(value: string | null): number | null {
	return value !== null && /^\d{1,15}$/.test(value) ? Number(value) : null;
}

export class LegacyApi {
	private readonly limiters = new Map<LegacyAction, RateLimiter>();
	private cachedCounts: {
		expiresAt: number;
		value: Promise<ServerCounts>;
	} | null = null;
	private readonly limiterEnabled: boolean;
	private readonly reportsEnabled: boolean;

	constructor(
		private readonly database: Database,
		private readonly maintenance: Maintenance,
		private readonly tokens: TokenStore,
		options: LegacyApiOptions = {},
	) {
		this.limiterEnabled = options.limiterEnabled ?? config.limiter.enabled;
		this.reportsEnabled = options.reportsEnabled ?? config.reports.enabled;

		const windows = {
			...config.limiter.windows,
			...options.limiterWindows,
		};

		for (const [action, seconds] of Object.entries(windows)) {
			if (seconds > 0) {
				this.limiters.set(
					action as LegacyAction,
					new RateLimiter({
						algorithm: Algorithm.SLIDING_WINDOW,
						max: 1,
						window: seconds * 1_000,
					}),
				);
			}
		}
	}

	close(): void {
		this.tokens.close();
		for (const limiter of this.limiters.values()) limiter.clear();
	}

	async handle(request: LegacyRequest): Promise<LegacyResponse> {
		if (!supportedActions.has(request.action as LegacyAction)) return legacyResponse(401);

		const action = request.action as LegacyAction;

		if (!this.hasRequiredArguments(action, request)) return this.observe(action, legacyResponse(403));

		if (this.limiterEnabled) {
			const limiter = this.limiters.get(action);
			const identifier = anonymizeIp(request.clientIp, today());

			if (limiter?.check(action, identifier).limited) return this.observe(action, legacyResponse(429));
		}

		try {
			const response = await this.dispatch(action, request);

			return this.observe(action, response);
		} catch {
			return this.observe(action, legacyResponse(505));
		}
	}

	private observe(action: LegacyAction, response: LegacyResponse): LegacyResponse {
		apiActionCounter.inc(1, { action, error: String(response.error) });

		return response;
	}

	private hasRequiredArguments(action: LegacyAction, request: LegacyRequest): boolean {
		return requiredFields[action].every((name) => {
			if (name === "auth") return request.username !== null && request.password !== null;
			if (name === "rawBody") return request.rawBody !== null;

			return request.fields.has(name);
		});
	}

	private async dispatch(action: LegacyAction, request: LegacyRequest): Promise<LegacyResponse> {
		switch (action) {
			case "getInfo":
				return this.getInfo();
			case "getStats":
				return this.getStats();
			case "getToken":
				return this.getToken(request);
			case "createAccount":
				return this.createAccount(request);
			case "getPasswords":
				return this.getPasswords(request);
			case "savePassword":
				return this.savePassword(request);
			case "importPasswords":
				return this.importPasswords(request);
			case "editPassword":
				return this.editPassword(request);
			case "deletePassword":
				return this.deletePassword(request);
			case "deletePasswords":
				return this.deletePasswords(request);
			case "deleteAccount":
				return this.deleteAccount(request);
			case "forgotUsername":
				return this.forgotUsername(request);
			case "enable2fa":
				return this.enableTwoFactor(request);
			case "disable2fa":
				return this.disableTwoFactor(request);
			case "addYubiKey":
				return this.addYubiKey(request);
			case "removeYubiKey":
				return this.removeYubiKey(request);
			case "upgradeAccount":
				return this.upgradeAccount(request);
			case "getReport":
				return this.getReport();
		}
	}

	private serverCounts(): Promise<ServerCounts> {
		if (this.cachedCounts && this.cachedCounts.expiresAt > Date.now()) return this.cachedCounts.value;

		const value = Promise.all([this.database.userCount(), this.database.passwordCount()]).then(([users, passwords]) => ({ users, passwords }));

		this.cachedCounts = {
			expiresAt: Date.now() + countCacheMilliseconds(),
			value,
		};
		value.catch(() => {
			this.cachedCounts = null;
		});

		return value;
	}

	private async getInfo(): Promise<LegacyResponse> {
		const { users, passwords } = await this.serverCounts();

		return legacyResponse(0, {
			version: config.version,
			users,
			maxUsers: config.account.maxAccounts,
			passwords,
			maxPasswords: config.account.maxPasswords,
			location: config.location,
			hashingCost: config.argon2.timeCost,
			hashingAlgorithm: "argon2id",
			hashingMemoryCost: config.argon2.memoryCost,
		});
	}

	private async getStats(): Promise<LegacyResponse> {
		const filesystem = await statfs(process.cwd());
		const diskTotal = Number(filesystem.blocks) * Number(filesystem.bsize);
		const diskFree = Number(filesystem.bavail) * Number(filesystem.bsize);
		const memoryTotal = totalmem();

		return legacyResponse(0, {
			cpu: loadavg()[0] ?? 0,
			cores: config.cores,
			memoryUsed: Math.round((memoryTotal - freemem()) / 1_024),
			memoryTotal: Math.round(memoryTotal / 1_024),
			diskUsed: diskTotal - diskFree,
			diskTotal,
		});
	}

	private async createAccount(request: LegacyRequest): Promise<LegacyResponse> {
		const usernameInput = request.username ?? "";
		const password = request.password ?? "";
		const emailInput = request.fields.get("email") ?? "";

		if (config.account.maxAccounts > 0 && (await this.database.userCount()) >= config.account.maxAccounts) {
			return legacyResponse(15);
		}
		if (!isUsernameValid(usernameInput)) return legacyResponse(12);
		if (!isEmailValid(emailInput)) return legacyResponse(6);
		if (!isClientHashValid(password)) return legacyResponse(5);

		const username = usernameInput.toLowerCase();
		const email = emailInput.toLowerCase();

		if (await this.database.usernameTaken(username)) return legacyResponse(4);

		await this.database.createUser(username, email, await hashClientPassword(password), config.account.maxPasswords);

		return legacyResponse(0);
	}

	private async getToken(request: LegacyRequest): Promise<LegacyResponse> {
		const usernameInput = request.username ?? "";
		const password = request.password ?? "";

		if (!isUsernameValid(usernameInput)) return legacyResponse(12);
		if (!isClientHashValid(password)) return legacyResponse(5);

		const username = usernameInput.toLowerCase();
		const user = await this.database.findUser(username);

		if (!user) return legacyResponse(1);
		if (!(await verifyClientPassword(password, user.password))) return legacyResponse(2);
		if (!(await verifySecondFactor(request.fields.get("otp"), user["2fa_secret"], user.yubico_otp))) {
			return legacyResponse(19);
		}

		if (passwordNeedsRehash(user.password)) {
			await this.database.updateUserPassword(username, await hashClientPassword(password));
		}

		const token = await this.tokens.issue(username, request.clientIp);
		const currentDate = today();
		if (user.accessed !== currentDate) await this.database.updateLastAccess(username, currentDate);

		const passwords = normalizePasswords(await this.database.getPasswords(username));
		const data: Record<string, unknown> = {
			token,
			auth: user["2fa_secret"] !== null,
			yubico: user.yubico_otp,
			max_passwords: Number(user.max_passwords),
			premium_expires: user.premium_expires,
		};

		if (passwords.length === 0) return legacyResponse(8, data);

		data.passwords = passwords;
		return legacyResponse(0, data);
	}

	private async getPasswords(request: LegacyRequest): Promise<LegacyResponse> {
		const auth = await this.authorize(request);
		if (typeof auth !== "string") return auth;

		const passwords = normalizePasswords(await this.database.getPasswords(auth));

		return passwords.length === 0 ? legacyResponse(8) : legacyResponse(0, { passwords });
	}

	private async savePassword(request: LegacyRequest): Promise<LegacyResponse> {
		const auth = await this.authorize(request);
		if (typeof auth !== "string") return auth;

		const input = this.passwordInput(request.fields);
		const inputError = this.validatePasswordInput(input);
		if (inputError) return inputError;

		const user = await this.database.findUser(auth);
		if (!user) return legacyResponse(1);

		if (Number(user.max_passwords) >= 0) {
			const count = await this.database.userPasswordCount(auth);
			if (count >= Number(user.max_passwords)) return legacyResponse(16);
		}

		await this.database.savePassword(auth, input);

		return legacyResponse(0);
	}

	private async importPasswords(request: LegacyRequest): Promise<LegacyResponse> {
		const auth = await this.authorize(request);
		if (typeof auth !== "string") return auth;

		let parsed: unknown;
		try {
			parsed = JSON.parse(request.rawBody);
		} catch {
			return legacyResponse(14);
		}

		if (!Array.isArray(parsed)) return legacyResponse(14);

		const user = await this.database.findUser(auth);
		if (!user) return legacyResponse(1);

		if (Number(user.max_passwords) >= 0) {
			const count = await this.database.userPasswordCount(auth);
			if (count + parsed.length > Number(user.max_passwords)) return legacyResponse(16);
		}

		const valid: EncryptedPasswordInput[] = [];

		for (const item of parsed) {
			if (!item || typeof item !== "object") continue;

			const candidate = item as Record<string, unknown>;
			const input = {
				website: typeof candidate.website === "string" ? candidate.website : "",
				username: typeof candidate.username === "string" ? candidate.username : "",
				password: typeof candidate.password === "string" ? candidate.password : "",
				message: typeof candidate.message === "string" ? candidate.message : "",
			};

			if (!this.validatePasswordInput(input)) valid.push(input);
		}

		if (valid.length > 0) await this.database.importPasswords(auth, valid);

		return legacyResponse(0, {
			import_success: valid.length,
			import_error: parsed.length - valid.length,
		});
	}

	private async editPassword(request: LegacyRequest): Promise<LegacyResponse> {
		const auth = await this.authorize(request);
		if (typeof auth !== "string") return auth;

		const input = this.passwordInput(request.fields);
		const inputError = this.validatePasswordInput(input);
		if (inputError) return inputError;

		const passwordId = parsePasswordId(request.fields.get("password_id"));
		if (passwordId === null || !(await this.database.passwordOwnedBy(auth, passwordId))) return legacyResponse(10);

		await this.database.editPassword(auth, passwordId, input);

		return legacyResponse(0);
	}

	private async deletePassword(request: LegacyRequest): Promise<LegacyResponse> {
		const auth = await this.authorize(request);
		if (typeof auth !== "string") return auth;

		const passwordId = parsePasswordId(request.fields.get("password_id"));
		if (passwordId === null || !(await this.database.passwordOwnedBy(auth, passwordId))) return legacyResponse(10);

		await this.database.deletePassword(auth, passwordId);

		return legacyResponse(0);
	}

	private async deletePasswords(request: LegacyRequest): Promise<LegacyResponse> {
		const auth = await this.authorize(request);
		if (typeof auth !== "string") return auth;

		await this.database.deletePasswords(auth);

		return legacyResponse(0);
	}

	private async deleteAccount(request: LegacyRequest): Promise<LegacyResponse> {
		const auth = await this.authorize(request);
		if (typeof auth !== "string") return auth;

		await this.database.deleteAccount(auth);
		await this.tokens.revoke(auth);

		return legacyResponse(0);
	}

	private async enableTwoFactor(request: LegacyRequest): Promise<LegacyResponse> {
		const auth = await this.authorize(request);
		if (typeof auth !== "string") return auth;

		const user = await this.database.findUser(auth);
		if (!user) return legacyResponse(1);
		if (user["2fa_secret"] !== null) return legacyResponse(26);

		const setup = createTwoFactorSecret(auth);
		await this.database.enableTwoFactor(auth, setup.secret, setup.codes);

		return legacyResponse(0, setup);
	}

	private async disableTwoFactor(request: LegacyRequest): Promise<LegacyResponse> {
		const auth = await this.authorize(request);
		if (typeof auth !== "string") return auth;

		const user = await this.database.findUser(auth);
		if (!user) return legacyResponse(1);
		if (user["2fa_secret"] === null) return legacyResponse(27);

		await this.database.disableTwoFactor(auth);

		return legacyResponse(0);
	}

	private async addYubiKey(request: LegacyRequest): Promise<LegacyResponse> {
		const auth = await this.authorize(request);
		if (typeof auth !== "string") return auth;

		const otp = request.fields.get("id") ?? "";
		if (!(await verifyYubiOtp(otp))) return legacyResponse(23);

		const user = await this.database.findUser(auth);
		if (!user) return legacyResponse(1);

		const id = otp.slice(0, 12);
		const ids = user.yubico_otp?.split(";").filter(Boolean) ?? [];

		if (ids.length >= 5) return legacyResponse(20);
		if (ids.includes(id)) return legacyResponse(21);

		ids.push(id);
		const yubico = ids.join(";");
		const codes = generateBackupCodes();
		await this.database.updateYubiKeys(auth, yubico, codes);

		return legacyResponse(0, { yubico, codes });
	}

	private async removeYubiKey(request: LegacyRequest): Promise<LegacyResponse> {
		const auth = await this.authorize(request);
		if (typeof auth !== "string") return auth;

		const otp = request.fields.get("id") ?? "";
		if (!(await verifyYubiOtp(otp))) return legacyResponse(23);

		const user = await this.database.findUser(auth);
		if (!user) return legacyResponse(1);

		const id = otp.slice(0, 12);
		const ids = user.yubico_otp?.split(";").filter(Boolean) ?? [];
		if (!ids.includes(id)) return legacyResponse(24);

		const yubico = ids.filter((value) => value !== id).join(";");
		await this.database.updateYubiKeys(auth, yubico);

		return legacyResponse(0, { yubico });
	}

	private async forgotUsername(request: LegacyRequest): Promise<LegacyResponse> {
		if (!config.mail.enabled) return legacyResponse(28);

		const emailInput = request.fields.get("email") ?? "";
		if (!isEmailValid(emailInput)) return legacyResponse(6);

		const email = emailInput.toLowerCase();
		const usernames = await this.database.usernamesForEmail(email);
		if (usernames.length === 0) return legacyResponse(17);

		const transporter = nodemailer.createTransport({
			host: config.mail.host,
			port: config.mail.port,
			secure: config.mail.useTls,
			auth: {
				user: config.mail.username,
				pass: config.mail.password,
			},
		});

		try {
			await transporter.sendMail({
				from: { name: "Passky", address: config.mail.username },
				replyTo: config.mail.username,
				to: email,
				subject: "Usernames under your email",
				text: `Usernames registered with your email: ${usernames.join(", ")}`,
				html: `<p>Usernames registered with your email:</p><ul>${usernames.map((username) => `<li><strong>${escapeHtml(username)}</strong></li>`).join("")}</ul>`,
			});

			return legacyResponse(0);
		} catch {
			return legacyResponse(506);
		} finally {
			transporter.close();
		}
	}

	private async upgradeAccount(request: LegacyRequest): Promise<LegacyResponse> {
		const auth = await this.authorize(request);
		if (typeof auth !== "string") return auth;

		const licenseKey = request.fields.get("license") ?? "";
		if (licenseKey.length !== 29) return legacyResponse(29);

		const [user, license] = await Promise.all([this.database.findUser(auth), this.database.findLicense(licenseKey)]);

		if (!user) return legacyResponse(1);
		if (!license) return legacyResponse(29);
		if (license.linked !== null) return legacyResponse(30);

		const premiumExpires = await this.database.redeemLicense(auth, licenseKey, config.account.premiumMaxPasswords, today());
		if (premiumExpires === null) return legacyResponse(30);

		return legacyResponse(0, {
			max_passwords: config.account.premiumMaxPasswords,
			premium_expires: premiumExpires,
		});
	}

	private getReport(): LegacyResponse {
		if (!this.reportsEnabled) return legacyResponse(32);

		const report = this.maintenance.getReport();

		return report
			? legacyResponse(0, {
					activeUsers: report.activeUsers,
					results: report.results,
				})
			: legacyResponse(31);
	}

	private async authorize(request: LegacyRequest): Promise<string | LegacyResponse> {
		const usernameInput = request.username ?? "";
		const token = request.password ?? "";

		if (!isUsernameValid(usernameInput)) return legacyResponse(1);

		const username = usernameInput.toLowerCase();

		return (await this.tokens.verify(username, request.clientIp, token)) ? username : legacyResponse(25);
	}

	private passwordInput(fields: URLSearchParams): EncryptedPasswordInput {
		return {
			website: fields.get("website") ?? "",
			username: fields.get("username") ?? "",
			password: fields.get("password") ?? "",
			message: fields.get("message") ?? "",
		};
	}

	private validatePasswordInput(input: EncryptedPasswordInput): LegacyResponse | null {
		if (!isEncryptedFieldValid(input.website, 255)) return legacyResponse(300);
		if (!isEncryptedFieldValid(input.username, 255)) return legacyResponse(301);
		if (!isEncryptedFieldValid(input.password, 255)) return legacyResponse(302);
		if (!isEncryptedFieldValid(input.message, 10_000)) return legacyResponse(303);

		return null;
	}
}

function escapeHtml(value: string): string {
	return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
