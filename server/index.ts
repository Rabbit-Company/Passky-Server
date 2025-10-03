import Cache from "./caches/cache";
import DB from "./databases/database";
import Scheduler from "./scheduler";
import { Logger } from "./logger";
import { Server } from "./server";

await Cache.initialize();
await DB.initialize();
await Scheduler.initialize();

const hostname = process.env["SERVER_HOSTNAME"] || "0.0.0.0";
const port = parseInt(process.env["SERVER_PORT"] || "8080");

await Server.initialize(hostname, port);

Logger.info(`[HS] HTTP Server listening on port ${hostname}:${port}`);
