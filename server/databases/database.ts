import { SQL } from "bun";
import { Logger } from "../logger";
import { Settings } from "../settings";
import SQLite from "./sqlite";

namespace DB {
	export const engine = Settings.getDatabaseConfig().split(":")[0];
	export const connection = new SQL(Settings.getDatabaseConfig());

	export async function initialize() {
		Logger.info(`[DB] Initializing ${engine} database...`);

		try {
			switch (engine) {
				case "postgres":
				case "postgresql":
					//await Postgres.initialize();
					break;
				case "mysql":
				case "mysql2":
					//await MySQL.initialize();
					break;
				case "sqlite":
					await SQLite.initialize();
					break;
				default:
					Logger.error(`[DB] Unsupported database type: ${engine}`);
					process.exit(1);
			}
		} catch (error) {
			Logger.error(`[DB] Failed to initialize ${engine} database: ${error}`);
			process.exit(1);
		}

		Logger.info(`[DB] Database successfully initialized.`);
	}

	export async function prepare(query: string): Promise<any[] | null> {
		try {
			switch (engine) {
				case "postgres":
				case "postgresql":
				case "mysql":
				case "mysql2":
				case "sqlite":
					return await connection`${query}`;
				default:
					Logger.error(`[DB] Unsupported database type: ${engine}`);
					process.exit();
			}
		} catch (error) {
			Logger.error("[DB] " + error);
			return null;
		}
	}

	export async function prepareModify(query: string): Promise<boolean | null> {
		try {
			switch (engine) {
				case "mysql":
				case "mysql2":
					return (await connection`${query}`)?.affectedRows > 0;
				case "postgres":
				case "postgresql":
				case "sqlite":
					await connection`${query}`;
					return true;
				default:
					Logger.error(`[DB] Unsupported database type: ${engine}`);
					process.exit();
			}
		} catch (error) {
			Logger.error("[DB] " + error);
			return null;
		}
	}
}

export default DB;
