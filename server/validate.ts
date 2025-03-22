namespace Validate {
	export function username(username: string | null | undefined): boolean {
		if (typeof username !== "string") return false;
		return /^([a-z0-9._]{6,30})$/.test(username);
	}

	export function email(email: string | null | undefined): boolean {
		if (typeof email !== "string") return false;
		return /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(email);
	}

	export function password(password: string | null | undefined): boolean {
		if (typeof password !== "string") return false;
		return /^([a-z0-9]{128})$/.test(password);
	}

	export function uuid(uuid: string | null | undefined): boolean {
		if (typeof uuid !== "string") return false;
		return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
	}

	export function token(token: string | null | undefined): boolean {
		if (typeof token !== "string") return false;
		return token.length === 128;
	}

	export function expiration(expiration: bigint | number | null | undefined): boolean {
		if (typeof expiration !== "bigint" && typeof expiration !== "number") return false;
		return Number(expiration) > Date.now();
	}
}

export default Validate;
