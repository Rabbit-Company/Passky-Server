export interface UserRow {
	user_id: number | bigint;
	username: string;
	email: string;
	password: string;
	"2fa_secret": string | null;
	yubico_otp: string | null;
	backup_codes: string | null;
	max_passwords: number | bigint;
	premium_expires: string | null;
	created: string;
	accessed: string;
}

export interface PasswordRow {
	id: number | bigint;
	website: string;
	username: string;
	password: string;
	message: string;
}

export interface LicenseRow {
	license: string;
	duration: number | bigint;
	created: string;
	used: string | null;
	linked: string | null;
}

export interface EncryptedPasswordInput {
	website: string;
	username: string;
	password: string;
	message: string;
}

export interface ReportRow {
	date: string;
	newcomers: number;
}

export interface AdminAccountRow {
	user_id: number;
	username: string;
	email: string;
	backup_codes: string | null;
	created: string;
	accessed: string;
	passwords: number;
	max_passwords: number;
	premium_expires: string | null;
}

export interface AdminAccountStats {
	accounts: number;
	passwords: number;
	premiumAccounts: number;
}

export interface AdminLicenseStats {
	licenses: number;
	unusedLicenses: number;
}
