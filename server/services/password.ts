import Cache from "../caches/cache";
import DB from "../databases/database";

export interface Password {
	id: string;
	website: string;
	username: string;
	password: string;
	message: string;
}

export class PasswordService {
	async getPasswords(username: string): Promise<Password[]> {
		const cached = await Cache.getString(`${username}_passwords`);
		if (cached) return JSON.parse(cached);

		const passwords = await DB.connection`
      SELECT
        password_id as id,
        website,
        username,
        password,
        message
      FROM passwords
      WHERE owner = ${username}
    `;

		await Cache.setString(`${username}_passwords`, JSON.stringify(passwords), 60);
		return passwords;
	}
}
