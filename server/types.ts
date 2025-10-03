export interface ICacheBackend {
	initialize(): Promise<void>;
	get(key: string): Promise<string | null>;
	set(key: string, value: string, ttl?: number): Promise<boolean>;
	delete(key: string): Promise<boolean>;
	incr(key: string): Promise<number>;
	destroy(): Promise<void>;
}
