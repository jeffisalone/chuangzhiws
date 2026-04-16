import { contentJson, OpenAPIRoute } from "chanfana";
import type { AppContext } from "../../types";
import { decryptEnvelope } from "./crypto";
import { hashPassword } from "./password";
import {
	authErrorSchema,
	authResponseSchema,
	encryptedEnvelopeSchema,
	registerPayloadSchema,
	type RegisterPayload,
} from "./schemas";
import {
	createUser,
	findUserByAccountName,
	findUserByStudentId,
} from "./repository";
import { buildSessionCookie, createSession } from "./session";
import { errorResponse } from "./responses";

export class AuthRegister extends OpenAPIRoute {
	public schema = {
		tags: ["Auth"],
		summary: "Register a user with an encrypted payload",
		request: {
			body: contentJson(encryptedEnvelopeSchema),
		},
		responses: {
			"201": {
				description: "Registered user",
				...contentJson(authResponseSchema),
			},
			"400": {
				description: "Invalid encrypted payload or invalid registration data",
				...contentJson(authErrorSchema),
			},
			"409": {
				description: "Account or student id already exists",
				...contentJson(authErrorSchema),
			},
		},
	};

	public async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		let payload: RegisterPayload;

		try {
			payload = registerPayloadSchema.parse(
				await decryptEnvelope(c.env, data.body),
			);
		} catch {
			return errorResponse(
				c,
				400,
				"INVALID_AUTH_PAYLOAD",
				"Encrypted registration data is invalid",
			);
		}

		const existingAccount = await findUserByAccountName(
			c.env.DB,
			payload.accountName,
		);
		if (existingAccount) {
			return errorResponse(c, 409, "ACCOUNT_EXISTS", "Account name already exists");
		}

		const existingStudent = await findUserByStudentId(c.env.DB, payload.studentId);
		if (existingStudent) {
			return errorResponse(c, 409, "STUDENT_ID_EXISTS", "Student id already exists");
		}

		const password = await hashPassword(payload.password);
		const user = await createUser(c.env.DB, {
			accountName: payload.accountName,
			studentId: payload.studentId,
			realName: payload.realName,
			passwordHash: password.hash,
			passwordSalt: password.salt,
		});
		const session = await createSession(c.env.DB, user.id, false);

		c.header(
			"Set-Cookie",
			buildSessionCookie(session.token, session.maxAge, c.req.url),
		);

		return c.json(
			{
				success: true,
				result: {
					user,
					expiresAt: session.expiresAt,
				},
			},
			201,
		);
	}
}
