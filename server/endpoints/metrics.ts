import { jsonError } from "../utils";
import { Error } from "../errors";
import { Registry } from "@rabbit-company/openmetrics-client";
import { Server } from "../server";
import { bearerAuth } from "@rabbit-company/web-middleware/bearer-auth";
import Cache from "../caches/cache";

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

	return ctx.text(await Cache.getString(`metrics_cache`), 200, { "Content-Type": Registry.contentType });
});
