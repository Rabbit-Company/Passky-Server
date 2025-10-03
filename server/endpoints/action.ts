import type { Context } from "@rabbit-company/web";
import { Server } from "../server";
import { Settings } from "../settings";
import os from "node:os";
import fs from "fs";
import { Logger } from "../logger";
import Cache from "../caches/cache";

interface LegacyResponse {
	info: string;
	error: number;
}

interface InfoResponse extends LegacyResponse {
	version: string;
	location: string;
}

interface StatsResponse extends LegacyResponse {
	cpu: number;
	cores: number;
	memoryUsed: number;
	memoryTotal: number;
	diskUsed: number;
	diskTotal: number;
}

const legacyHandlers: Record<string, (ctx: Context) => Response | Promise<Response>> = {
	getInfo: getInfo,
	getStats: getStats,
};

Server.app.use("/", (ctx, next) => {
	if (ctx.req.url.includes("?action=")) {
		ctx.header("X-API-Deprecation", "This legacy API will be removed. Please migrate to /v1/*");
		ctx.header("X-API-Deprecation-Date", "2026-01-01");
	}
	return next();
});

Server.app.get("/", async (ctx) => {
	const action = ctx.query().get("action");
	if (!action) {
		return ctx.json(
			{
				info: "No action specified",
				error: 1,
			},
			400
		);
	}

	const handler = legacyHandlers[action];
	if (!handler) {
		return ctx.json(
			{
				info: `Unknown action: ${action}`,
				error: 1,
			},
			400
		);
	}

	try {
		return await handler(ctx);
	} catch (error: any) {
		Logger.error("Legacy API error", { action: action, "error.message": error.message, "error.stack": error.stack });
		return ctx.json(
			{
				info: "Internal server error",
				error: 1,
			},
			500
		);
	}
});

function getInfo(ctx: Context): Response {
	const response: InfoResponse = {
		info: "Successful",
		error: 0,
		version: Settings.SERVER_VERSION,
		location: Settings.SERVER_LOCATION,
	};
	return ctx.json(response);
}

async function getStats(ctx: Context): Promise<Response> {
	const cached = await Cache.getString("server_stats");
	if (cached) {
		return ctx.json(JSON.parse(cached));
	}

	const { bfree, blocks, bsize } = fs.statfsSync("/");
	const diskTotal = blocks * bsize;

	const stats: StatsResponse = {
		error: 0,
		info: "Successful",
		cpu: os.loadavg()[0],
		cores: os.cpus().length,
		memoryUsed: os.totalmem() - os.freemem(),
		memoryTotal: os.totalmem(),
		diskUsed: diskTotal - bfree * bsize,
		diskTotal: diskTotal,
	};

	await Cache.setString("server_stats", JSON.stringify(stats), 5);
	return ctx.json(stats);
}
