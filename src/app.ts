import { Web, type Context, type Middleware } from "@rabbit-company/web";
import { bodyLimit } from "@rabbit-company/web-middleware/body-limit";
import { burrowgateOrigin } from "@rabbit-company/web-middleware/burrowgate";
import { cors } from "@rabbit-company/web-middleware/cors";
import { ipExtract } from "@rabbit-company/web-middleware/ip-extract";
import { createWebLogger, logger } from "@rabbit-company/web-middleware/logger";

import { Admin } from "./admin/index.ts";
import { config } from "./config.ts";
import type { Database } from "./database.ts";
import { legacyResponse } from "./errors.ts";
import { LegacyApi, type LegacyApiOptions } from "./legacy-api.ts";
import type { Maintenance } from "./maintenance.ts";
import { metricsRegistry, observeRequest } from "./metrics.ts";
import { constantTimeEqual } from "./security.ts";
import { TokenStore } from "./tokens.ts";

interface AppState extends Record<string, unknown> {
	requestId?: string;
}

const apiSecurityHeaders = {
	"Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'; object-src 'none'; base-uri 'none'; form-action 'none'",
	"X-Content-Type-Options": "nosniff",
	"X-Frame-Options": "DENY",
	"Referrer-Policy": "no-referrer",
	"Permissions-Policy": "interest-cohort=()",
} as const;

const unsignedPaths = new Set(["/health", "/metrics"]);

function basicCredentials(request: Request): {
	username: string | null;
	password: string | null;
} {
	const authorization = request.headers.get("authorization");
	if (!authorization?.toLowerCase().startsWith("basic ")) return { username: null, password: null };

	try {
		const decoded = atob(authorization.slice(6));
		const separator = decoded.indexOf(":");

		if (separator < 0) return { username: null, password: null };

		return {
			username: decoded.slice(0, separator),
			password: decoded.slice(separator + 1),
		};
	} catch {
		return { username: null, password: null };
	}
}

function clientIp(ctx: Context<AppState>): string {
	return ctx.clientIp ?? "0.0.0.0";
}

async function requestFields(request: Request, rawBody: string): Promise<URLSearchParams> {
	const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";

	if (contentType.includes("application/x-www-form-urlencoded")) return new URLSearchParams(rawBody);

	if (contentType.includes("multipart/form-data")) {
		const form = await request.clone().formData();
		const fields = new URLSearchParams();

		for (const [name, value] of form) {
			if (typeof value === "string") fields.append(name, value);
		}

		return fields;
	}

	return new URLSearchParams();
}

function createClientIpMiddleware(burrowgateSecret: string): Middleware<AppState> {
	if (burrowgateSecret) {
		return burrowgateOrigin<AppState>({
			secret: burrowgateSecret,
			skip: (ctx) => unsignedPaths.has(new URL(ctx.req.url).pathname),
			onFailure: (ctx) => ctx.json(legacyResponse(999), 403, apiSecurityHeaders),
		});
	}

	if (config.proxy.trustedProxies.length === 0) return ipExtract<AppState>("direct");

	return ipExtract<AppState>({
		trustProxy: true,
		trustedProxies: [...config.proxy.trustedProxies],
		trustedHeaders: ["cf-connecting-ip", "x-real-ip", "x-forwarded-for"],
		maxProxyChain: 5,
		logWarnings: false,
	});
}

function createLoggerMiddleware(): Middleware<AppState> {
	if (!config.logging.lokiUrl) {
		return logger<AppState>({
			preset: config.logging.preset,
			excludePaths: ["/health", "/metrics"],
			logRequestBody: false,
			logResponseBody: false,
		});
	}

	const webLogger = createWebLogger({
		console: true,
		loki: {
			url: config.logging.lokiUrl,
			labels: { application: "passky-server" },
			...(config.logging.lokiUsername && config.logging.lokiPassword
				? {
						basicAuth: {
							username: config.logging.lokiUsername,
							password: config.logging.lokiPassword,
						},
					}
				: {}),
		},
	});

	return logger<AppState>({
		logger: webLogger,
		preset: config.logging.preset,
		excludePaths: ["/health", "/metrics"],
		logRequestBody: false,
		logResponseBody: false,
	});
}

export interface AppOptions {
	burrowgateSecret?: string;
	legacyApi?: LegacyApiOptions;
	logging?: boolean;
}

export function createApp(
	database: Database,
	maintenance: Maintenance,
	options: AppOptions = {},
): {
	app: Web<AppState>;
	legacyApi: LegacyApi;
} {
	const app = new Web<AppState>();
	const tokens = new TokenStore();
	const legacyApi = new LegacyApi(database, maintenance, tokens, options.legacyApi ?? {});
	const admin = new Admin(database, maintenance, tokens);

	app.use(createClientIpMiddleware(options.burrowgateSecret ?? config.burrowgate.originSecret));
	if (options.logging !== false) app.use(createLoggerMiddleware());
	app.use(bodyLimit<AppState>({ maxSize: 12 * 1024 * 1024 }));
	app.use(
		cors<AppState>({
			origin: "*",
			allowMethods: ["GET", "POST", "OPTIONS"],
		}),
	);
	app.use(async (ctx, next) => {
		const started = performance.now();
		const response = await next();
		const status = response?.status ?? ctx.res?.status ?? 200;

		observeRequest(ctx.req.method, new URL(ctx.req.url).pathname, status, (performance.now() - started) / 1_000);

		return response;
	});

	const legacyHandler: Middleware<AppState> = async (ctx) => {
		const url = new URL(ctx.req.url);
		const action = url.searchParams.get("action");

		if (!action) return admin.page(ctx);

		const rawBody = ctx.req.method === "GET" || ctx.req.method === "HEAD" ? "" : await ctx.req.clone().text();
		const fields = await requestFields(ctx.req, rawBody);
		const credentials = basicCredentials(ctx.req);
		const response = await legacyApi.handle({
			action,
			...credentials,
			fields,
			rawBody,
			clientIp: clientIp(ctx),
		});

		return ctx.json(response, 200, apiSecurityHeaders);
	};

	app.get("/", legacyHandler);
	app.post("/", legacyHandler);
	app.options("/", () => new Response(null, { status: 204, headers: apiSecurityHeaders }));
	app.get("/index.php", legacyHandler);
	app.post("/index.php", legacyHandler);
	app.options("/index.php", () => new Response(null, { status: 204, headers: apiSecurityHeaders }));

	admin.install(app);

	app.get("/health", (ctx) => ctx.json({ status: "success" }, 200, apiSecurityHeaders));
	app.get("/metrics", (ctx) => {
		if (!config.metrics.enabled) return ctx.text("Not Found", 404, apiSecurityHeaders);

		if (config.metrics.token) {
			const supplied = ctx.req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
			if (!constantTimeEqual(supplied, config.metrics.token)) {
				return ctx.text("Unauthorized", 401, {
					...apiSecurityHeaders,
					"WWW-Authenticate": "Bearer",
				});
			}
		}

		return ctx.text(metricsRegistry.metricsText(), 200, {
			...apiSecurityHeaders,
			"Content-Type": metricsRegistry.contentType,
		});
	});

	app.onNotFound((ctx) => ctx.json(legacyResponse(404), 404, apiSecurityHeaders));
	app.onError((_error, ctx) => ctx.json(legacyResponse(505), 500, apiSecurityHeaders));

	return { app, legacyApi };
}
