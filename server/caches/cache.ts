import { Logger } from "../logger";
import { Settings } from "../settings";
import FileCache from "./file";
import MemoryCache from "./memory";
import RedisCache from "./redis";

export interface ICacheBackend {
	initialize(): Promise<void>;
	get(key: string): Promise<string | null>;
	set(key: string, value: string, ttl?: number): Promise<boolean>;
	delete(key: string): Promise<boolean>;
	incr(key: string): Promise<number>;
	destroy(): Promise<void>;
}

namespace Cache {
	let localCache: ICacheBackend;
	let externalCache: ICacheBackend | null = null;

	/**
	 * Initialize cache based on environment configuration
	 *
	 * For Redis mode:
	 * - CACHE_TYPE=redis uses local Redis + external Redis (if configured)
	 *
	 * For other modes:
	 * - CACHE_TYPE=memory|file sets the primary cache
	 * - CACHE_BACKUP_TYPE=memory|file|redis sets the backup/persistent cache
	 */
	export async function initialize() {
		const cacheType = (process.env["CACHE_TYPE"] || "memory").toLowerCase();
		const backupType = process.env["CACHE_BACKUP_TYPE"]?.toLowerCase();

		if (cacheType === "redis") {
			localCache = new RedisCache(false);

			try {
				const externalConfig = Settings.getExternalRedisConfig();
				const localConfig = Settings.getLocalRedisConfig();

				if (externalConfig !== localConfig) {
					externalCache = new RedisCache(true);
				} else {
					Logger.info("[CACHE] External Redis config same as local, using single Redis instance");
				}
			} catch (error) {
				Logger.warn("[CACHE] External Redis not configured, using local only");
			}
		} else {
			switch (cacheType) {
				case "file":
					localCache = new FileCache(process.env["CACHE_DIR"] || "./cache");
					break;
				case "memory":
				default:
					localCache = new MemoryCache();
					break;
			}

			if (backupType && backupType !== cacheType) {
				switch (backupType) {
					case "redis":
						const useExternal = process.env["CACHE_BACKUP_REDIS_EXTERNAL"] === "true";
						externalCache = new RedisCache(useExternal);
						break;
					case "file":
						externalCache = new FileCache(process.env["CACHE_BACKUP_DIR"] || "./cache_backup");
						break;
					case "memory":
						externalCache = new MemoryCache();
						break;
				}
			}
		}

		await localCache.initialize();
		Logger.info(`[CACHE] Primary cache initialized: ${localCache.constructor.name}`);

		if (externalCache) {
			await externalCache.initialize();
			Logger.info(`[CACHE] ${cacheType === "redis" ? "External" : "Backup"} cache initialized: ${externalCache.constructor.name}`);
		}
	}

	/**
	 * Get a string value from cache
	 * Always checks local/primary first, then external/backup if not found
	 *
	 * @param key Cache key
	 * @param localTTL If value found in external/backup, cache locally with this TTL
	 */
	export async function getString(key: string, localTTL: number = 0): Promise<string | null> {
		let value = await localCache.get(key);
		if (value !== null) return value;

		if (externalCache) {
			value = await externalCache.get(key);
			if (value !== null && localTTL > 0) {
				await localCache.set(key, value, localTTL);
			}
			return value;
		}

		return null;
	}

	/**
	 * Set a string value in cache
	 *
	 * @param key Cache key
	 * @param value Value to cache
	 * @param localTTL TTL for local/primary cache (0 = no expiry)
	 * @param externalTTL TTL for external/backup cache (0 = don't write to external/backup)
	 */
	export async function setString(key: string, value: string, localTTL: number = 0, externalTTL: number = 0): Promise<boolean> {
		let success = true;

		const localResult = await localCache.set(key, value, localTTL);
		success = success && localResult;

		if (externalCache && externalTTL > 0) {
			const externalResult = await externalCache.set(key, value, externalTTL);
			success = success && externalResult;
		}

		return success;
	}

	/**
	 * Delete a key from all cache layers
	 */
	export async function deleteString(key: string): Promise<boolean> {
		let success = true;

		const localResult = await localCache.delete(key);
		success = success && localResult;

		if (externalCache) {
			const externalResult = await externalCache.delete(key);
			success = success && externalResult;
		}

		return success;
	}

	/**
	 * Increment a numeric value in cache
	 *
	 * @param key Cache key
	 * @param local Update local/primary cache
	 * @param external Update external/backup cache
	 */
	export async function increase(key: string, local: boolean = true, external: boolean = false): Promise<number> {
		let result = 0;

		if (local) {
			result = await localCache.incr(key);
		}

		if (external && externalCache) {
			result = await externalCache.incr(key);
		}

		return result;
	}

	/**
	 * Get a numeric value from cache
	 */
	export async function getNumber(key: string, defaultNumber: number = 0): Promise<number> {
		const value = await getString(key);
		return Number.parseInt(value || defaultNumber.toString(), 10) || defaultNumber;
	}

	/**
	 * Get value from cache or set it if not found
	 *
	 * @param key Cache key
	 * @param value Value to set if not found
	 * @param localTTL TTL for local/primary cache
	 * @param externalTTL TTL for external/backup cache (0 = don't write)
	 */
	export async function getOrSetString(key: string, value: string, localTTL: number = 0, externalTTL: number = 0): Promise<string | null> {
		let existingValue = await localCache.get(key);
		if (existingValue !== null) return existingValue;

		if (externalCache) {
			existingValue = await externalCache.get(key);
			if (existingValue !== null) {
				if (localTTL > 0) {
					await localCache.set(key, existingValue, localTTL);
				}
				return existingValue;
			}
		}

		await setString(key, value, localTTL, externalTTL);
		return value;
	}

	/**
	 * Check if external/backup cache is available
	 */
	export function hasExternalCache(): boolean {
		return externalCache !== null;
	}

	/**
	 * Check if running in Redis mode (multi-node support)
	 */
	export function isRedisMode(): boolean {
		return process.env["CACHE_TYPE"]?.toLowerCase() === "redis";
	}

	/**
	 * Get cache statistics (useful for monitoring)
	 */
	export async function getStats(): Promise<{
		mode: string;
		primary: string;
		secondary: string | null;
		isMultiNode: boolean;
	}> {
		const cacheType = process.env["CACHE_TYPE"] || "memory";
		return {
			mode: cacheType,
			primary: localCache.constructor.name,
			secondary: externalCache?.constructor.name || null,
			isMultiNode: cacheType === "redis" && externalCache !== null,
		};
	}

	/**
	 * Clean up and destroy cache connections
	 */
	export async function destroy() {
		await localCache.destroy();
		if (externalCache) {
			await externalCache.destroy();
		}
	}
}

export default Cache;
