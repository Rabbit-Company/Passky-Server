import PasswordGenerator from "@rabbit-company/password-generator";

export namespace Settings {
	// SERVER SETTINGS
	export const SERVER_VERSION = "10.0.0";
	export const SERVER_LOCATION = process.env["SERVER_LOCATION"] || "US";
	export const SERVER_CORES = Number(process.env["SERVER_CORES"]) || 1;

	// ADMIN SETTINGS
	export const ADMIN_USERNAME = process.env["ADMIN_USERNAME"] || "admin";
	export const ADMIN_PASSWORD = process.env["ADMIN_PASSWORD"] || PasswordGenerator.generate(50);

	export const CF_TURNSTILE_SITE_KEY = process.env["CF_TURNSTILE_SITE_KEY"] || "1x00000000000000000000AA";
	export const CF_TURNSTILE_SECRET_KEY = process.env["CF_TURNSTILE_SECRET_KEY"] || "1x0000000000000000000000000000000AA";

	// REDIS SETTINGS

	export const getLocalRedisConfig = (): string => {
		const url = process.env["REDIS_LOCAL"];
		if (url) return url;

		const host = process.env["REDIS_LOCAL_HOST"] || "127.0.0.1";
		const port = Number(process.env["REDIS_LOCAL_PORT"]) || 6379;
		const username = process.env["REDIS_LOCAL_USERNAME"] || "";
		const password = process.env["REDIS_LOCAL_PASSWORD"] || "";

		if (username && password) return `redis://${username}:${password}@${host}:${port}`;
		if (password) return `redis://:${password}@${host}:${port}`;

		return `redis://${host}:${port}`;
	};

	export const getExternalRedisConfig = (): string => {
		const url = process.env["REDIS_EXTERNAL"];
		if (url) return url;

		const host = process.env["REDIS_HOST"] || "127.0.0.1";
		const port = Number(process.env["REDIS_PORT"]) || 6379;
		const username = process.env["REDIS_USERNAME"] || "";
		const password = process.env["REDIS_PASSWORD"] || "";

		if (username && password) return `redis://${username}:${password}@${host}:${port}`;
		if (password) return `redis://:${password}@${host}:${port}`;

		return `redis://${host}:${port}`;
	};

	// DATABASE SETTINGS
	export const getDatabaseConfig = (): string => {
		const url = process.env["DATABASE_URL"];
		if (url) return url;

		const engine = process.env["DATABASE_ENGINE"];
		if (engine === "sqlite") {
			return `sqlite://${process.env["DATABASE_FILE"] || "passky"}.db`;
		} else if (engine === "mysql") {
			const host = process.env["MYSQL_HOST"] || "passky-database";
			const port = Number(process.env["MYSQL_PORT"]) || 3306;
			const database = process.env["MYSQL_DATABASE"] || "passky";
			const username = process.env["MYSQL_USER"] || "passky";
			const password = process.env["MYSQL_PASSWORD"] || "";
			const ssl = process.env["MYSQL_SSL"] === "true";

			return `mysql://${username}:${password}@${host}:${port}/${database}?ssl=${ssl}`;
		}

		return "sqlite://passky.db";
	};
}
