import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import { config, isSqlite, LEGACY_DATABASE_DIRECTORY } from "./config.ts";
import { createApp } from "./app.ts";
import { Database } from "./database.ts";
import { Maintenance } from "./maintenance.ts";
import { configuredAdminPasswordEntropy } from "./security.ts";

if (isSqlite() && !config.database.url.includes(":memory:")) {
	const file = config.database.url.replace(/^(sqlite|file):(\/\/)?/i, "");
	mkdirSync(dirname(file), { recursive: true });
}

if (isSqlite() && config.database.url.includes(LEGACY_DATABASE_DIRECTORY)) {
	console.warn(
		`Using the SQLite database from ${LEGACY_DATABASE_DIRECTORY}. Update the docker-compose.yml volume to ./databases:/app/databases when convenient.`,
	);
}

const database = new Database();
await database.initialize();

const maintenance = new Maintenance(database);
await maintenance.start();

const { app, legacyApi } = createApp(database, maintenance);
const adminEntropy = configuredAdminPasswordEntropy();

if (adminEntropy !== null && adminEntropy < 60) {
	console.warn("ADMIN_PASSWORD has low estimated entropy. Please use a longer randomly generated value.");
}

const server = await app.listen({
	hostname: config.host,
	port: config.port,
	bun: { maxRequestBodySize: 16 * 1024 * 1024 },
});

console.log(`Passky Server ${config.version} listening on ${config.host}:${config.port}`);

async function shutdown(signal: string): Promise<void> {
	console.log(`Received ${signal}; shutting down Passky Server.`);
	maintenance.stop();
	legacyApi.close();
	await server.stop();
	await database.close();
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));
