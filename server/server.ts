import { Web } from "@rabbit-company/web";
import { cors } from "@rabbit-company/web-middleware/cors";
import { logger } from "@rabbit-company/web-middleware/logger";
import Metrics from "./metrics";
import { Logger } from "./logger";
import { jsonError } from "./utils";
import { Error } from "./errors";

export namespace Server {
	export const app = new Web();

	export async function initialize(hostname: string, port: number) {
		app.use(async (ctx, next) => {
			const start = process.hrtime();
			const url = new URL(ctx.req.url);
			const path = url.pathname;

			if (Number(process.env["METRICS_TYPE"]) >= 1) {
				Metrics.http_requests_total.labels({ method: ctx.req.method, endpoint: path }).inc();
			}

			try {
				await next();
			} catch (err) {
				Logger.error(`[GENERAL] ${err}`);
				return jsonError(Error.UNKNOWN_ERROR);
			}

			const end = process.hrtime(start);
			if (Number(process.env["METRICS_TYPE"]) >= 2) {
				Metrics.http_request_duration.labels({ endpoint: path }).observe(end[0] * 1000 + end[1] / 1000000);
			}
		});

		app.use(
			logger({
				logger: Logger,
				logResponses: false,
			})
		);

		app.use(
			cors({
				origin: "*",
				credentials: true,
				allowHeaders: ["*"],
				allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
				maxAge: 86400,
			})
		);

		await import("./endpoints/metrics");

		app.listen({
			hostname: hostname,
			port: port,
		});
	}
}
