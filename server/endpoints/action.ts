import type { Context } from "@rabbit-company/web";
import { Server } from "../server";
import { Settings } from "../settings";

Server.app.get("/", async (ctx) => {
	const params = ctx.query();

	const action = params.get("action");
	switch (action) {
		case "getInfo":
			return getInfo(ctx);
		default:
			break;
	}
});

function getInfo(ctx: Context<Record<string, unknown>>): Response {
	return ctx.json({
		info: "Successful",
		error: 0,
		version: Settings.SERVER_VERSION,
		location: Settings.SERVER_LOCATION,
	});
}
