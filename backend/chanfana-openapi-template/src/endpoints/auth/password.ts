const textEncoder = new TextEncoder();
const PASSWORD_HASH_ITERATIONS = 150000;

function bytesToBase64(bytes: Uint8Array): string {
	let binary = "";
	const chunkSize = 0x8000;

	for (let i = 0; i < bytes.length; i += chunkSize) {
		binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
	}

	return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
	const binary = atob(value);
	const bytes = new Uint8Array(binary.length);

	for (let i = 0; i < binary.length; i += 1) {
		bytes[i] = binary.charCodeAt(i);
	}

	return bytes;
}

async function derivePasswordHash(
	password: string,
	salt: Uint8Array,
): Promise<ArrayBuffer> {
	const passwordKey = await crypto.subtle.importKey(
		"raw",
		textEncoder.encode(password),
		"PBKDF2",
		false,
		["deriveBits"],
	);

	return crypto.subtle.deriveBits(
		{
			name: "PBKDF2",
			hash: "SHA-256",
			salt,
			iterations: PASSWORD_HASH_ITERATIONS,
		},
		passwordKey,
		256,
	);
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array): boolean {
	if (left.length !== right.length) {
		return false;
	}

	let diff = 0;
	for (let i = 0; i < left.length; i += 1) {
		diff |= left[i] ^ right[i];
	}

	return diff === 0;
}

export async function hashPassword(password: string): Promise<{
	hash: string;
	salt: string;
}> {
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const hash = new Uint8Array(await derivePasswordHash(password, salt));

	return {
		hash: bytesToBase64(hash),
		salt: bytesToBase64(salt),
	};
}

export async function verifyPassword(
	password: string,
	expectedHash: string,
	salt: string,
): Promise<boolean> {
	const actualHash = new Uint8Array(
		await derivePasswordHash(password, base64ToBytes(salt)),
	);

	return constantTimeEqual(actualHash, base64ToBytes(expectedHash));
}
