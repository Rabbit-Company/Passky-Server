import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";

import { clientHash, config, createFixture, Database, expectError, json, otherClientHash, type Fixture } from "./helpers.ts";
import { openMetricsCheck, statsApiCheck } from "../src/admin/health.ts";
import { addDays, subDays, today } from "../src/time.ts";

let fixture: Fixture;

beforeEach(async () => {
	fixture = await createFixture();
});

afterEach(async () => {
	await fixture.close();
});

describe("licenses and maintenance", () => {
	test("redeems a license once and applies premium limits and expiration", async () => {
		const firstToken = await fixture.createAuthenticatedAccount("firstuser", clientHash);
		const license = "AAAAA-BBBBB-CCCCC-DDDDD-EEEEE";
		await fixture.database.createLicenses([license], 30);

		await expectError(
			fixture.apiRequest("upgradeAccount", {
				username: "firstuser",
				password: firstToken,
				fields: { license: "invalid" },
			}),
			29,
		);

		const upgraded = await expectError(
			fixture.apiRequest("upgradeAccount", {
				username: "firstuser",
				password: firstToken,
				fields: { license },
			}),
			0,
		);
		expect(upgraded.max_passwords).toBe(config.account.premiumMaxPasswords);
		expect(upgraded.premium_expires).toBe(addDays(today(), 30));

		const secondToken = await fixture.createAuthenticatedAccount("seconduser", otherClientHash);
		await expectError(
			fixture.apiRequest("upgradeAccount", {
				username: "seconduser",
				password: secondToken,
				fields: { license },
			}),
			30,
		);
		expect((await fixture.database.findLicense(license))?.linked).toBe("firstuser");
	});

	test("extends active premium, restarts expired premium from today, and claims a license only once", async () => {
		await fixture.createAccount();
		await fixture.database.createLicenses(["EXPIR-EDPRE-MIUMA-AAAAA-00001", "ACTIV-EPREM-IUMAA-AAAAA-00002", "ACTIV-EPREM-IUMAA-AAAAA-00003"], 30);

		expect(await fixture.database.redeemLicense("testuser", "EXPIR-EDPRE-MIUMA-AAAAA-00001", -1, subDays(today(), 40))).toBe(subDays(today(), 10));
		expect(await fixture.database.redeemLicense("testuser", "ACTIV-EPREM-IUMAA-AAAAA-00002", -1, today())).toBe(addDays(today(), 30));
		expect(await fixture.database.redeemLicense("testuser", "ACTIV-EPREM-IUMAA-AAAAA-00003", -1, today())).toBe(addDays(today(), 60));
		expect(await fixture.database.redeemLicense("testuser", "ACTIV-EPREM-IUMAA-AAAAA-00003", -1, today())).toBeNull();
		expect((await fixture.database.findUser("testuser"))?.premium_expires).toBe(addDays(today(), 60));
	});

	test("starts maintenance internally and does not expose a cron route", async () => {
		await fixture.close();
		fixture = await createFixture({
			limiterEnabled: false,
			reportsEnabled: true,
		});

		await fixture.createAccount();
		await expectError(fixture.apiRequest("getReport"), 31);

		const cron = await fixture.app.handle(new Request("http://passky.test/cron.php"));
		expect(cron.status).toBe(404);
		expect(await json(cron)).toEqual({
			error: 404,
			info: "Can not connect into API.",
		});
		await expectError(fixture.apiRequest("getReport"), 31);

		await fixture.maintenance.start();

		const report = await expectError(fixture.apiRequest("getReport"), 0);
		expect(report.activeUsers).toBe(1);
		expect(report.results).toEqual([{ date: today(), newcomers: 1 }]);
		expect(await fixture.maintenance.runIfDue()).toBe(false);
	});

	test("keeps the public reports API disabled unless explicitly enabled", async () => {
		await fixture.createAccount();
		await fixture.maintenance.start();

		await expectError(fixture.apiRequest("getReport"), 32);
		expect(config.reports.enabled).toBe(false);
	});

	test("shows the reports section to signed-in administrators even while the public API is disabled", async () => {
		await fixture.createAccount();
		await fixture.maintenance.start();
		await expectError(fixture.apiRequest("getReport"), 32);

		const { cookie } = await fixture.adminSession();
		const response = await fixture.app.handle(
			new Request("http://passky.test/?section=reports", {
				headers: { cookie },
			}),
		);
		const html = await response.text();

		expect(response.status).toBe(200);
		expect(html).toContain("New account registrations");
		expect(html).toContain("Active users (7d)");
		expect(html).toContain("Public API disabled");
		expect(html).toContain('class="chart"');
		expect(html).toContain(`${today()}: 1 new account`);
		expect(html).toContain(`data-date="${today()}" data-count="1"`);
		expect(html).toContain("Avg. daily signups");
		expect(html).toContain("<strong>1.00</strong>");
		expect(html).toContain("Avg. weekly signups");
		expect(html).toContain("<strong>7.0</strong>");
		expect(html).toContain("Avg. monthly signups");
		expect(html).toContain("<strong>30.0</strong>");
		expect(html).toContain("Avg. yearly signups");
		expect(html).toContain("<strong>365.0</strong>");
		expect(html).toContain("Peak signup day");
		expect(html).toContain(`1 on ${today()}`);
		expect(html).toContain("data-chart-bars");
		expect(html).toContain('list="chart-bar-presets"');
		expect(html).toContain(`data-chart-jump min="${today()}" max="${today()}"`);
	});

	test("expires old premium accounts without deleting account data", async () => {
		await fixture.createAccount();
		const license = "11111-22222-33333-44444-55555";
		await fixture.database.createLicenses([license], 30);
		await fixture.database.redeemLicense("testuser", license, -1, subDays(today(), 31));

		expect(await fixture.maintenance.runIfDue()).toBe(true);

		const user = await fixture.database.findUser("testuser");
		expect(user?.premium_expires).toBeNull();
		expect(Number(user?.max_passwords)).toBe(config.account.maxPasswords);
		expect(await fixture.database.userCount()).toBe(1);
	});

	test("starts when the database rejects DDL but the tables already exist", async () => {
		await fixture.createAccount();
		const client = fixture.database["client"];
		const rejectDdl = spyOn(client, "unsafe").mockImplementation((() =>
			Promise.reject(new Error("direct DDL is disabled"))) as unknown as typeof client.unsafe);

		await fixture.database.initialize();
		expect(await fixture.database.userCount()).toBe(1);
		rejectDdl.mockRestore();

		const empty = new Database();
		const emptyClient = empty["client"];
		spyOn(emptyClient, "unsafe").mockImplementation((() => Promise.reject(new Error("direct DDL is disabled"))) as unknown as typeof emptyClient.unsafe);

		await expect(empty.initialize()).rejects.toThrow("direct DDL is disabled");
		await empty.close();
	});

	test("schema initialization is idempotent and preserves existing rows", async () => {
		await fixture.createAccount();
		await fixture.database.initialize();
		await fixture.database.initialize();

		expect(await fixture.database.userCount()).toBe(1);
		expect((await fixture.database.findUser("testuser"))?.email).toBe("testuser@example.com");
	});
});

describe("administration interface", () => {
	test("treats disabled OpenMetrics as healthy and warns only when exposed", () => {
		expect(openMetricsCheck(false, "")).toEqual({
			name: "OpenMetrics",
			detail: "Metrics are disabled.",
			status: "healthy",
		});
		expect(openMetricsCheck(true, "secret-token").status).toBe("healthy");
		expect(openMetricsCheck(true, "").status).toBe("warning");
		expect(statsApiCheck(false).status).toBe("healthy");
		expect(statsApiCheck(true).status).toBe("warning");
	});

	test("rejects invalid credentials and creates a secure authenticated session", async () => {
		const loginPage = await fixture.app.handle(new Request("http://passky.test/"));
		expect(loginPage.status).toBe(200);
		expect(loginPage.headers.get("x-frame-options")).toBe("DENY");
		const loginHtml = await loginPage.text();
		expect(loginHtml).toContain("Passky");
		expect(loginHtml).toContain('src="/admin/assets/logo.svg"');
		expect(loginHtml).toContain("Connect to this Passky Server");
		expect(loginHtml).toContain("Connect a Passky Client");
		expect(loginHtml).toContain("Open Passky Client");
		expect(loginHtml).toContain('value="http://passky.test"');
		expect(loginHtml).toContain('data-copy-target="passky-server-origin"');
		expect(loginHtml).toContain("Administrator sign in");
		expect(loginHtml.indexOf("Connect a Passky Client")).toBeLessThan(loginHtml.indexOf("Administrator sign in"));

		const invalid = await fixture.adminPost("/admin/login", "", {
			username: "admin",
			password: "wrong-password",
			"cf-turnstile-response": "development-test-key",
		});
		expect(invalid.status).toBe(303);
		expect(invalid.headers.get("set-cookie")).toBeNull();

		const { cookie } = await fixture.adminSession();
		expect(cookie).toStartWith("passky_admin=");
	});

	test("throttles repeated administrator sign-in attempts per client IP", async () => {
		const attempt = (password: string, ip: string) =>
			fixture.app.handle(
				new Request("http://passky.test/admin/login", {
					method: "POST",
					headers: {
						"content-type": "application/x-www-form-urlencoded",
						"x-real-ip": ip,
					},
					body: new URLSearchParams({
						username: "admin",
						password,
						"cf-turnstile-response": "development-test-key",
					}),
				}),
			);

		for (let index = 0; index < 5; index += 1) {
			expect((await attempt("wrong-password", "203.0.113.9")).headers.get("set-cookie")).toBeNull();
		}

		expect((await attempt("a-strong-admin-password-for-tests", "203.0.113.9")).headers.get("set-cookie")).toBeNull();
		expect((await attempt("a-strong-admin-password-for-tests", "203.0.113.10")).headers.get("set-cookie")).toContain("passky_admin=");
	});

	test("marks the session cookie Secure when TLS terminates at a reverse proxy", async () => {
		const login = await fixture.app.handle(
			new Request("http://passky.test/admin/login", {
				method: "POST",
				headers: {
					"content-type": "application/x-www-form-urlencoded",
					"x-forwarded-proto": "https",
				},
				body: new URLSearchParams({
					username: "admin",
					password: "a-strong-admin-password-for-tests",
					"cf-turnstile-response": "development-test-key",
				}),
			}),
		);

		expect(login.headers.get("set-cookie")).toContain("; Secure");
	});

	test("revokes API tokens when an administrator deletes the account", async () => {
		const token = await fixture.createAuthenticatedAccount();
		const { cookie, csrf } = await fixture.adminSession();

		await fixture.adminPost("/admin/accounts/testuser/delete", cookie, {
			csrf,
		});
		await fixture.createAccount("testuser", otherClientHash);

		await expectError(
			fixture.apiRequest("getPasswords", {
				username: "testuser",
				password: token,
				fields: {},
			}),
			25,
		);
	});

	test("shows Passky Client connection instructions with the current server URL", async () => {
		const { cookie } = await fixture.adminSession();
		const overview = await fixture.app.handle(
			new Request("http://passky.test/?section=overview", {
				headers: { cookie },
			}),
		);
		const html = await overview.text();

		expect(html).toContain("Connect a Passky Client");
		expect(html).toContain("Open Passky Client");
		expect(html).toContain("Enter this server URL");
		expect(html).toContain('value="http://passky.test"');
		expect(html).toContain("data-server-origin");
		expect(html).toContain("Encrypted passwords");
		expect(html).not.toContain("Encrypted records");
	});

	test("runs database, capacity, scheduler, resource, TLS, and configuration health checks", async () => {
		await fixture.createAccount();
		await fixture.maintenance.runIfDue();
		const { cookie } = await fixture.adminSession();
		const response = await fixture.app.handle(
			new Request("http://passky.test/?section=health", {
				headers: { cookie },
			}),
		);
		const html = await response.text();

		expect(response.status).toBe(200);
		expect(html).toContain("Health check");
		expect(html).toContain("Passky API");
		expect(html).toContain("Database");
		expect(html).toContain("1 accounts and 0 encrypted passwords");
		expect(html).toContain("Account capacity");
		expect(html).toContain("Maintenance scheduler");
		expect(html).toContain("Storage");
		expect(html).toContain("Memory");
		expect(html).toContain("data-health-tls");
		expect(html).toContain('data-health-count="healthy"');
		expect(html).toContain('data-health-count="warning"');
		expect(html).toContain('data-health-count="error"');
		expect(html).toContain("OpenMetrics");
		expect(html).toContain("Public reports API");
		expect(html).toContain("Public statistics API");
		expect(html).toContain("Administrator password");
		expect(html).toContain("Email recovery");
		expect(html).toContain("Server version");
	});

	test("requires CSRF and updates account settings through a session", async () => {
		await fixture.createAccount();
		await fixture.database.enableTwoFactor("testuser", "A".repeat(20), "123456");
		const premiumLicense = "PREMI-UMMMM-LICEN-SEEEE-00001";
		await fixture.database.createLicenses([premiumLicense], 30);
		await fixture.database.redeemLicense("testuser", premiumLicense, -1, today());
		const { cookie, csrf } = await fixture.adminSession();

		await fixture.adminPost("/admin/accounts/testuser", cookie, {
			csrf: "invalid",
			email: "changed@example.com",
			max_passwords: "42",
			disable2fa: "true",
			disablePremium: "true",
		});
		expect((await fixture.database.findUser("testuser"))?.email).toBe("testuser@example.com");

		const updated = await fixture.adminPost("/admin/accounts/testuser", cookie, {
			csrf,
			email: "CHANGED@example.com",
			max_passwords: "42",
			disable2fa: "true",
			disablePremium: "true",
		});
		expect(updated.status).toBe(303);

		const user = await fixture.database.findUser("testuser");
		expect(user?.email).toBe("changed@example.com");
		expect(user?.["2fa_secret"]).toBeNull();
		expect(user?.backup_codes).toBeNull();
		expect(user?.premium_expires).toBeNull();
		expect(Number(user?.max_passwords)).toBe(config.account.maxPasswords);
	});

	test("creates and deletes licenses through CSRF-protected routes", async () => {
		const { cookie, csrf } = await fixture.adminSession();

		const created = await fixture.adminPost("/admin/licenses", cookie, {
			csrf,
			days: "30",
			amount: "2",
		});
		expect(created.status).toBe(303);

		const licenses = await fixture.database.adminLicenses("");
		expect(licenses).toHaveLength(2);
		expect(licenses.every((license) => /^([A-F0-9]{5}-){4}[A-F0-9]{5}$/.test(license.license))).toBe(true);
		expect(licenses.every((license) => Number(license.duration) === 30)).toBe(true);

		await fixture.adminPost(`/admin/licenses/${licenses[0]?.license}/delete`, cookie, { csrf });
		expect(await fixture.database.adminLicenses("")).toHaveLength(1);
	});

	test("paginates and searches accounts without loading the full table", async () => {
		for (let index = 0; index < 30; index += 1) {
			const username = `user${String(index).padStart(3, "0")}`;
			await fixture.database.createUser(username, `${username}@example.com`, "unused", 1_000);
		}

		const { cookie } = await fixture.adminSession();
		const secondPage = await fixture.app.handle(
			new Request("http://passky.test/?section=accounts&page=2&perPage=25", {
				headers: { cookie },
			}),
		);
		const secondPageHtml = await secondPage.text();

		expect(secondPageHtml).toContain("Showing <strong>26</strong>-<strong>30</strong> of <strong>30</strong>");
		expect(secondPageHtml).toContain("user004");
		expect(secondPageHtml).not.toContain("user029@example.com");
		expect(secondPageHtml).toContain("Account details");

		const search = await fixture.app.handle(new Request("http://passky.test/?section=accounts&search=user02&perPage=25", { headers: { cookie } }));
		const searchHtml = await search.text();
		expect(searchHtml).toContain("of <strong>10</strong>");
		expect(searchHtml).toContain("user029@example.com");
		expect(searchHtml).not.toContain("user019@example.com");
	});

	test("paginates licenses and exposes copy and detail controls", async () => {
		const licenses = Array.from({ length: 60 }, (_, index) => `TEST-${String(index).padStart(24, "0")}`);
		await fixture.database.createLicenses(licenses, 90);
		const { cookie } = await fixture.adminSession();

		const response = await fixture.app.handle(
			new Request("http://passky.test/?section=licenses&page=3&perPage=25", {
				headers: { cookie },
			}),
		);
		const html = await response.text();

		expect(html).toContain("Showing <strong>51</strong>-<strong>60</strong> of <strong>60</strong>");
		expect(html).toContain("TEST-000000000000000000000050");
		expect(html).not.toContain("TEST-000000000000000000000049");
		expect(html).toContain("data-copy-target");
		expect(html).toContain("License details");
	});

	test("shows a large newly-created license batch once with copy and download actions", async () => {
		const { cookie, csrf } = await fixture.adminSession();
		const created = await fixture.adminPost("/admin/licenses", cookie, {
			csrf,
			days: "365",
			amount: "150",
		});

		expect(created.status).toBe(303);
		expect(created.headers.get("location")).toBe("/?section=licenses");
		expect((await fixture.database.adminLicenseStats()).licenses).toBe(150);

		const firstView = await fixture.app.handle(
			new Request("http://passky.test/?section=licenses", {
				headers: { cookie },
			}),
		);
		const firstHtml = await firstView.text();
		expect(firstHtml).toContain("data-auto-open");
		expect(firstHtml).toContain("<strong>150</strong> licenses were created");
		expect(firstHtml).toContain('data-copy-target="created-license-output"');
		expect(firstHtml).toContain('data-download-target="created-license-output"');

		const secondView = await fixture.app.handle(
			new Request("http://passky.test/?section=licenses", {
				headers: { cookie },
			}),
		);
		expect(await secondView.text()).not.toContain("data-auto-open");
	});

	test("serves panel assets and the system overview with strict content types", async () => {
		const stylesheet = await fixture.app.handle(new Request("http://passky.test/admin/assets/admin.css"));
		expect(stylesheet.status).toBe(200);
		expect(stylesheet.headers.get("content-type")).toContain("text/css");
		const stylesheetText = await stylesheet.text();
		expect(stylesheetText).toContain(".pagination");
		expect(stylesheetText).toContain("::-webkit-scrollbar-thumb");
		expect(stylesheetText).toContain("scrollbar-color: var(--accent-soft) transparent");
		expect(stylesheetText).toContain("background: var(--accent-soft); background-clip: padding-box");
		expect(stylesheetText).toContain("#709cff");
		expect(stylesheetText).toContain("#3f66ff");
		expect(stylesheetText).toContain("#2340ff");
		expect(stylesheetText).not.toContain("#7c3aed");
		expect(stylesheetText).toContain('grid-template-areas: "brand footer" "nav nav"');
		expect(stylesheetText).toContain("position: sticky");

		const script = await fixture.app.handle(new Request("http://passky.test/admin/assets/admin.js"));
		expect(script.status).toBe(200);
		expect(script.headers.get("content-type")).toContain("text/javascript");
		const scriptText = await script.text();
		expect(scriptText).toContain("navigator.clipboard");
		expect(scriptText).toContain("window.location.origin");
		expect(scriptText).toContain("data-health-tls");
		expect(scriptText).toContain("https://burrowgate.org/");
		expect(scriptText).toContain("Configure TLS with a reverse proxy");
		expect(scriptText).toContain("We recommend");
		expect(scriptText).toContain("burrowGateLink");
		expect(scriptText).toContain("data-health-count");
		expect(scriptText).toContain("querySelectorAll('.health-item.' + healthStatus)");

		const logo = await fixture.app.handle(new Request("http://passky.test/admin/assets/logo.svg"));
		expect(logo.status).toBe(200);
		expect(logo.headers.get("content-type")).toContain("image/svg+xml");
		expect(await logo.text()).toContain("<title>Passky</title>");

		const { cookie } = await fixture.adminSession();
		const system = await fixture.app.handle(
			new Request("http://passky.test/?section=system", {
				headers: { cookie },
			}),
		);
		const systemHtml = await system.text();
		expect(systemHtml).toContain("Runtime");
		expect(systemHtml).toContain("Storage");
		expect(systemHtml).not.toContain("Server overview");
	});

	test("deletes accounts and invalidates sessions on logout", async () => {
		await fixture.createAccount();
		const { cookie, csrf } = await fixture.adminSession();

		await fixture.adminPost("/admin/accounts/testuser/delete", cookie, {
			csrf,
		});
		expect(await fixture.database.findUser("testuser")).toBeNull();

		const logout = await fixture.adminPost("/admin/logout", cookie, { csrf });
		expect(logout.status).toBe(303);
		expect(logout.headers.get("set-cookie")).toContain("Max-Age=0");

		const oldSession = await fixture.app.handle(new Request("http://passky.test/", { headers: { cookie } }));
		expect(await oldSession.text()).toContain("Sign in");
	});
});
