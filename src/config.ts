import { existsSync } from "node:fs";
import { isAbsolute, join } from "node:path";

const TRUE_VALUES = new Set(["1", "true"]);

export const LEGACY_DATABASE_DIRECTORY = "/var/www/html/databases";

const PRIVATE_NETWORKS = ["127.0.0.0/8", "10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16", "::1/128", "fc00::/7"];

function env(name: string, fallback = ""): string {
	const value = Bun.env[name];

	return value === undefined || value === "" ? fallback : value;
}

function integer(name: string, fallback: number, minimum?: number): number {
	const parsed = Number.parseInt(env(name), 10);
	const value = Number.isFinite(parsed) ? parsed : fallback;

	return minimum === undefined ? value : Math.max(minimum, value);
}

function boolean(name: string, fallback: boolean): boolean {
	const value = Bun.env[name];

	return value === undefined || value === "" ? fallback : TRUE_VALUES.has(value.toLowerCase());
}

export function parseTrustedProxies(value: string): string[] {
	if (value.trim().toLowerCase() === "none") return [];

	const proxies = value
		.split(",")
		.map((proxy) => proxy.trim())
		.filter(Boolean);

	return proxies.length > 0 ? proxies : [...PRIVATE_NETWORKS];
}

export function resolveSqliteFile(configured: string, directory: string, legacyDirectory = LEGACY_DATABASE_DIRECTORY): string {
	const file = configured.endsWith(".db") ? configured : `${configured}.db`;

	if (isAbsolute(file)) return file;
	if (existsSync(join(directory, file))) return join(directory, file);
	if (existsSync(legacyDirectory)) return join(legacyDirectory, file);

	return join(directory, file);
}

function sqliteFile(): string {
	return resolveSqliteFile(env("DATABASE_FILE", "passky"), join(process.cwd(), "databases"));
}

function legacyDatabaseUrl(): string {
	const engine = env("DATABASE_ENGINE", "sqlite").toLowerCase();

	if (engine === "mysql" || engine === "mariadb") {
		const username = encodeURIComponent(env("MYSQL_USER", "passky"));
		const password = encodeURIComponent(env("MYSQL_PASSWORD", "uDWjSd8wB2HRBHei489o"));
		const host = env("MYSQL_HOST", "passky-database");
		const port = integer("MYSQL_PORT", 3306, 1);
		const database = encodeURIComponent(env("MYSQL_DATABASE", "passky"));

		return `mysql://${username}:${password}@${host}:${port}/${database}`;
	}

	return `sqlite://${sqliteFile()}`;
}

const limiterDefaults = {
	getInfo: -1,
	getStats: -1,
	getToken: 3,
	getPasswords: 2,
	savePassword: 2,
	editPassword: 2,
	deletePassword: 2,
	deletePasswords: 10,
	createAccount: 10,
	deleteAccount: 10,
	importPasswords: 10,
	forgotUsername: 60,
	enable2fa: 10,
	disable2fa: 10,
	addYubiKey: 10,
	removeYubiKey: 10,
	upgradeAccount: 10,
	getReport: -1,
} as const;

const limiterEnvironmentNames: Record<keyof typeof limiterDefaults, string> = {
	getInfo: "LIMITER_GET_INFO",
	getStats: "LIMITER_GET_STATS",
	getToken: "LIMITER_GET_TOKEN",
	getPasswords: "LIMITER_GET_PASSWORDS",
	savePassword: "LIMITER_SAVE_PASSWORD",
	editPassword: "LIMITER_EDIT_PASSWORD",
	deletePassword: "LIMITER_DELETE_PASSWORD",
	deletePasswords: "LIMITER_DELETE_PASSWORDS",
	createAccount: "LIMITER_CREATE_ACCOUNT",
	deleteAccount: "LIMITER_DELETE_ACCOUNT",
	importPasswords: "LIMITER_IMPORT_PASSWORDS",
	forgotUsername: "LIMITER_FORGOT_USERNAME",
	enable2fa: "LIMITER_ENABLE_2FA",
	disable2fa: "LIMITER_DISABLE_2FA",
	addYubiKey: "LIMITER_ADD_YUBIKEY",
	removeYubiKey: "LIMITER_REMOVE_YUBIKEY",
	upgradeAccount: "LIMITER_UPGRADE_ACCOUNT",
	getReport: "LIMITER_GET_REPORT",
};

export type LegacyAction = keyof typeof limiterDefaults;

export const config = {
	version: "9.0.0",
	host: env("SERVER_HOST", "0.0.0.0"),
	port: integer("SERVER_PORT", 80, 1),
	location: env("SERVER_LOCATION", "US"),
	cores: integer("SERVER_CORES", navigator.hardwareConcurrency || 1, 1),

	proxy: {
		trustedProxies: parseTrustedProxies(env("TRUSTED_PROXIES")),
	},

	burrowgate: {
		originSecret: env("BURROWGATE_ORIGIN_SECRET"),
		reportUsernames: boolean("BURROWGATE_REPORT_USERNAMES", false),
	},

	admin: {
		username: env("ADMIN_USERNAME", "admin"),
		password: env("ADMIN_PASSWORD"),
		sessionTtlSeconds: integer("ADMIN_SESSION_TTL", 3_600, 60),
	},

	turnstile: {
		siteKey: env("CF_TURNSTILE_SITE_KEY", "1x00000000000000000000AA"),
		secretKey: env("CF_TURNSTILE_SECRET_KEY", "1x0000000000000000000000000000000AA"),
	},

	database: {
		url: env("DATABASE_URL", legacyDatabaseUrl()),
		legacyEngine: env("DATABASE_ENGINE", "sqlite").toLowerCase(),
		sqliteFile: sqliteFile(),
		mysqlSsl: boolean("MYSQL_SSL", false),
		mysqlSslCa: env("MYSQL_SSL_CA", "/etc/ssl/certs/ca-certificates.crt"),
		cacheMode: integer("MYSQL_CACHE_MODE", 0, 0),
	},

	redis: {
		url: env("REDIS_URL"),
		host: env("REDIS_HOST", "127.0.0.1"),
		port: integer("REDIS_PORT", 6379, 1),
		password: env("REDIS_PASSWORD"),
	},

	mail: {
		enabled: boolean("MAIL_ENABLED", false),
		host: env("MAIL_HOST", "mail.passky.org"),
		port: integer("MAIL_PORT", 465, 1),
		username: env("MAIL_USERNAME", "info@passky.org"),
		password: env("MAIL_PASSWORD", "secret"),
		useTls: boolean("MAIL_USE_TLS", false),
	},

	account: {
		maxAccounts: integer("ACCOUNT_MAX", 100),
		maxPasswords: integer("ACCOUNT_MAX_PASSWORDS", 1_000),
		premiumMaxPasswords: integer("ACCOUNT_PREMIUM", -1),
	},

	yubico: {
		cloudUrl: env("YUBI_CLOUD", "https://api.yubico.com/wsapi/2.0/verify"),
		clientId: integer("YUBI_ID", 67_857, 1),
	},

	argon2: {
		memoryCost: integer("ARGON2_MEMORY_COST", 65_536, 8),
		timeCost: integer("ARGON2_TIME_COST", 3, 1),
	},

	limiter: {
		enabled: boolean("LIMITER_ENABLED", true),
		windows: Object.fromEntries(
			Object.entries(limiterDefaults).map(([action, fallback]) => [action, integer(limiterEnvironmentNames[action as LegacyAction], fallback)]),
		) as Record<LegacyAction, number>,
	},

	metrics: {
		enabled: boolean("METRICS_ENABLED", false),
		token: env("METRICS_TOKEN"),
	},

	reports: {
		enabled: boolean("REPORTS_ENABLED", false),
	},

	stats: {
		enabled: boolean("STATS_ENABLED", false),
	},

	logging: {
		preset: env("LOG_PRESET", "standard") as "minimal" | "standard" | "detailed" | "debug",
		lokiUrl: env("LOKI_URL"),
		lokiUsername: env("LOKI_USERNAME"),
		lokiPassword: env("LOKI_PASSWORD"),
	},
} as const;

export function isSqlite(): boolean {
	return config.database.url === ":memory:" || /^(sqlite|file):/i.test(config.database.url);
}

export function isMysql(): boolean {
	return /^mysql2?:/i.test(config.database.url);
}
