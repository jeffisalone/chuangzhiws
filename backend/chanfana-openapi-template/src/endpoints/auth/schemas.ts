import { z } from "zod";

export const encryptedEnvelopeSchema = z.object({
	encryptedKey: z.string().min(1),
	iv: z.string().min(1),
	ciphertext: z.string().min(1),
});

export const publicKeyResponseSchema = z.object({
	success: z.literal(true),
	result: z.object({
		algorithm: z.literal("RSA-OAEP-256/AES-GCM"),
		publicKey: z.string(),
	}),
});

export const authUserSchema = z.object({
	id: z.number().int(),
	accountName: z.string(),
	studentId: z.string(),
	realName: z.string(),
	createdAt: z.string(),
});

export const authResponseSchema = z.object({
	success: z.literal(true),
	result: z.object({
		user: authUserSchema,
		expiresAt: z.string(),
	}),
});

export const authErrorSchema = z.object({
	success: z.literal(false),
	errors: z.array(
		z.object({
			code: z.string(),
			message: z.string(),
		}),
	),
});

export const registerPayloadSchema = z.object({
	accountName: z.string().trim().min(2).max(32),
	studentId: z.string().regex(/^\d{11}$/),
	realName: z.string().trim().min(1).max(64),
	password: z
		.string()
		.min(8)
		.max(128)
		.regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/),
});

export const loginPayloadSchema = z.object({
	accountName: z.string().trim().min(1).max(32),
	password: z.string().min(1).max(128),
	rememberMe: z.boolean().optional().default(false),
});

export type EncryptedEnvelope = z.infer<typeof encryptedEnvelopeSchema>;
export type RegisterPayload = z.infer<typeof registerPayloadSchema>;
export type LoginPayload = z.infer<typeof loginPayloadSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;
