import { sha256Base64Url, randomBase64Url } from "./crypto";

const ONE_DAY_SECONDS = 24 * 60 * 60;
const SESSION_SECONDS = ONE_DAY_SECONDS;
const REMEMBER_ME_SECONDS = 30 * ONE_DAY_SECONDS;

export async function createSession(
	db: D1Database,
	userId: number,
	rememberMe: boolean,
): Promise<{ token: string; expiresAt: string; maxAge: number }> {
	const token = randomBase64Url(32);
	const tokenHash = await sha256Base64Url(token);
	const maxAge = rememberMe ? REMEMBER_ME_SECONDS : SESSION_SECONDS;
	const expiresAt = new Date(Date.now() + maxAge * 1000).toISOString();

	await db
		.prepare(
			`INSERT INTO sessions (user_id, token_hash, expires_at)
			 VALUES (?, ?, ?)`,
		)
		.bind(userId, tokenHash, expiresAt)
		.run();

	return { token, expiresAt, maxAge };
}

export function buildSessionCookie(
	token: string,
	maxAge: number,
	requestUrl: string,
): string {
	const parts = [
		`session=${encodeURIComponent(token)}`,
		"Path=/",
		"HttpOnly",
		"SameSite=Lax",
		`Max-Age=${maxAge}`,
	];

	if (new URL(requestUrl).protocol === "https:") {
		parts.push("Secure");
	}

	return parts.join("; ");
}
