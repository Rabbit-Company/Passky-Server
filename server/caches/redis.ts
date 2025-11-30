import { RedisClient } from "bun";
import { Logger } from "../logger";
import { Settings } from "../settings";
import type { ICacheBackend } from "./cache";

export default class RedisCache implements ICacheBackend {
	private client: RedisClient;
	private isExternal: boolean;

	constructor(isExternal: boolean = false) {
		this.isExternal = isExternal;
		const config = isExternal ? Settings.getExternalRedisConfig() : Settings.getLocalRedisConfig();
		this.client = new RedisClient(config);
	}

	async initialize(): Promise<void> {
		this.client.onconnect = () => {
			Logger.info(`[CACHE] ${this.isExternal ? "External" : "Local"} Redis cache connected`);
		};
		this.client.onclose = () => {
			Logger.error(`[CACHE] ${this.isExternal ? "External" : "Local"} Redis cache connection error!`);
		};
	}

	async get(key: string): Promise<string | null> {
		try {
			return await this.client.get(key);
		} catch {
			Logger.error("[CACHE] Redis get error");
			return null;
		}
	}

	async set(key: string, value: string, ttl?: number): Promise<boolean> {
		try {
			if (ttl && ttl > 0) {
				await this.client.set(key, value, "EX", ttl);
			} else {
				await this.client.set(key, value);
			}
			return true;
		} catch {
			Logger.error("[CACHE] Redis set error");
			return false;
		}
	}

	async delete(key: string): Promise<boolean> {
		try {
			await this.client.del(key);
			return true;
		} catch {
			Logger.error("[CACHE] Redis delete error");
			return false;
		}
	}

	async incr(key: string): Promise<number> {
		try {
			return await this.client.incr(key);
		} catch {
			Logger.error("[CACHE] Redis incr error");
			return 0;
		}
	}

	async destroy(): Promise<void> {}
}
