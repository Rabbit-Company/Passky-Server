import { Logger as RabbitLogger } from "@rabbit-company/logger";

export const Logger = new RabbitLogger({
	level: Number(process.env["LOGGER_LEVEL"]) || 3
});