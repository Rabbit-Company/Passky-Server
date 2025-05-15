import Logger from "@rabbit-company/logger";
import Metrics from "./metrics";
import Redis from "./caches/redis";
import { jsonError } from "./utils";
import { Error } from "./errors";
import Scheduler from "./scheduler";

await Redis.initialize();
await Scheduler.initialize();

Logger.level = Number(process.env["LOGGER_LEVEL"]) || 3;

Logger.info(`[HS] HTTP Server listening on port ${process.env["SERVER_HOSTNAME"] || "0.0.0.0"}:${process.env["SERVER_PORT"] || 8080}`);

const router = new Bun.FileSystemRouter({
	style: "nextjs",
	dir: "./server/endpoints",
});

export const httpServer = Bun.serve({
	port: process.env["SERVER_PORT"] || 8080,
	hostname: process.env["SERVER_HOSTNAME"] || "0.0.0.0",
	development: false,
	async fetch(req, server) {
		const url = new URL(req.url);
		const path = url.pathname;
		const ip = server.requestIP(req)?.address;

		Logger.http(`${req.method} - ${ip} - ${path}`);

		if (Number(process.env["METRICS_TYPE"]) >= 1) {
			Metrics.http_requests_total.labels({ method: req.method, endpoint: path }).inc();
		}

		if (req.method === "OPTIONS") {
			const response = new Response();
			response.headers.set("Access-Control-Allow-Origin", "*");
			response.headers.set("Access-Control-Allow-Headers", "*");
			response.headers.set("Access-Control-Allow-Credentials", "true");
			response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
			response.headers.set("Access-Control-Max-Age", "86400");
			return response;
		}

		// TODO: API rate limiter

		const start = process.hrtime();
		const match = router.match(path);
		if (!match) return jsonError(Error.INVALID_ENDPOINT);

		const { src } = match;

		try {
			const module = await import("./endpoints/" + src);
			const res = await module.default(req, match, ip);

			const end = process.hrtime(start);
			if (Number(process.env["METRICS_TYPE"]) >= 2) {
				Metrics.http_request_duration.labels({ endpoint: path }).observe(end[0] * 1000 + end[1] / 1000000);
			}

			res.headers.set("Access-Control-Allow-Origin", "*");
			res.headers.set("Access-Control-Allow-Headers", "*");
			res.headers.set("Access-Control-Allow-Credentials", "true");
			res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
			res.headers.set("Access-Control-Max-Age", "86400");

			return res;
		} catch (err) {
			Logger.error(`[GENERAL] ${err}`);
			return jsonError(Error.UNKNOWN_ERROR);
		}
	},
});
