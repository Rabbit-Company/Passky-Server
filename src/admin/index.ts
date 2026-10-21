import { statfs } from "node:fs/promises";
import { freemem, loadavg, totalmem } from "node:os";

import Blake2b from "@rabbit-company/blake2b";
import PasswordGenerator from "@rabbit-company/password-generator";
import type { Context, Web } from "@rabbit-company/web";
import { Algorithm, RateLimiter } from "@rabbit-company/web-middleware/rate-limit";

import { config } from "../config.ts";
import type { Database } from "../database.ts";
import type { Maintenance } from "../maintenance.ts";
import { constantTimeEqual, generateToken, isEmailValid } from "../security.ts";
import type { TokenStore } from "../tokens.ts";
import { healthChecks } from "./health.ts";
import { cookies, form, pagination, parsePageSize, parsePositiveInteger, parseSection, queryUrl, redirect, safeReturnLocation } from "./helpers.ts";
import { adminScript } from "./script.ts";
import { adminStyles } from "./styles.ts";
import type { AdminPageData, AdminSession, SystemSummary } from "./types.ts";
import { adminHeaders, renderAdmin, renderLogin } from "./view.ts";

interface AdminState extends Record<string, unknown> {
	requestId?: string;
}

const SESSION_COOKIE = "passky_admin";
const logoFile = Bun.file(new URL("./assets/logo.svg", import.meta.url));

async function systemSummary(): Promise<SystemSummary> {
	const filesystem = await statfs(process.cwd());

	return {
		cpuLoad: loadavg()[0] ?? 0,
		cores: config.cores,
		diskFree: Number(filesystem.bavail) * Number(filesystem.bsize),
		diskTotal: Number(filesystem.blocks) * Number(filesystem.bsize),
		memoryFree: freemem(),
		memoryTotal: totalmem(),
	};
}

function isSecureRequest(request: Request): boolean {
	const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();

	return new URL(request.url).protocol === "https:" || forwardedProtocol === "https";
}

export class Admin {
	private readonly sessions = new Map<string, AdminSession>();
	private readonly loginLimiter = new RateLimiter({
		algorithm: Algorithm.SLIDING_WINDOW,
		max: 5,
		window: 15 * 60 * 1_000,
	});

	constructor(
		private readonly database: Database,
		private readonly maintenance: Maintenance,
		private readonly tokens: TokenStore,
	) {}

	install(app: Web<AdminState>): void {
		app.get("/admin", () => redirect());
		app.get("/admin/assets/admin.css", (ctx) =>
			ctx.text(adminStyles, 200, {
				"Cache-Control": "public, max-age=3600",
				"Content-Type": "text/css; charset=utf-8",
				"X-Content-Type-Options": "nosniff",
			}),
		);
		app.get("/admin/assets/admin.js", (ctx) =>
			ctx.text(adminScript, 200, {
				"Cache-Control": "public, max-age=3600",
				"Content-Type": "text/javascript; charset=utf-8",
				"X-Content-Type-Options": "nosniff",
			}),
		);
		app.get(
			"/admin/assets/logo.svg",
			() =>
				new Response(logoFile, {
					headers: {
						"Cache-Control": "public, max-age=86400",
						"Content-Type": "image/svg+xml; charset=utf-8",
						"X-Content-Type-Options": "nosniff",
					},
				}),
		);
		app.post("/admin/login", (ctx) => this.login(ctx));
		app.post("/admin/logout", (ctx) => this.logout(ctx));
		app.post("/admin/accounts/:username", (ctx) => this.editAccount(ctx));
		app.post("/admin/accounts/:username/delete", (ctx) => this.deleteAccount(ctx));
		app.post("/admin/licenses", (ctx) => this.createLicenses(ctx));
		app.post("/admin/licenses/:license/delete", (ctx) => this.deleteLicense(ctx));
	}

	async page(ctx: Context<AdminState>): Promise<Response> {
		const url = new URL(ctx.req.url);
		const session = this.getSession(ctx.req);
		if (!session) return ctx.html(renderLogin(url.origin), 200, adminHeaders);

		const section = parseSection(url.searchParams.get("section"));
		const search = url.searchParams.get("search")?.trim().slice(0, 200) ?? "";
		const perPage = parsePageSize(url.searchParams.get("perPage"));
		const requestedPage = parsePositiveInteger(url.searchParams.get("page"), 1);
		const [accountStatsResult, licenseStatsResult, systemResult] = await Promise.allSettled([
			this.database.adminAccountStats(),
			this.database.adminLicenseStats(),
			systemSummary(),
		]);
		const accountStats = accountStatsResult.status === "fulfilled" ? accountStatsResult.value : { accounts: 0, passwords: 0, premiumAccounts: 0 };
		const licenseStats = licenseStatsResult.status === "fulfilled" ? licenseStatsResult.value : { licenses: 0, unusedLicenses: 0 };
		const system =
			systemResult.status === "fulfilled"
				? systemResult.value
				: {
						cpuLoad: 0,
						cores: config.cores,
						diskFree: 0,
						diskTotal: 0,
						memoryFree: 0,
						memoryTotal: 0,
					};
		const databaseAvailable = accountStatsResult.status === "fulfilled" && licenseStatsResult.status === "fulfilled";

		let accounts: AdminPageData["accounts"] = [];
		let licenses: AdminPageData["licenses"] = [];
		let total = 0;

		if (section === "accounts") total = await this.database.adminAccountCount(search);
		if (section === "licenses") total = await this.database.adminLicenseCount(search);

		const paging = pagination(requestedPage, perPage, total);
		const offset = (paging.page - 1) * paging.perPage;

		if (section === "accounts") accounts = await this.database.adminAccounts(search, paging.perPage, offset);
		if (section === "licenses") licenses = await this.database.adminLicenses(search, paging.perPage, offset);

		const data: AdminPageData = {
			accountStats,
			accounts,
			csrf: session.csrf,
			healthChecks: healthChecks({
				accountStats,
				databaseAvailable,
				maintenance: this.maintenance,
				system,
				systemAvailable: systemResult.status === "fulfilled",
			}),
			licenses,
			licenseStats,
			pagination: paging,
			report: this.maintenance.getReport(),
			search,
			section,
			serverOrigin: url.origin,
			system,
			...(session.licenseBatch && section === "licenses" ? { licenseBatch: session.licenseBatch } : {}),
			...(session.notice ? { notice: session.notice } : {}),
		};

		if (section === "licenses") delete session.licenseBatch;
		delete session.notice;

		return ctx.html(renderAdmin(data), 200, adminHeaders);
	}

	private async login(ctx: Context<AdminState>): Promise<Response> {
		if (!config.admin.password) return redirect();
		if (this.loginLimiter.check("admin-login", ctx.clientIp ?? "unknown").limited) return redirect();

		const fields = await form(ctx.req);
		const username = fields.get("username") ?? "";
		const password = fields.get("password") ?? "";
		const turnstile = fields.get("cf-turnstile-response") ?? "";

		if (!(await this.verifyTurnstile(turnstile, ctx.clientIp))) return redirect();
		if (!constantTimeEqual(username, config.admin.username) || !constantTimeEqual(password, config.admin.password)) {
			return redirect();
		}

		const id = generateToken();
		this.sessions.set(id, {
			csrf: generateToken(),
			expiresAt: Date.now() + config.admin.sessionTtlSeconds * 1_000,
		});

		const secure = isSecureRequest(ctx.req) ? "; Secure" : "";

		return new Response(null, {
			status: 303,
			headers: {
				Location: "/?section=overview",
				"Set-Cookie": `${SESSION_COOKIE}=${id}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${config.admin.sessionTtlSeconds}${secure}`,
			},
		});
	}

	private async logout(ctx: Context<AdminState>): Promise<Response> {
		const fields = await form(ctx.req);
		const id = cookies(ctx.req).get(SESSION_COOKIE);
		const session = this.getSession(ctx.req);
		if (id && session && constantTimeEqual(fields.get("csrf") ?? "", session.csrf)) this.sessions.delete(id);

		return new Response(null, {
			status: 303,
			headers: {
				Location: "/",
				"Set-Cookie": `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`,
			},
		});
	}

	private async editAccount(ctx: Context<AdminState>): Promise<Response> {
		const authorized = await this.authorizedForm(ctx.req);
		if (!authorized) return redirect();

		const { fields, session } = authorized;
		const requestedMaximum = Number.parseInt(fields.get("max_passwords") ?? "", 10);
		const maxPasswords = Number.isFinite(requestedMaximum) ? Math.max(-1, Math.min(1_000_000_000, requestedMaximum)) : config.account.maxPasswords;
		const emailInput = fields.get("email")?.trim() ?? "";
		const email = isEmailValid(emailInput) ? emailInput.toLowerCase() : null;

		await this.database.adminUpdateAccount(
			ctx.params.username ?? "",
			email,
			maxPasswords,
			fields.get("disable2fa") === "true",
			fields.get("disablePremium") === "true",
		);

		session.notice =
			email === null
				? {
						message: "Account limits were updated, but the invalid email address was ignored.",
						tone: "warning",
					}
				: {
						message: `Account ${ctx.params.username ?? ""} was updated.`,
						tone: "success",
					};

		return redirect(safeReturnLocation(fields.get("return_to"), queryUrl("accounts")));
	}

	private async deleteAccount(ctx: Context<AdminState>): Promise<Response> {
		const authorized = await this.authorizedForm(ctx.req);
		if (!authorized) return redirect();

		const username = ctx.params.username ?? "";
		await this.database.deleteAccount(username);
		await this.tokens.revoke(username);
		authorized.session.notice = {
			message: `Account ${username} was deleted.`,
			tone: "success",
		};

		return redirect(safeReturnLocation(authorized.fields.get("return_to"), queryUrl("accounts")));
	}

	private async createLicenses(ctx: Context<AdminState>): Promise<Response> {
		const authorized = await this.authorizedForm(ctx.req);
		if (!authorized) return redirect();

		const duration = Math.max(1, Math.min(365_000, Number.parseInt(authorized.fields.get("days") ?? "365", 10) || 365));
		const amount = Math.max(1, Math.min(1_000, Number.parseInt(authorized.fields.get("amount") ?? "1", 10) || 1));
		const licenses = Array.from({ length: amount }, () => {
			const compact = Blake2b.hash(PasswordGenerator.generate(64), undefined, 32).slice(0, 25).toUpperCase();

			return compact.match(/.{1,5}/g)?.join("-") ?? compact;
		});

		await this.database.createLicenses(licenses, duration);
		authorized.session.licenseBatch = { duration, licenses };
		authorized.session.notice = {
			message: `${licenses.length} licenses were created.`,
			tone: "success",
		};

		return redirect(queryUrl("licenses"));
	}

	private async deleteLicense(ctx: Context<AdminState>): Promise<Response> {
		const authorized = await this.authorizedForm(ctx.req);
		if (!authorized) return redirect();

		await this.database.deleteLicense(ctx.params.license ?? "");
		authorized.session.notice = {
			message: "License was deleted.",
			tone: "success",
		};

		return redirect(safeReturnLocation(authorized.fields.get("return_to"), queryUrl("licenses")));
	}

	private getSession(request: Request): AdminSession | null {
		const id = cookies(request).get(SESSION_COOKIE);
		if (!id) return null;

		const session = this.sessions.get(id);
		if (!session || session.expiresAt <= Date.now()) {
			this.sessions.delete(id);
			return null;
		}

		session.expiresAt = Date.now() + config.admin.sessionTtlSeconds * 1_000;
		return session;
	}

	private async authorizedForm(request: Request): Promise<{
		fields: URLSearchParams;
		session: AdminSession;
	} | null> {
		const session = this.getSession(request);
		if (!session) return null;

		const fields = await form(request);
		if (!constantTimeEqual(fields.get("csrf") ?? "", session.csrf)) return null;

		return { fields, session };
	}

	private async verifyTurnstile(response: string, remoteIp?: string): Promise<boolean> {
		if (config.turnstile.siteKey === "1x00000000000000000000AA") return response.length > 0;

		try {
			const body = new URLSearchParams({
				secret: config.turnstile.secretKey,
				response,
			});
			if (remoteIp) body.set("remoteip", remoteIp);

			const result = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
				method: "POST",
				body,
				signal: AbortSignal.timeout(10_000),
			});
			const payload = (await result.json()) as {
				success?: boolean;
				action?: string;
			};

			return payload.success === true && payload.action === "login";
		} catch {
			return false;
		}
	}
}
