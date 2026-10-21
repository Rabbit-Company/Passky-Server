import { Cache } from "./cache.ts";
import { anonymizeIp, constantTimeEqual, generateToken } from "./security.ts";
import { today } from "./time.ts";

const TOKEN_TTL_SECONDS = 3_600;

export class TokenStore {
	constructor(private readonly cache = new Cache()) {}

	async issue(username: string, clientIp: string): Promise<string> {
		const key = this.key(username, clientIp);
		const token = (await this.cache.get(key)) ?? generateToken();

		await this.cache.set(key, token, TOKEN_TTL_SECONDS);

		return token;
	}

	async verify(username: string, clientIp: string, token: string): Promise<boolean> {
		if (token.length !== 64) return false;

		const stored = await this.cache.get(this.key(username, clientIp));

		return stored !== null && constantTimeEqual(stored, token);
	}

	async revoke(username: string): Promise<void> {
		await this.cache.deletePrefix(this.prefix(username));
	}

	close(): void {
		this.cache.close();
	}

	private prefix(username: string): string {
		return `token_${username}-`;
	}

	private key(username: string, clientIp: string): string {
		return `${this.prefix(username)}${anonymizeIp(clientIp, today())}`;
	}
}
