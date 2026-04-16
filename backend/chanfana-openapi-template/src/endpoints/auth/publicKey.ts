import { contentJson, OpenAPIRoute } from "chanfana";
import type { AppContext } from "../../types";
import { getPublicKeyPem } from "./crypto";
import { publicKeyResponseSchema, authErrorSchema } from "./schemas";
import { errorResponse } from "./responses";

export class AuthPublicKey extends OpenAPIRoute {
	public schema = {
		tags: ["Auth"],
		summary: "Get the RSA public key used to encrypt auth payloads",
		responses: {
			"200": {
				description: "RSA public key",
				...contentJson(publicKeyResponseSchema),
			},
			"500": {
				description: "Auth encryption is not configured",
				...contentJson(authErrorSchema),
			},
		},
	};

	public async handle(c: AppContext) {
		try {
			const publicKey = await getPublicKeyPem(c.env);

			return {
				success: true,
				result: {
					algorithm: "RSA-OAEP-256/AES-GCM" as const,
					publicKey,
				},
			};
		} catch {
			return errorResponse(
				c,
				500,
				"AUTH_KEY_NOT_CONFIGURED",
				"Auth encryption keys are not configured",
			);
		}
	}
}
