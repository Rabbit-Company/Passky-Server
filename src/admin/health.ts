import { config } from "../config.ts";
import type { Maintenance } from "../maintenance.ts";
import { configuredAdminPasswordEntropy } from "../security.ts";
import type { AdminAccountStats } from "../types.ts";
import type { HealthCheck, SystemSummary } from "./types.ts";

interface HealthInput {
	accountStats: AdminAccountStats;
	databaseAvailable: boolean;
	maintenance: Maintenance;
	system: SystemSummary;
	systemAvailable: boolean;
}

function capacityCheck(accountStats: AdminAccountStats, databaseAvailable: boolean): HealthCheck {
	if (!databaseAvailable) {
		return {
			name: "Account capacity",
			detail: "Capacity cannot be calculated until the database connection is restored.",
			status: "error",
		};
	}

	if (config.account.maxAccounts < 0) {
		return {
			name: "Account capacity",
			detail: `${accountStats.accounts} accounts are registered; the server has no configured account limit.`,
			status: "healthy",
		};
	}

	const remaining = Math.max(0, config.account.maxAccounts - accountStats.accounts);
	const reached = accountStats.accounts >= config.account.maxAccounts;
	const nearlyFull = config.account.maxAccounts > 0 && accountStats.accounts / config.account.maxAccounts >= 0.9;

	return {
		name: "Account capacity",
		detail: reached
			? `The ${config.account.maxAccounts}-account limit has been reached. New registrations are blocked.`
			: `${accountStats.accounts} of ${config.account.maxAccounts} accounts are used (${remaining} remain).`,
		status: reached || nearlyFull ? "warning" : "healthy",
	};
}

function resourceCheck(name: string, available: number, total: number, systemAvailable: boolean): HealthCheck {
	if (!systemAvailable || total <= 0) {
		return {
			name,
			detail: `${name} information could not be read from the host.`,
			status: "error",
		};
	}

	const freePercent = Math.round((available / total) * 100);

	return {
		name,
		detail: `${freePercent}% is currently available.`,
		status: freePercent < 5 ? "error" : freePercent < 15 ? "warning" : "healthy",
	};
}

export function openMetricsCheck(enabled: boolean, token: string): HealthCheck {
	return {
		name: "OpenMetrics",
		detail: !enabled
			? "Metrics are disabled."
			: token
				? "Metrics are enabled and protected with a bearer token."
				: "Metrics are enabled but do not require a bearer token.",
		status: enabled && !token ? "warning" : "healthy",
	};
}

export function reportsApiCheck(enabled: boolean): HealthCheck {
	return {
		name: "Public reports API",
		detail: enabled
			? "/?action=getReport is publicly accessible without authentication."
			: "/?action=getReport is disabled. The report below is only visible here in the administrator interface.",
		status: enabled ? "warning" : "healthy",
	};
}

export function healthChecks(input: HealthInput): HealthCheck[] {
	const maintenanceReport = input.maintenance.getReport();
	const entropy = configuredAdminPasswordEntropy();

	return [
		{
			name: "Passky API",
			detail: "The Bun HTTP application is responding and the administrator interface was rendered.",
			status: "healthy",
		},
		{
			name: "Database",
			detail: input.databaseAvailable
				? `Connected successfully with ${input.accountStats.accounts} accounts and ${input.accountStats.passwords} encrypted passwords.`
				: "Passky could not query the configured database.",
			status: input.databaseAvailable ? "healthy" : "error",
		},
		capacityCheck(input.accountStats, input.databaseAvailable),
		{
			name: "Maintenance scheduler",
			detail: maintenanceReport
				? `The daily report is available and contains ${maintenanceReport.activeUsers} recently active users.`
				: "The first maintenance report has not completed yet.",
			status: maintenanceReport ? "healthy" : "warning",
		},
		resourceCheck("Storage", input.system.diskFree, input.system.diskTotal, input.systemAvailable),
		resourceCheck("Memory", input.system.memoryFree, input.system.memoryTotal, input.systemAvailable),
		{
			name: "TLS connection",
			detail: "Your browser will verify whether this administrator session uses HTTPS.",
			status: "info",
		},
		openMetricsCheck(config.metrics.enabled, config.metrics.token),
		reportsApiCheck(config.reports.enabled),
		{
			name: "Administrator password",
			detail: entropy === null ? "ADMIN_PASSWORD is not configured." : `Estimated password entropy is ${Math.round(entropy)} bits.`,
			status: entropy !== null && entropy >= 60 ? "healthy" : "warning",
		},
		{
			name: "Email recovery",
			detail: config.mail.enabled ? `SMTP recovery is enabled through ${config.mail.host}:${config.mail.port}.` : "Email-based username recovery is disabled.",
			status: config.mail.enabled ? "healthy" : "info",
		},
		{
			name: "Server version",
			detail: `Passky Server ${config.version} is running on Bun ${Bun.version}.`,
			status: "healthy",
		},
	];
}
