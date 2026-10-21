import { subDays, today } from "./time.ts";
import { databasePasswords, databaseUsers } from "./metrics.ts";
import type { Database } from "./database.ts";
import type { ReportRow } from "./types.ts";
import { config } from "./config.ts";

export interface ReportSnapshot {
	activeUsers: number;
	results: ReportRow[];
}

export class Maintenance {
	private lastRun: string | null = null;
	private reportSnapshot: ReportSnapshot | null = null;
	private timer: ReturnType<typeof setInterval> | null = null;

	constructor(private readonly database: Database) {}

	async start(): Promise<void> {
		await this.runIfDue();

		this.timer = setInterval(
			() => {
				this.runIfDue().catch((error: unknown) => {
					console.error("Daily maintenance failed and will be retried within an hour.", error);
				});
			},
			60 * 60 * 1_000,
		);
	}

	stop(): void {
		if (this.timer) clearInterval(this.timer);
		this.timer = null;
	}

	getReport(): ReportSnapshot | null {
		return this.reportSnapshot;
	}

	async runIfDue(): Promise<boolean> {
		const currentDate = today();

		if (this.lastRun === currentDate) return false;

		await this.database.initialize();
		await this.database.expirePremiumAccounts(config.account.maxPasswords, currentDate);

		const [users, passwords, results, activeUsers] = await Promise.all([
			this.database.userCount(),
			this.database.passwordCount(),
			this.database.report(),
			this.database.activeUserCount(subDays(currentDate, 7)),
		]);

		databaseUsers.set(users);
		databasePasswords.set(passwords);

		this.reportSnapshot = { activeUsers, results };
		this.lastRun = currentDate;

		return true;
	}
}
