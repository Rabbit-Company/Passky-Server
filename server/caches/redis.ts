import { RedisClient } from "bun";
import { Logger } from "../logger";

namespace Redis {
	export const localCache: RedisClient = new RedisClient(process.env["REDIS_LOCAL"] || "redis://localhost/", { idleTimeout: 0 });
	export const externalCache: RedisClient = new RedisClient(process.env["REDIS_EXTERNAL"] || "redis://localhost/", { idleTimeout: 0 });

	export async function initialize() {
		Redis.localCache.onconnect = () => {
			Logger.info("[REDIS] Local Redis connected");
		};
		Redis.externalCache.onconnect = () => {
			Logger.info("[REDIS] External Redis connected");
		};
		Redis.localCache.onclose = () => {
			Logger.error("[REDIS] Local Redis connection error!");
		};
		Redis.externalCache.onclose = () => {
			Logger.error("[REDIS] External Redis connection error!");
		};
	}

	export async function getString(key: string, localTTL: number = 0): Promise<string | null> {
		try {
			const localValue = await Redis.localCache.get(key);
			if (localValue !== null) return localValue;

			const externalValue = await Redis.externalCache.get(key);
			if (externalValue !== null) {
				if (localTTL !== 0) await Redis.localCache.set(key, externalValue, "EX", localTTL);
				return externalValue;
			}

			return null;
		} catch {
			Logger.error("[REDIS] Connection error!");
			return null;
		}
	}

	export async function setString(key: string, value: string, localTTL: number = 0, externalTTL: number = 0): Promise<boolean | null> {
		try {
			if (localTTL !== 0) await Redis.localCache.set(key, value, "EX", localTTL);
			if (externalTTL !== 0) await Redis.externalCache.set(key, value, "EX", externalTTL);
			return true;
		} catch {
			Logger.error("[REDIS] Connection error!");
			return null;
		}
	}

	export async function increase(key: string, local: boolean = true, external: boolean = false): Promise<number | null> {
		try {
			let number = 0;

			if (local) number = await Redis.localCache.incr(key);
			if (external) number = await Redis.externalCache.incr(key);

			return number;
		} catch {
			Logger.error("[REDIS] Connection error!");
			return null;
		}
	}

	export async function getNumber(key: string, defaultNumber: number = 0): Promise<number> {
		return Number.parseInt((await Redis.getString(key)) || defaultNumber.toString(), 10) || defaultNumber;
	}

	export async function deleteString(key: string): Promise<boolean | null> {
		try {
			await Redis.localCache.del(key);
			await Redis.externalCache.del(key);
			return true;
		} catch {
			Logger.error("[REDIS] Connection error!");
			return null;
		}
	}

	export async function getOrSetString(key: string, value: string, localTTL: number = 0, externalTTL: number = 0): Promise<string | null> {
		try {
			if (localTTL !== 0) {
				const localValue = await Redis.localCache.get(key);
				if (localValue !== null) return localValue;
			}

			if (externalTTL !== 0) {
				const externalValue = await Redis.externalCache.get(key);
				if (externalValue !== null) {
					if (localTTL !== 0) await Redis.localCache.set(key, externalValue, "EX", localTTL);
					return externalValue;
				}
			}

			if (localTTL !== 0) await Redis.localCache.set(key, value, "EX", localTTL);
			if (externalTTL !== 0) await Redis.externalCache.set(key, value, "EX", externalTTL);
			return value;
		} catch {
			Logger.error("[REDIS] Connection error!");
			return null;
		}
	}
}

export default Redis;
