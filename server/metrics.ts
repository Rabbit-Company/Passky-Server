import { Counter, Histogram, Registry } from "@rabbit-company/openmetrics-client";

namespace Metrics {
	export const registry = new Registry({ prefix: "passky" });

	export const http_requests_total = new Counter({
		name: "http_requests",
		help: "Total HTTP requests",
		labelNames: ["method", "endpoint"] as const,
		registry: registry,
	});

	export const http_auth_requests_total = new Counter({
		name: "http_auth_requests",
		help: "Total Authorized HTTP requests",
		labelNames: ["endpoint", "username"] as const,
		registry: registry,
	});

	export const http_request_duration = new Histogram({
		name: "http_request_duration",
		help: "Duration of HTTP requests in milliseconds",
		labelNames: ["endpoint"],
		buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
		registry: registry,
	});
}

export default Metrics;
