import { RedisClient } from "bun";

import { config } from "./config.ts";

interface CacheEntry {
	value: string;
	expiresAt: number;
}

const TLS_HOST_PREFIX = /^(?:tls|ssl|tlsv1(?:\.[0-3])?):\/\//i;

export function legacyRedisUrl(host: string, port: number, password: string): string {
	const scheme = TLS_HOST_PREFIX.test(host) ? "rediss" : "redis";
	const credentials = password ? `:${encodeURIComponent(password)}@` : "";

	return `${scheme}://${credentials}${host.replace(TLS_HOST_PREFIX, "")}:${port}`;
}

function redisUrl(): string | null {
	if (config.redis.url) return config.redis.url;
	if (!Bun.env.REDIS_HOST) return null;

	return legacyRedisUrl(config.redis.host, config.redis.port, config.redis.password);
}

export class Cache {
	private readonly memory = new Map<string, CacheEntry>();
	private readonly redis = this.createRedisClient();
	private redisAvailable = this.redis !== null;
	private readonly purgeTimer = setInterval(() => this.purgeExpired(), 60_000);

	constructor() {
		this.purgeTimer.unref();
	}

	private createRedisClient(): RedisClient | null {
		const url = redisUrl();

		if (!url) return null;

		try {
			return new RedisClient(url, {
				connectionTimeout: 500,
				enableOfflineQueue: false,
				maxRetries: 0,
			});
		} catch {
			console.warn("Redis settings could not be parsed. Passky will use in-memory storage.");
			return null;
		}
	}

	async get(key: string): Promise<string | null> {
		const local = this.memory.get(key);

		if (local && local.expiresAt > Date.now()) return local.value;
		if (local) this.memory.delete(key);

		if (!this.redis || !this.redisAvailable) return null;

		try {
			return await this.redis.get(key);
		} catch {
			this.redisAvailable = false;
			return null;
		}
	}

	async set(key: string, value: string, ttlSeconds: number): Promise<void> {
		this.memory.set(key, {
			value,
			expiresAt: Date.now() + ttlSeconds * 1_000,
		});

		if (!this.redis || !this.redisAvailable) return;

		try {
			await this.redis.set(key, value, "EX", ttlSeconds);
		} catch {
			this.redisAvailable = false;
		}
	}

	async delete(...keys: string[]): Promise<void> {
		for (const key of keys) this.memory.delete(key);

		if (!this.redis || !this.redisAvailable || keys.length === 0) return;

		try {
			await this.redis.del(...keys);
		} catch {
			this.redisAvailable = false;
		}
	}

	async deletePrefix(prefix: string): Promise<void> {
		for (const key of this.memory.keys()) {
			if (key.startsWith(prefix)) this.memory.delete(key);
		}

		if (!this.redis || !this.redisAvailable) return;

		try {
			let cursor = "0";

			do {
				const [next, keys] = (await this.redis.send("SCAN", [cursor, "MATCH", `${prefix}*`, "COUNT", "100"])) as [string, string[]];
				if (keys.length > 0) await this.redis.del(...keys);
				cursor = next;
			} while (cursor !== "0");
		} catch {
			this.redisAvailable = false;
		}
	}

	purgeExpired(): void {
		const now = Date.now();

		for (const [key, entry] of this.memory) {
			if (entry.expiresAt <= now) this.memory.delete(key);
		}
	}

	close(): void {
		clearInterval(this.purgeTimer);
		this.redis?.close();
	}
}
