import type { SupportedCryptoAlgorithms } from "bun";
import Validate from "./validate";
import Errors, { Error } from "./errors";
import Redis from "./caches/redis";

export function jsonResponse(json: object, statusCode = 200) {
	return new Response(JSON.stringify(json), {
		headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
		status: statusCode,
	});
}

export function jsonError(error: number) {
	return new Response(JSON.stringify(Errors.getJson(error)), {
		headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
		status: Errors.get(error).httpCode,
		statusText: Errors.get(error).message,
	});
}

export async function generateHash(message: string, algorithm: SupportedCryptoAlgorithms) {
	const hasher = new Bun.CryptoHasher(algorithm);
	hasher.update(message);
	return hasher.digest("hex");
}

export function getBearerToken(req: Request): string | null {
	const authHeader = req.headers.get("authorization");
	if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
	return authHeader.split(" ")[1];
}

export function basicAuthentication(req: Request): { user: string; pass: string } | null {
	const Authorization = req.headers.get("Authorization") || "";
	const [scheme, encoded] = Authorization.split(" ");
	if (!encoded || scheme !== "Basic") return null;
	const buffer = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
	const decoded = new TextDecoder().decode(buffer).normalize();

	const index = decoded.indexOf(":");
	if (index === -1 || /[\0-\x1F\x7F]/.test(decoded)) return null;

	return { user: decoded.substring(0, index), pass: decoded.substring(index + 1) };
}

export function generateRandomText(length: number): string {
	const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	const keyArray = new Uint8Array(length);
	(crypto as any).getRandomValues(keyArray);

	let apiKey = "";
	for (let i = 0; i < keyArray.length; i++) {
		const index = keyArray[i] % charset.length;
		apiKey += charset[index];
	}

	return apiKey;
}

function toBuffer(input: string | Buffer | Uint8Array): Buffer | Uint8Array {
	if (typeof input === "string") return Buffer.from(input);
	return input;
}

export function timingSafeEqual(a: string | Buffer | Uint8Array, b: string | Buffer | Uint8Array): boolean {
	const bufA = toBuffer(a);
	const bufB = toBuffer(b);

	if (bufA.length !== bufB.length) return false;

	let result = 0;
	for (let i = 0; i < bufA.length; i++) {
		result |= bufA[i] ^ bufB[i];
	}

	return result === 0;
}

export async function authenticateUser(req: Request, ip: string | undefined): Promise<{ user: string; error: Response | null }> {
	const auth = basicAuthentication(req);
	if (auth === null) return { user: "", error: jsonError(Error.MISSING_USERNAME_AND_TOKEN) };

	if (!Validate.username(auth.user)) return { user: "", error: jsonError(Error.INVALID_USERNAME) };
	if (!Validate.token(auth.pass)) return { user: "", error: jsonError(Error.INVALID_TOKEN) };

	const hashedIP = await generateHash(ip || "", "sha256");
	const token = await Redis.getString(`token_${auth.user}_${hashedIP}`);
	if (!Validate.token(token)) return { user: "", error: jsonError(Error.TOKEN_EXPIRED) };
	if (!timingSafeEqual(auth.pass, token as string)) return { user: "", error: jsonError(Error.TOKEN_EXPIRED) };

	return { user: auth.user, error: null };
}
