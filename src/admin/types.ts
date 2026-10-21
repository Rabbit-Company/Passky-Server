import type { ReportSnapshot } from "../maintenance.ts";
import type { AdminAccountRow, AdminAccountStats, AdminLicenseStats, LicenseRow } from "../types.ts";

export type AdminSection = "overview" | "accounts" | "licenses" | "reports" | "health" | "system";

export type HealthStatus = "healthy" | "warning" | "error" | "info";

export interface HealthCheck {
	detail: string;
	name: string;
	status: HealthStatus;
}

export interface LicenseBatch {
	duration: number;
	licenses: string[];
}

export interface AdminNotice {
	message: string;
	tone: "success" | "warning";
}

export interface AdminSession {
	csrf: string;
	expiresAt: number;
	licenseBatch?: LicenseBatch;
	notice?: AdminNotice;
}

export interface Pagination {
	page: number;
	perPage: number;
	total: number;
	totalPages: number;
	from: number;
	to: number;
}

export interface SystemSummary {
	cpuLoad: number;
	cores: number;
	diskFree: number;
	diskTotal: number;
	memoryFree: number;
	memoryTotal: number;
}

export interface AdminPageData {
	accountStats: AdminAccountStats;
	accounts: AdminAccountRow[];
	csrf: string;
	healthChecks: HealthCheck[];
	licenseBatch?: LicenseBatch;
	licenses: LicenseRow[];
	licenseStats: AdminLicenseStats;
	notice?: AdminNotice;
	pagination: Pagination;
	report: ReportSnapshot | null;
	search: string;
	section: AdminSection;
	serverOrigin: string;
	system: SystemSummary;
}
