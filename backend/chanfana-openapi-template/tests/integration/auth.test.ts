import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";

type PublicKeyResponse = {
	success: true;
	result: {
		publicKey: string;
	};
};

function base64ToBytes(value: string): Uint8Array {
	const binary = atob(value);
	const bytes = new Uint8Array(binary.length);

	for (let i = 0; i < binary.length; i += 1) {
		bytes[i] = binary.charCodeAt(i);
	}

	return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
	let binary = "";
	const chunkSize = 0x8000;

	for (let i = 0; i < bytes.length; i += chunkSize) {
		binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
	}

	return btoa(binary);
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
	const base64 = pem
		.replace(/-----BEGIN [^-]+-----/g, "")
		.replace(/-----END [^-]+-----/g, "")
		.replace(/\s/g, "");

	const bytes = base64ToBytes(base64);
	return bytes.buffer.slice(
		bytes.byteOffset,
		bytes.byteOffset + bytes.byteLength,
	) as ArrayBuffer;
}

async function encryptedBody(payload: Record<string, unknown>) {
	const keyResponse = await SELF.fetch("http://local.test/auth/public-key");
	const keyBody = await keyResponse.json<PublicKeyResponse>();
	const publicKey = await crypto.subtle.importKey(
		"spki",
		pemToArrayBuffer(keyBody.result.publicKey),
		{ name: "RSA-OAEP", hash: "SHA-256" },
		false,
		["encrypt"],
	);
	const aesKey = await crypto.subtle.generateKey(
		{ name: "AES-GCM", length: 256 },
		true,
		["encrypt"],
	);
	const rawAesKey = await crypto.subtle.exportKey("raw", aesKey);
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const ciphertext = await crypto.subtle.encrypt(
		{ name: "AES-GCM", iv },
		aesKey,
		new TextEncoder().encode(JSON.stringify(payload)),
	);
	const encryptedKey = await crypto.subtle.encrypt(
		{ name: "RSA-OAEP" },
		publicKey,
		rawAesKey,
	);

	return JSON.stringify({
		encryptedKey: bytesToBase64(new Uint8Array(encryptedKey)),
		iv: bytesToBase64(iv),
		ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
	});
}

describe("Auth API Integration Tests", () => {
	function numericSuffix(length: number): string {
		let suffix = "";
		while (suffix.length < length) {
			suffix += crypto.getRandomValues(new Uint32Array(1))[0].toString();
		}

		return suffix.slice(0, length);
	}

	it("returns the RSA public key", async () => {
		const response = await SELF.fetch("http://local.test/auth/public-key");
		const body = await response.json<PublicKeyResponse>();

		expect(response.status).toBe(200);
		expect(body.success).toBe(true);
		expect(body.result.publicKey).toContain("BEGIN PUBLIC KEY");
	});

	it("registers and logs in with encrypted payloads", async () => {
		const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
		const accountName = `tester_${suffix}`;
		const studentId = `2026${numericSuffix(7)}`;
		const password = "Password123";
		const registerResponse = await SELF.fetch("http://local.test/auth/register", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: await encryptedBody({
				accountName,
				studentId,
				realName: "Test User",
				password,
			}),
		});
		const registerBody = await registerResponse.json<{
			success: boolean;
			result: { user: { accountName: string } };
		}>();

		expect(registerResponse.status).toBe(201);
		expect(registerResponse.headers.get("Set-Cookie")).toContain("session=");
		expect(registerBody.success).toBe(true);
		expect(registerBody.result.user.accountName).toBe(accountName);

		const loginResponse = await SELF.fetch("http://local.test/auth/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: await encryptedBody({
				accountName,
				password,
				rememberMe: true,
			}),
		});
		const loginBody = await loginResponse.json<{
			success: boolean;
			result: { user: { accountName: string } };
		}>();

		expect(loginResponse.status).toBe(200);
		expect(loginResponse.headers.get("Set-Cookie")).toContain("session=");
		expect(loginBody.success).toBe(true);
		expect(loginBody.result.user.accountName).toBe(accountName);
	});

	it("rejects duplicate account names", async () => {
		const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
		const accountName = `duplicate_${suffix}`;
		const firstStudentId = `3026${numericSuffix(7)}`;
		const secondStudentId = `4026${numericSuffix(7)}`;

		const firstResponse = await SELF.fetch("http://local.test/auth/register", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: await encryptedBody({
				accountName,
				studentId: firstStudentId,
				realName: "First User",
				password: "Password123",
			}),
		});
		expect(firstResponse.status).toBe(201);

		const secondResponse = await SELF.fetch("http://local.test/auth/register", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: await encryptedBody({
				accountName,
				studentId: secondStudentId,
				realName: "Second User",
				password: "Password123",
			}),
		});

		expect(secondResponse.status).toBe(409);
	});

	it("rejects invalid credentials", async () => {
		const response = await SELF.fetch("http://local.test/auth/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: await encryptedBody({
				accountName: "missing-account",
				password: "Password123",
			}),
		});

		expect(response.status).toBe(401);
	});
});
