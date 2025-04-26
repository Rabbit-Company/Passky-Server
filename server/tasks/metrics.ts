import Logger from "@rabbit-company/logger";
import Metrics from "../metrics";
import Redis from "../caches/redis";
import { httpServer } from "..";

namespace TaskMetrics {
	export async function run() {
		Logger.silly("[METRICS] Task started");
		Metrics.http_concurrent_requests_total.set(httpServer.pendingRequests);
		await Redis.setString("metrics_cache", Metrics.registry.metricsText(), 864000);
		Logger.silly("[METRICS] Task ended");
	}
}

export default TaskMetrics;
