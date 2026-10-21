export function today(): string {
	return new Date().toISOString().slice(0, 10);
}

export function addDays(date: string, amount: number): string {
	const value = new Date(`${date}T00:00:00.000Z`);
	value.setUTCDate(value.getUTCDate() + amount);

	return value.toISOString().slice(0, 10);
}

export function subDays(date: string, amount: number): string {
	return addDays(date, -amount);
}

export function dateOnly(value: unknown): string | null {
	if (value === null || value === undefined) return null;
	if (!(value instanceof Date)) return String(value).slice(0, 10);

	const localMidnight = value.getHours() === 0 && value.getMinutes() === 0 && value.getSeconds() === 0 && value.getMilliseconds() === 0;

	if (!localMidnight) return value.toISOString().slice(0, 10);

	return [String(value.getFullYear()).padStart(4, "0"), String(value.getMonth() + 1).padStart(2, "0"), String(value.getDate()).padStart(2, "0")].join("-");
}
