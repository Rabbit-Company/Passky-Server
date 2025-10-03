import { Logger } from "../logger";
import type { ICacheBackend } from "../types";

export default class MemoryCache implements ICacheBackend {
	private cache: Map<string, { value: string; expiresAt: number | null }> = new Map();
	private cleanupInterval: Timer | null = null;

	async initialize(): Promise<void> {
		this.cleanupInterval = setInterval(() => {
			this.cleanup();
		}, 60000);
		Logger.info("[CACHE] Memory cache initialized");
	}

	async get(key: string): Promise<string | null> {
		const entry = this.cache.get(key);
		if (!entry) return null;

		if (entry.expiresAt && Date.now() > entry.expiresAt) {
			this.cache.delete(key);
			return null;
		}

		return entry.value;
	}

	async set(key: string, value: string, ttl?: number): Promise<boolean> {
		const expiresAt = ttl ? Date.now() + ttl * 1000 : null;
		this.cache.set(key, { value, expiresAt });
		return true;
	}

	async delete(key: string): Promise<boolean> {
		return this.cache.delete(key);
	}

	async incr(key: string): Promise<number> {
		const current = await this.get(key);
		const num = current ? parseInt(current, 10) : 0;
		const newValue = (isNaN(num) ? 0 : num) + 1;

		const entry = this.cache.get(key);
		const expiresAt = entry?.expiresAt || null;

		this.cache.set(key, { value: newValue.toString(), expiresAt });
		return newValue;
	}

	async destroy(): Promise<void> {
		if (this.cleanupInterval) {
			clearInterval(this.cleanupInterval);
			this.cleanupInterval = null;
		}
		this.cache.clear();
	}

	private cleanup(): void {
		const now = Date.now();
		for (const [key, entry] of this.cache.entries()) {
			if (entry.expiresAt && now > entry.expiresAt) {
				this.cache.delete(key);
			}
		}
	}
}
