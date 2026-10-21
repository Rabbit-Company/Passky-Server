import { config } from "../config.ts";
import { addDays, today } from "../time.ts";
import type { AdminAccountRow, LicenseRow, ReportRow } from "../types.ts";
import { escapeHtml, queryUrl } from "./helpers.ts";
import type { AdminPageData, AdminSection, Pagination } from "./types.ts";

export const adminHeaders = {
	"Content-Security-Policy":
		"default-src 'self'; style-src 'self'; script-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; form-action 'self'; connect-src 'self' https://challenges.cloudflare.com; frame-ancestors 'none'; object-src 'none'; base-uri 'none'",
	"X-Content-Type-Options": "nosniff",
	"X-Frame-Options": "DENY",
	"Referrer-Policy": "no-referrer",
	"Permissions-Policy": "clipboard-write=(self), interest-cohort=()",
} as const;

const sectionTitles: Record<AdminSection, { eyebrow: string; title: string }> = {
	overview: { eyebrow: "At a glance", title: "Server overview" },
	accounts: { eyebrow: "User management", title: "Accounts" },
	licenses: { eyebrow: "Premium access", title: "Licenses" },
	reports: { eyebrow: "Growth & activity", title: "Reports" },
	health: { eyebrow: "Operational checks", title: "Health" },
	system: { eyebrow: "Runtime health", title: "System" },
};

function pageShell(content: string, authenticated: boolean): string {
	return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="dark light">
    <title>${authenticated ? "Administrator | Passky" : "Sign in | Passky"}</title>
    <link rel="icon" href="/admin/assets/logo.svg" type="image/svg+xml">
    <link rel="stylesheet" href="/admin/assets/admin.css">
    <script src="/admin/assets/admin.js" defer></script>
    ${config.turnstile.siteKey === "1x00000000000000000000AA" ? "" : '<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>'}
  </head>
  <body>${content}</body>
</html>`;
}

function connectionGuide(serverOrigin: string): string {
	return `<section class="panel connection-guide">
    <div class="panel-header"><div><h2>Connect a Passky Client</h2><span class="muted">Use this server with the web, desktop, or mobile client.</span></div></div>
    <div class="panel-body guide-grid">
      <article class="guide-step"><span>1</span><div><strong>Open Passky Client</strong><p class="muted">Install a <a href="https://passky.org/download" target="_blank" rel="noreferrer">Passky Client</a> or open <a href="https://vault.passky.org" target="_blank" rel="noreferrer">vault.passky.org</a>.</p></div></article>
      <article class="guide-step"><span>2</span><div><strong>Enter this server URL</strong><p class="muted">Paste this address into the Client's Server field.</p><div class="copy-field"><input id="passky-server-origin" data-server-origin value="${escapeHtml(serverOrigin)}" readonly><button class="button" type="button" data-copy-target="passky-server-origin">Copy</button></div></div></article>
      <article class="guide-step"><span>3</span><div><strong>Sign in or create an account</strong><p class="muted">The Client will use the compatible Passky API hosted at this address.</p></div></article>
    </div>
  </section>`;
}

export function renderLogin(serverOrigin: string): string {
	const disabled = !config.admin.password;
	const turnstile =
		config.turnstile.siteKey === "1x00000000000000000000AA"
			? '<input type="hidden" name="cf-turnstile-response" value="development-test-key">'
			: `<div class="cf-turnstile" data-sitekey="${escapeHtml(config.turnstile.siteKey)}" data-action="login"></div>`;

	return pageShell(
		`<main class="public-shell">
    <section class="public-intro">
      <div class="brand public-brand"><img class="brand-logo" src="/admin/assets/logo.svg" alt=""><span><strong>Passky</strong><small>Your password manager</small></span></div>
      <span class="eyebrow">Private password management</span>
      <h1>Connect to this Passky Server</h1>
      <p class="muted">This server is ready for Passky Clients. Follow the steps below to start using it.</p>
      ${connectionGuide(serverOrigin)}
    </section>
    <section class="login-card">
    <span class="eyebrow">Server administration</span>
    <h1>Administrator sign in</h1>
    <p class="muted">Authorized server operators can sign in here.</p>
    ${
			disabled
				? '<div class="notice warning">Set <code>ADMIN_PASSWORD</code> to enable administration.</div>'
				: `
      <form method="post" action="/admin/login">
        <label class="field">Username<input name="username" autocomplete="username" required autofocus></label>
        <label class="field">Password<input name="password" type="password" autocomplete="current-password" required></label>
        ${turnstile}
        <button class="button primary" type="submit">Sign in</button>
      </form>`
		}
  </section></main>`,
		false,
	);
}

function navigation(section: AdminSection, csrf: string): string {
	const item = (target: AdminSection, label: string) => `<a href="${queryUrl(target)}"${section === target ? ' aria-current="page"' : ""}>${label}</a>`;

	return `<aside class="sidebar">
    <div class="brand"><img class="brand-logo" src="/admin/assets/logo.svg" alt=""><span><strong>Passky</strong><small>Administrator</small></span></div>
    <nav class="nav" aria-label="Administrator sections">
      ${item("overview", "Overview")}
      ${item("accounts", "Accounts")}
      ${item("licenses", "Licenses")}
      ${item("reports", "Reports")}
      ${item("health", "Health")}
		${item("system", "System")}
    </nav>
    <div class="sidebar-footer">
      <label class="field theme-control"><span>Theme</span><select data-theme-select aria-label="Color theme"><option value="dark">Dark</option><option value="light">Light</option></select></label>
      <form method="post" action="/admin/logout"><input type="hidden" name="csrf" value="${escapeHtml(csrf)}"><button class="button danger" type="submit">Sign out</button></form>
    </div>
  </aside>`;
}

function stat(label: string, value: number | string): string {
	return `<article class="stat"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></article>`;
}

function stats(data: AdminPageData): string {
	return `<div class="stats">
    ${stat("Accounts", data.accountStats.accounts)}
    ${stat("Encrypted passwords", data.accountStats.passwords)}
    ${stat("Premium accounts", data.accountStats.premiumAccounts)}
    ${stat("Unused licenses", data.licenseStats.unusedLicenses)}
  </div>`;
}

function overview(data: AdminPageData): string {
	const errors = data.healthChecks.filter((check) => check.status === "error").length;

	return `${stats(data)}
    <section class="panel">
      <div class="panel-header"><div><h2>Administration</h2><span class="muted">Everything important is a click away.</span></div></div>
      <div class="panel-body system-grid">
        <a class="stat" href="${queryUrl("accounts")}"><span>Manage accounts</span><strong>${data.accountStats.accounts}</strong><small class="muted">Search, inspect, edit, or remove accounts</small></a>
        <a class="stat" href="${queryUrl("licenses")}"><span>Manage licenses</span><strong>${data.licenseStats.licenses}</strong><small class="muted">Create, copy, inspect, or revoke licenses</small></a>
        <a class="stat" href="${queryUrl("reports")}"><span>Reports</span><strong>${data.report ? data.report.activeUsers : "–"}</strong><small class="muted">Active users and registration growth</small></a>
        <a class="stat" href="${queryUrl("health")}"><span>Health checks</span><strong data-health-overview data-server-errors="${errors}">${errors === 0 ? "Ready" : "Attention"}</strong><small class="muted">Database, capacity, TLS, and service checks</small></a>
        <a class="stat" href="${queryUrl("system")}"><span>System</span><strong>Runtime</strong><small class="muted">Memory, storage, Bun, and endpoints</small></a>
      </div>
    </section>
    ${connectionGuide(data.serverOrigin)}`;
}

function filters(section: "accounts" | "licenses", data: AdminPageData): string {
	const noun = section === "accounts" ? "username or email" : "key or linked account";

	return `<form class="filters" method="get" action="/">
    <input type="hidden" name="section" value="${section}">
    <label class="field search">Search ${noun}<input name="search" value="${escapeHtml(data.search)}" placeholder="Search ${noun}"></label>
    <label class="field">Rows<select name="perPage" data-auto-submit><option value="25"${data.pagination.perPage === 25 ? " selected" : ""}>25</option><option value="50"${data.pagination.perPage === 50 ? " selected" : ""}>50</option><option value="100"${data.pagination.perPage === 100 ? " selected" : ""}>100</option></select></label>
    <button class="button" type="submit">Search</button>
    ${data.search ? `<a class="button quiet" href="${queryUrl(section, { perPage: data.pagination.perPage })}">Clear</a>` : ""}
  </form>`;
}

function pageNumbers(paging: Pagination): number[] {
	const values = new Set([1, paging.totalPages, paging.page - 1, paging.page, paging.page + 1]);

	return [...values].filter((value) => value >= 1 && value <= paging.totalPages).sort((a, b) => a - b);
}

function paginationView(section: "accounts" | "licenses", data: AdminPageData): string {
	const pages = pageNumbers(data.pagination);
	let previous = 0;
	const links: string[] = [];

	for (const page of pages) {
		if (previous && page - previous > 1) links.push("<i>…</i>");
		links.push(
			page === data.pagination.page
				? `<span aria-current="page">${page}</span>`
				: `<a href="${escapeHtml(queryUrl(section, { page, perPage: data.pagination.perPage, search: data.search }))}">${page}</a>`,
		);
		previous = page;
	}

	return `<footer class="pagination">
    <span>Showing <strong>${data.pagination.from}</strong>-<strong>${data.pagination.to}</strong> of <strong>${data.pagination.total}</strong></span>
    <nav class="page-links" aria-label="Pagination">${links.join("")}</nav>
  </footer>`;
}

function dialog(id: string, title: string, body: string, footer: string, wide = false): string {
	return `<dialog id="${id}"${wide ? ' class="wide"' : ""}>
    <div class="dialog-header"><h2>${escapeHtml(title)}</h2><button class="button icon quiet" type="button" data-dialog-close aria-label="Close">×</button></div>
    <div class="dialog-body">${body}</div>
    <div class="dialog-footer">${footer}</div>
  </dialog>`;
}

function accountDialogs(account: AdminAccountRow, index: number, data: AdminPageData): string {
	const infoId = `account-info-${index}`;
	const editId = `account-edit-${index}`;
	const deleteId = `account-delete-${index}`;
	const username = escapeHtml(account.username);
	const returnTo = queryUrl("accounts", {
		page: data.pagination.page,
		perPage: data.pagination.perPage,
		search: data.search,
	});
	const info = `<dl class="details">
    <dt>ID</dt><dd>${escapeHtml(account.user_id)}</dd>
    <dt>Username</dt><dd>${username}</dd>
    <dt>Email</dt><dd>${escapeHtml(account.email)}</dd>
    <dt>Passwords</dt><dd>${account.passwords} / ${account.max_passwords < 0 ? "∞" : account.max_passwords}</dd>
    <dt>Created</dt><dd>${escapeHtml(account.created)}</dd>
    <dt>Last access</dt><dd>${escapeHtml(account.accessed)}</dd>
    <dt>Premium expires</dt><dd>${escapeHtml(account.premium_expires ?? "Inactive")}</dd>
    <dt>Backup codes</dt><dd>${escapeHtml(account.backup_codes?.split(";").join(", ") ?? "Not configured")}</dd>
  </dl>`;
	const edit = `<form id="account-edit-form-${index}" method="post" action="/admin/accounts/${encodeURIComponent(account.username)}">
    <input type="hidden" name="csrf" value="${escapeHtml(data.csrf)}">
    <input type="hidden" name="return_to" value="${escapeHtml(returnTo)}">
    <label class="field">Email<input name="email" type="email" value="${escapeHtml(account.email)}" required></label>
    <label class="field">Maximum encrypted passwords<input name="max_passwords" type="number" min="-1" max="1000000000" value="${account.max_passwords}" required><small>Use −1 for unlimited.</small></label>
    ${account.backup_codes !== null ? '<label class="check"><input name="disable2fa" type="checkbox" value="true">Disable 2FA and remove backup codes</label>' : ""}
    ${account.premium_expires !== null ? '<label class="check"><input name="disablePremium" type="checkbox" value="true">Disable premium access</label>' : ""}
  </form>`;
	const remove = `<p>Delete <strong>${username}</strong> and every encrypted password owned by it?</p><p class="muted">This cannot be undone.</p>
    <form id="account-delete-form-${index}" method="post" action="/admin/accounts/${encodeURIComponent(account.username)}/delete"><input type="hidden" name="csrf" value="${escapeHtml(data.csrf)}"><input type="hidden" name="return_to" value="${escapeHtml(returnTo)}"></form>`;

	return `${dialog(infoId, "Account details", info, '<button class="button" type="button" data-dialog-close>Close</button>')}
    ${dialog(editId, `Edit ${account.username}`, edit, `<button class="button" type="button" data-dialog-close>Cancel</button><button class="button primary" type="submit" form="account-edit-form-${index}">Save changes</button>`)}
    ${dialog(deleteId, "Delete account", remove, `<button class="button" type="button" data-dialog-close>Cancel</button><button class="button danger" type="submit" form="account-delete-form-${index}">Delete account</button>`)}`;
}

function accounts(data: AdminPageData): string {
	const rows = data.accounts
		.map(
			(account, index) => `<tr>
    <td><div class="cell-title">${escapeHtml(account.username)}</div><div class="cell-subtitle">${escapeHtml(account.email)}</div></td>
    <td><strong>${account.passwords}</strong> / ${account.max_passwords < 0 ? "∞" : account.max_passwords}</td>
    <td class="hide-small">${account.premium_expires ? `<span class="badge success">Until ${escapeHtml(account.premium_expires)}</span>` : '<span class="badge">Standard</span>'}</td>
    <td class="hide-small"><div>${escapeHtml(account.accessed)}</div><div class="cell-subtitle">Created ${escapeHtml(account.created)}</div></td>
    <td><div class="row-actions"><button class="button quiet" type="button" data-dialog-open="account-info-${index}">Details</button><button class="button quiet" type="button" data-dialog-open="account-edit-${index}">Edit</button><button class="button quiet danger" type="button" data-dialog-open="account-delete-${index}">Delete</button></div>${accountDialogs(account, index, data)}</td>
  </tr>`,
		)
		.join("");

	return `${stats(data)}<section class="panel">
    <div class="panel-header"><div><h2>Accounts</h2><span class="muted">Results are fetched one page at a time.</span></div></div>
    <div class="panel-body">${filters("accounts", data)}</div>
    <div class="table-wrap"><table><thead><tr><th>Account</th><th>Passwords</th><th class="hide-small">Plan</th><th class="hide-small">Activity</th><th><span class="muted">Actions</span></th></tr></thead><tbody>${rows || '<tr><td class="empty" colspan="5">No matching accounts.</td></tr>'}</tbody></table></div>
    ${paginationView("accounts", data)}
  </section>`;
}

function licenseDialogs(license: LicenseRow, index: number, data: AdminPageData): string {
	const returnTo = queryUrl("licenses", {
		page: data.pagination.page,
		perPage: data.pagination.perPage,
		search: data.search,
	});
	const info = `<dl class="details"><dt>License</dt><dd>${escapeHtml(license.license)}</dd><dt>Duration</dt><dd>${Number(license.duration)} days</dd><dt>Created</dt><dd>${escapeHtml(license.created)}</dd><dt>Used</dt><dd>${escapeHtml(license.used ?? "Unused")}</dd><dt>Linked account</dt><dd>${escapeHtml(license.linked ?? "None")}</dd></dl>`;
	const remove = `<p>Delete license <strong>${escapeHtml(license.license)}</strong>?</p><p class="muted">Deleting an activated license does not remove premium access from its account.</p><form id="license-delete-form-${index}" method="post" action="/admin/licenses/${encodeURIComponent(license.license)}/delete"><input type="hidden" name="csrf" value="${escapeHtml(data.csrf)}"><input type="hidden" name="return_to" value="${escapeHtml(returnTo)}"></form>`;

	return `${dialog(`license-info-${index}`, "License details", info, '<button class="button" type="button" data-dialog-close>Close</button>')}
    ${dialog(`license-delete-${index}`, "Delete license", remove, `<button class="button" type="button" data-dialog-close>Cancel</button><button class="button danger" type="submit" form="license-delete-form-${index}">Delete license</button>`)}`;
}

function createdLicensesDialog(data: AdminPageData): string {
	if (!data.licenseBatch) return "";

	const output = escapeHtml(data.licenseBatch.licenses.join("\n"));
	const body = `<p><strong>${data.licenseBatch.licenses.length}</strong> licenses were created with a duration of <strong>${data.licenseBatch.duration} days</strong>.</p><p class="muted">This batch is shown only once. Copy or download it before closing.</p><textarea id="created-license-output" class="license-output" readonly>${output}</textarea>`;
	const footer =
		'<button class="button" type="button" data-download-target="created-license-output">Download .txt</button><button class="button primary" type="button" data-copy-target="created-license-output">Copy all</button><button class="button" type="button" data-dialog-close>Done</button>';

	return dialog("created-licenses", "Licenses created", body, footer, true).replace("<dialog ", "<dialog data-auto-open ");
}

function licenses(data: AdminPageData): string {
	const rows = data.licenses
		.map(
			(license, index) => `<tr>
    <td><div class="cell-title"><code>${escapeHtml(license.license)}</code></div><div class="cell-subtitle">${escapeHtml(license.linked ?? "Unused")}</div></td>
    <td>${Number(license.duration)} days</td>
    <td class="hide-small">${license.linked ? '<span class="badge success">Activated</span>' : '<span class="badge">Unused</span>'}</td>
    <td class="hide-small"><div>${escapeHtml(license.created)}</div><div class="cell-subtitle">${escapeHtml(license.used ?? "Never used")}</div></td>
    <td><input id="license-value-${index}" type="hidden" value="${escapeHtml(license.license)}"><div class="row-actions"><button class="button quiet" type="button" data-copy-target="license-value-${index}">Copy</button><button class="button quiet" type="button" data-dialog-open="license-info-${index}">Details</button><button class="button quiet danger" type="button" data-dialog-open="license-delete-${index}">Delete</button></div>${licenseDialogs(license, index, data)}</td>
  </tr>`,
		)
		.join("");

	return `${stats(data)}<section class="panel">
    <div class="panel-header"><div><h2>Licenses</h2><span class="muted">Create and distribute premium access keys.</span></div><button class="button primary" type="button" data-dialog-open="create-license">Create licenses</button></div>
    <div class="panel-body">${filters("licenses", data)}</div>
    <div class="table-wrap"><table><thead><tr><th>License</th><th>Duration</th><th class="hide-small">Status</th><th class="hide-small">Dates</th><th>Actions</th></tr></thead><tbody>${rows || '<tr><td class="empty" colspan="5">No matching licenses.</td></tr>'}</tbody></table></div>
    ${paginationView("licenses", data)}
  </section>
  ${dialog("create-license", "Create licenses", `<form id="create-license-form" method="post" action="/admin/licenses"><input type="hidden" name="csrf" value="${escapeHtml(data.csrf)}"><label class="field">Duration in days<input name="days" type="number" min="1" max="365000" value="365" required></label><label class="field">Number of licenses<input name="amount" type="number" min="1" max="1000" value="1" required><small>Up to 1,000 keys per batch.</small></label></form>`, '<button class="button" type="button" data-dialog-close>Cancel</button><button class="button primary" type="submit" form="create-license-form">Create</button>')}
  ${createdLicensesDialog(data)}`;
}

const CHART_BAR_WIDTH = 10;
const CHART_STEP = 16;
const CHART_HEIGHT = 160;
const CHART_BAR_PRESETS = [7, 14, 30, 90, 180, 365];

function fillDailyGaps(sparseResults: ReportRow[]): ReportRow[] {
	if (sparseResults.length === 0) return sparseResults;

	const counts = new Map(sparseResults.map((row) => [row.date, row.newcomers]));
	const lastDate = today();
	const filled: ReportRow[] = [];

	for (let date = sparseResults[0]!.date; date <= lastDate; date = addDays(date, 1)) {
		filled.push({ date, newcomers: counts.get(date) ?? 0 });
	}

	return filled;
}

function reportChart(days: ReportRow[]): string {
	const totalBars = days.length;
	const svgWidth = totalBars * CHART_STEP;
	const maxNewcomers = Math.max(1, ...days.map((row) => row.newcomers));

	const bars = days
		.map((row, index) => {
			const isEmpty = row.newcomers === 0;
			const height = isEmpty ? 1 : Math.max(2, Math.round((row.newcomers / maxNewcomers) * CHART_HEIGHT));
			const x = index * CHART_STEP;
			const y = CHART_HEIGHT - height;
			const label = `${escapeHtml(row.date)}: ${row.newcomers} new ${row.newcomers === 1 ? "account" : "accounts"}`;

			return `<rect class="chart-bar${isEmpty ? " chart-bar-empty" : ""}" data-date="${escapeHtml(row.date)}" data-count="${row.newcomers}" x="${x}" y="${y}" width="${CHART_BAR_WIDTH}" height="${height}" rx="${isEmpty ? 1 : 2}"><title>${label}</title></rect>`;
		})
		.join("");

	const totalAllTime = days.reduce((sum, row) => sum + row.newcomers, 0);
	const presetOptions = CHART_BAR_PRESETS.map((value) => `<option value="${value}">`).join("");

	return `<div class="chart-toolbar">
    <label class="field chart-jump-field">Jump to date<input type="date" data-chart-jump min="${escapeHtml(days[0]!.date)}" max="${escapeHtml(days[totalBars - 1]!.date)}"></label>
    <label class="field chart-bars-field">Bars shown<input type="number" data-chart-bars min="1" max="${totalBars}" step="1" value="30" list="chart-bar-presets"></label>
    <datalist id="chart-bar-presets">${presetOptions}</datalist>
  </div>
  <div class="chart-scroll" data-chart-scroll>
    <svg class="chart" data-chart-svg viewBox="0 0 ${svgWidth} ${CHART_HEIGHT}" width="${svgWidth}" height="${CHART_HEIGHT}" preserveAspectRatio="none" role="img" aria-label="New account registrations per day">${bars}</svg>
  </div>
  <div class="chart-range">
    <span data-chart-left>${escapeHtml(days[0]!.date)}</span>
    <span data-chart-total>Total: ${totalAllTime} ${totalAllTime === 1 ? "account" : "accounts"}</span>
    <span data-chart-right>${escapeHtml(days[totalBars - 1]!.date)}</span>
  </div>`;
}

function reports(data: AdminPageData): string {
	const report = data.report;
	const apiStatus = config.reports.enabled ? '<span class="badge">Public API enabled</span>' : '<span class="badge success">Public API disabled</span>';

	if (!report || report.results.length === 0) {
		return `<section class="panel">
      <div class="panel-header"><div><h2>Reports</h2><span class="muted">Registration activity and active users.</span></div>${apiStatus}</div>
      <div class="panel-body"><p class="muted">The first report has not been generated yet. Check back after the next maintenance cycle.</p></div>
    </section>`;
	}

	const days = fillDailyGaps(report.results);
	const totalNewcomers = days.reduce((sum, row) => sum + row.newcomers, 0);
	const activeDays = days.filter((row) => row.newcomers > 0).length;
	const dailyAverage = totalNewcomers / days.length;
	const peak = days.reduce((best, row) => (row.newcomers > best.newcomers ? row : best), days[0]!);

	return `<div class="stats">
    ${stat("Active users (7d)", report.activeUsers)}
    ${stat("New accounts tracked", totalNewcomers)}
    ${stat("Days with activity", activeDays)}
    ${stat("Avg. daily signups", dailyAverage.toFixed(2))}
    ${stat("Avg. weekly signups", (dailyAverage * 7).toFixed(1))}
    ${stat("Avg. monthly signups", (dailyAverage * 30).toFixed(1))}
    ${stat("Avg. yearly signups", (dailyAverage * 365).toFixed(1))}
    ${stat("Peak signup day", `${peak.newcomers} on ${peak.date}`)}
  </div>
  <section class="panel">
    <div class="panel-header"><div><h2>New account registrations</h2><span class="muted">One bar per day. Set how many bars to show, then scroll to explore history.</span></div>${apiStatus}</div>
    <div class="panel-body">${reportChart(days)}</div>
  </section>`;
}

function formatBytes(bytes: number): string {
	if (bytes < 1_000) return `${bytes} B`;
	const units = ["KB", "MB", "GB", "TB"];
	let value = bytes / 1_000;
	let unit = units[0] ?? "KB";

	for (let index = 1; value >= 1_000 && index < units.length; index += 1) {
		value /= 1_000;
		unit = units[index] ?? unit;
	}

	return `${value.toFixed(1)} ${unit}`;
}

function system(data: AdminPageData): string {
	const memoryUsed = data.system.memoryTotal - data.system.memoryFree;
	const diskUsed = data.system.diskTotal - data.system.diskFree;
	const memoryPercent = data.system.memoryTotal ? Math.round((memoryUsed / data.system.memoryTotal) * 100) : 0;
	const diskPercent = data.system.diskTotal ? Math.round((diskUsed / data.system.diskTotal) * 100) : 0;

	return `<div class="stats">${stat("Status", "Healthy")}${stat("Version", config.version)}${stat("Location", config.location)}${stat("CPU cores", data.system.cores)}</div>
    <div class="system-grid">
      <section class="panel"><div class="panel-header"><h2>Memory</h2><strong>${memoryPercent}%</strong></div><div class="panel-body"><progress max="100" value="${memoryPercent}"></progress><p class="muted">${formatBytes(memoryUsed)} used of ${formatBytes(data.system.memoryTotal)}</p></div></section>
      <section class="panel"><div class="panel-header"><h2>Storage</h2><strong>${diskPercent}%</strong></div><div class="panel-body"><progress max="100" value="${diskPercent}"></progress><p class="muted">${formatBytes(diskUsed)} used of ${formatBytes(data.system.diskTotal)}</p></div></section>
      <section class="panel"><div class="panel-header"><h2>Runtime</h2></div><div class="panel-body"><dl class="details"><dt>Bun</dt><dd>${escapeHtml(Bun.version)}</dd><dt>Load average</dt><dd>${data.system.cpuLoad.toFixed(2)}</dd><dt>Database</dt><dd>${escapeHtml(config.database.url.split(":", 1)[0] ?? "sqlite")}</dd><dt>Metrics</dt><dd>${config.metrics.enabled ? "Enabled" : "Disabled"}</dd></dl></div></section>
      <section class="panel"><div class="panel-header"><h2>Endpoints</h2></div><div class="panel-body"><dl class="details"><dt>API</dt><dd><a href="/?action=getInfo">getInfo</a></dd><dt>Health</dt><dd><a href="/health">/health</a></dd><dt>Metrics</dt><dd><a href="/metrics">/metrics</a></dd></dl></div></section>
    </div>`;
}

function health(data: AdminPageData): string {
	const healthy = data.healthChecks.filter((check) => check.status === "healthy").length;
	const warnings = data.healthChecks.filter((check) => check.status === "warning").length;
	const errors = data.healthChecks.filter((check) => check.status === "error").length;
	const checks = data.healthChecks
		.map((check) => {
			const tls = check.name === "TLS connection" ? " data-health-tls" : "";

			return `<article class="health-item ${check.status}"${tls}>
      <span class="health-indicator" aria-hidden="true"></span>
      <div><div class="health-heading"><strong>${escapeHtml(check.name)}</strong><span class="badge health-status">${escapeHtml(check.status)}</span></div><p class="muted health-detail">${escapeHtml(check.detail)}</p></div>
    </article>`;
		})
		.join("");

	return `<div class="stats">
    ${stat("Checks", data.healthChecks.length)}
    <article class="stat"><span>Healthy</span><strong data-health-count="healthy">${healthy}</strong></article>
    <article class="stat"><span>Warnings</span><strong data-health-count="warning">${warnings}</strong></article>
    <article class="stat"><span>Errors</span><strong data-health-count="error">${errors}</strong></article>
  </div>
  <section class="panel">
    <div class="panel-header"><div><h2>Health check</h2><span class="muted">Live checks performed when this page was loaded.</span></div><a class="button" href="${queryUrl("health")}">Run again</a></div>
    <div class="health-list">${checks}</div>
  </section>`;
}

export function renderAdmin(data: AdminPageData): string {
	const heading = sectionTitles[data.section];
	const content =
		data.section === "accounts"
			? accounts(data)
			: data.section === "licenses"
				? licenses(data)
				: data.section === "reports"
					? reports(data)
					: data.section === "health"
						? health(data)
						: data.section === "system"
							? system(data)
							: overview(data);
	const notice = data.notice ? `<div class="notice ${data.notice.tone === "warning" ? "warning" : ""}">${escapeHtml(data.notice.message)}</div>` : "";

	return pageShell(
		`<div class="layout">${navigation(data.section, data.csrf)}<main class="main">
    <header class="topbar"><div><span class="eyebrow">${heading.eyebrow}</span><h1>${heading.title}</h1></div></header>
    ${notice}${content}
  </main></div>`,
		true,
	);
}
