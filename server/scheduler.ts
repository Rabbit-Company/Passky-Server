import TaskMetrics from "./tasks/metrics";

namespace Scheduler {
	export async function initialize() {
		if (Number(process.env["METRICS_TYPE"]) >= 1) setInterval(() => TaskMetrics.run(), Number(process.env["SCHEDULER_METRICS_INTERVAL"]) * 1000);
	}
}

export default Scheduler;
