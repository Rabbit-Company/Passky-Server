import { jsonError } from "../utils";
import { Error } from "../errors";
import Redis from "../caches/redis";
import { Registry } from "@rabbit-company/openmetrics-client";
import { Server } from "../server";
import { bearerAuth } from "@rabbit-company/web-middleware/bearer-auth";

Server.app.use(
	"GET",
	"/metrics",
	bearerAuth({
		skip() {
			if (Number(process.env["METRICS_TYPE"]) < 1) return true;
			return process.env["METRICS_TOKEN"] === "none";
		},
		validate(token) {
			return process.env["METRICS_TOKEN"] === token;
		},
	})
);

Server.app.get("/metrics", async (ctx) => {
	if (Number(process.env["METRICS_TYPE"]) < 1) return jsonError(Error.INVALID_ENDPOINT);

	ctx.header("Content-Type", Registry.contentType);
	return ctx.text(await Redis.getString(`metrics_cache`));
});
