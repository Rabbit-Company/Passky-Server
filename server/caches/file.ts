import { Logger } from "../logger";
import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import type { ICacheBackend } from "./cache";

export default class FileCache implements ICacheBackend {
	private cacheDir: string;
	private cleanupInterval: Timer | null = null;

	constructor(cacheDir: string = "./cache") {
		this.cacheDir = cacheDir;
	}

	async initialize(): Promise<void> {
		await mkdir(this.cacheDir, { recursive: true });
		this.cleanupInterval = setInterval(() => {
			this.cleanup();
		}, 300000);
		Logger.info(`[CACHE] File cache initialized at ${this.cacheDir}`);
	}

	private getFilePath(key: string): string {
		const hash = Bun.hash.rapidhash(key);
		return path.join(this.cacheDir, `${hash}.cache`);
	}

	async get(key: string): Promise<string | null> {
		try {
			const filePath = this.getFilePath(key);
			const data = await Bun.file(filePath).json();

			if (data.expiresAt && Date.now() > data.expiresAt) {
				await Bun.file(filePath)
					.delete()
					.catch(() => {});
				return null;
			}

			return data.value;
		} catch {
			return null;
		}
	}

	async set(key: string, value: string, ttl?: number): Promise<boolean> {
		try {
			const filePath = this.getFilePath(key);
			const expiresAt = ttl ? Date.now() + ttl * 1000 : null;
			const data = { value, expiresAt, key };

			await Bun.write(filePath, JSON.stringify(data));
			return true;
		} catch {
			return false;
		}
	}

	async delete(key: string): Promise<boolean> {
		try {
			const filePath = this.getFilePath(key);
			await Bun.file(filePath).delete();
			return true;
		} catch {
			return false;
		}
	}

	async incr(key: string): Promise<number> {
		const current = await this.get(key);
		const num = current ? parseInt(current, 10) : 0;
		const newValue = (isNaN(num) ? 0 : num) + 1;

		await this.set(key, newValue.toString());
		return newValue;
	}

	async destroy(): Promise<void> {
		if (this.cleanupInterval) {
			clearInterval(this.cleanupInterval);
			this.cleanupInterval = null;
		}
	}

	private async cleanup(): Promise<void> {
		try {
			const files = await readdir(this.cacheDir);
			const now = Date.now();

			for (const file of files) {
				if (!file.endsWith(".cache")) continue;

				const filePath = path.join(this.cacheDir, file);
				try {
					const data = await Bun.file(filePath).json();

					if (data.expiresAt && now > data.expiresAt) {
						await Bun.file(filePath).delete();
					}
				} catch {}
			}
		} catch {}
	}
}
