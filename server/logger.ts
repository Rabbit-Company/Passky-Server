import { Logger as RabbitLogger } from "@rabbit-company/web-middleware/logger";

export const Logger = new RabbitLogger({
	level: parseInt(process.env["LOGGER_LEVEL"] || "4"),
});
