import type { AuthUser } from "./schemas";

type UserRow = {
	id: number;
	account_name: string;
	student_id: string;
	real_name: string;
	password_hash: string;
	password_salt: string;
	created_at: string;
};

export type UserWithPassword = AuthUser & {
	passwordHash: string;
	passwordSalt: string;
};

function toAuthUser(row: UserRow): AuthUser {
	return {
		id: row.id,
		accountName: row.account_name,
		studentId: row.student_id,
		realName: row.real_name,
		createdAt: row.created_at,
	};
}

export async function findUserByAccountName(
	db: D1Database,
	accountName: string,
): Promise<UserWithPassword | null> {
	const row = await db
		.prepare(
			`SELECT id, account_name, student_id, real_name, password_hash, password_salt, created_at
			 FROM users
			 WHERE account_name = ?`,
		)
		.bind(accountName)
		.first<UserRow>();

	if (!row) {
		return null;
	}

	return {
		...toAuthUser(row),
		passwordHash: row.password_hash,
		passwordSalt: row.password_salt,
	};
}

export async function findUserByStudentId(
	db: D1Database,
	studentId: string,
): Promise<AuthUser | null> {
	const row = await db
		.prepare(
			`SELECT id, account_name, student_id, real_name, password_hash, password_salt, created_at
			 FROM users
			 WHERE student_id = ?`,
		)
		.bind(studentId)
		.first<UserRow>();

	return row ? toAuthUser(row) : null;
}

export async function createUser(
	db: D1Database,
	input: {
		accountName: string;
		studentId: string;
		realName: string;
		passwordHash: string;
		passwordSalt: string;
	},
): Promise<AuthUser> {
	const result = await db
		.prepare(
			`INSERT INTO users (account_name, student_id, real_name, password_hash, password_salt)
			 VALUES (?, ?, ?, ?, ?)`,
		)
		.bind(
			input.accountName,
			input.studentId,
			input.realName,
			input.passwordHash,
			input.passwordSalt,
		)
		.run();
	const userId = Number(result.meta.last_row_id);
	const row = await db
		.prepare(
			`SELECT id, account_name, student_id, real_name, password_hash, password_salt, created_at
			 FROM users
			 WHERE id = ?`,
		)
		.bind(userId)
		.first<UserRow>();

	if (!row) {
		throw new Error("Created user could not be loaded");
	}

	return toAuthUser(row);
}
