import type { MatchedRoute } from "bun";
import { getBearerToken, jsonError } from "../utils";
import { Error } from "../errors";
import Redis from "../caches/redis";
import { Registry } from "@rabbit-company/openmetrics-client";

export default async function handleMetrics(req: Request, _match: MatchedRoute | null, _ip: string | undefined): Promise<Response> {
	if (req.method !== "GET" || Number(process.env["METRICS_TYPE"]) < 1) return jsonError(Error.INVALID_ENDPOINT);

	const token = process.env["METRICS_TOKEN"];
	if (token !== "none") {
		const bearer = getBearerToken(req);
		if (bearer === null) return jsonError(Error.BEARER_TOKEN_MISSING);
		if (bearer !== token) return jsonError(Error.INVALID_API_SECRET_KEY);
	}

	return new Response(await Redis.getString(`metrics_cache`), { headers: { "Content-Type": Registry.contentType } });
}
