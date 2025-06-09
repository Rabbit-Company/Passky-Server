import Metrics from "../metrics";
import Redis from "../caches/redis";
import { Logger } from "../logger";

namespace TaskMetrics {
	export async function run() {
		Logger.silly("[METRICS] Task started");
		await Redis.setString("metrics_cache", Metrics.registry.metricsText(), 864000);
		Logger.silly("[METRICS] Task ended");
	}
}

export default TaskMetrics;
