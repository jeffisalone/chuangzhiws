import { contentJson, OpenAPIRoute } from "chanfana";
import type { AppContext } from "../../types";
import { decryptEnvelope } from "./crypto";
import { verifyPassword } from "./password";
import {
	authErrorSchema,
	authResponseSchema,
	encryptedEnvelopeSchema,
	loginPayloadSchema,
	type LoginPayload,
} from "./schemas";
import { findUserByAccountName } from "./repository";
import { buildSessionCookie, createSession } from "./session";
import { errorResponse } from "./responses";

export class AuthLogin extends OpenAPIRoute {
	public schema = {
		tags: ["Auth"],
		summary: "Login with an encrypted payload",
		request: {
			body: contentJson(encryptedEnvelopeSchema),
		},
		responses: {
			"200": {
				description: "Logged in user",
				...contentJson(authResponseSchema),
			},
			"400": {
				description: "Invalid encrypted payload or invalid login data",
				...contentJson(authErrorSchema),
			},
			"401": {
				description: "Invalid credentials",
				...contentJson(authErrorSchema),
			},
		},
	};

	public async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		let payload: LoginPayload;

		try {
			payload = loginPayloadSchema.parse(await decryptEnvelope(c.env, data.body));
		} catch {
			return errorResponse(
				c,
				400,
				"INVALID_AUTH_PAYLOAD",
				"Encrypted login data is invalid",
			);
		}

		const user = await findUserByAccountName(c.env.DB, payload.accountName);
		if (!user) {
			return errorResponse(c, 401, "INVALID_CREDENTIALS", "Invalid account or password");
		}

		const passwordMatches = await verifyPassword(
			payload.password,
			user.passwordHash,
			user.passwordSalt,
		);
		if (!passwordMatches) {
			return errorResponse(c, 401, "INVALID_CREDENTIALS", "Invalid account or password");
		}

		const session = await createSession(c.env.DB, user.id, payload.rememberMe);

		c.header(
			"Set-Cookie",
			buildSessionCookie(session.token, session.maxAge, c.req.url),
		);

		return {
			success: true,
			result: {
				user: {
					id: user.id,
					accountName: user.accountName,
					studentId: user.studentId,
					realName: user.realName,
					createdAt: user.createdAt,
				},
				expiresAt: session.expiresAt,
			},
		};
	}
}
