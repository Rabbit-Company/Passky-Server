import type { AdminSection, Pagination } from "./types.ts";

const sections = new Set<AdminSection>(["overview", "accounts", "licenses", "reports", "health", "system"]);
const pageSizes = new Set([25, 50, 100]);

export function escapeHtml(value: unknown): string {
	return String(value ?? "")
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#039;");
}

export function parseSection(value: string | null): AdminSection {
	return sections.has(value as AdminSection) ? (value as AdminSection) : "overview";
}

export function parsePositiveInteger(value: string | null, fallback: number): number {
	const parsed = Number.parseInt(value ?? "", 10);

	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function parsePageSize(value: string | null): number {
	const parsed = parsePositiveInteger(value, 25);

	return pageSizes.has(parsed) ? parsed : 25;
}

export function pagination(page: number, perPage: number, total: number): Pagination {
	const totalPages = Math.max(1, Math.ceil(total / perPage));
	const currentPage = Math.min(Math.max(1, page), totalPages);
	const from = total === 0 ? 0 : (currentPage - 1) * perPage + 1;

	return {
		page: currentPage,
		perPage,
		total,
		totalPages,
		from,
		to: Math.min(currentPage * perPage, total),
	};
}

export function safeReturnLocation(value: string | null, fallback: string): string {
	if (!value?.startsWith("/?") || value.includes("\n") || value.includes("\r")) return fallback;

	return value;
}

export function queryUrl(section: AdminSection, values: { page?: number; perPage?: number; search?: string } = {}): string {
	const query = new URLSearchParams({ section });

	if (values.page && values.page > 1) query.set("page", String(values.page));
	if (values.perPage && values.perPage !== 25) query.set("perPage", String(values.perPage));
	if (values.search) query.set("search", values.search);

	return `/?${query.toString()}`;
}

export function cookies(request: Request): Map<string, string> {
	const values = new Map<string, string>();

	for (const part of request.headers.get("cookie")?.split(";") ?? []) {
		const separator = part.indexOf("=");
		if (separator > 0) values.set(part.slice(0, separator).trim(), part.slice(separator + 1).trim());
	}

	return values;
}

export async function form(request: Request): Promise<URLSearchParams> {
	return new URLSearchParams(await request.text());
}

export function redirect(location = "/"): Response {
	return new Response(null, { status: 303, headers: { Location: location } });
}
