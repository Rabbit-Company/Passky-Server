import { Counter, Gauge, Histogram, Registry } from "@rabbit-company/openmetrics-client";

export const metricsRegistry = new Registry({ prefix: "passky" });

export const requestCounter = new Counter({
	name: "http_requests",
	help: "Total HTTP requests handled by Passky",
	labelNames: ["method", "route", "status"],
	registry: metricsRegistry,
});

export const requestDuration = new Histogram({
	name: "http_request_duration_seconds",
	help: "HTTP request duration in seconds",
	labelNames: ["method", "route", "status"],
	buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
	registry: metricsRegistry,
});

export const apiActionCounter = new Counter({
	name: "legacy_api_actions",
	help: "Total legacy API actions",
	labelNames: ["action", "error"],
	registry: metricsRegistry,
});

export const databaseUsers = new Gauge({
	name: "database_users",
	help: "Number of registered users",
	registry: metricsRegistry,
});

export const databasePasswords = new Gauge({
	name: "database_passwords",
	help: "Number of stored encrypted passwords",
	registry: metricsRegistry,
});

const knownMethods = new Set(["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]);

const staticRoutes = new Set([
	"/",
	"/index.php",
	"/health",
	"/metrics",
	"/admin",
	"/admin/login",
	"/admin/logout",
	"/admin/licenses",
	"/admin/assets/admin.css",
	"/admin/assets/admin.js",
	"/admin/assets/logo.svg",
]);

const dynamicRoutes: Array<[RegExp, string]> = [
	[/^\/admin\/accounts\/[^/]+$/, "/admin/accounts/:username"],
	[/^\/admin\/accounts\/[^/]+\/delete$/, "/admin/accounts/:username/delete"],
	[/^\/admin\/licenses\/[^/]+\/delete$/, "/admin/licenses/:license/delete"],
];

export function routeLabel(pathname: string): string {
	if (staticRoutes.has(pathname)) return pathname;

	return dynamicRoutes.find(([pattern]) => pattern.test(pathname))?.[1] ?? "unmatched";
}

export function observeRequest(method: string, pathname: string, status: number, seconds: number): void {
	const labels = {
		method: knownMethods.has(method) ? method : "OTHER",
		route: routeLabel(pathname),
		status: String(status),
	};

	requestCounter.inc(1, labels);
	requestDuration.observe(seconds, labels);
}
