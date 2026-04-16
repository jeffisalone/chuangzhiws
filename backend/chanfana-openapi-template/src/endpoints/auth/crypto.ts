import type { Env } from "../../bindings";
import type { EncryptedEnvelope } from "./schemas";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

let generatedKeyPairPromise: Promise<CryptoKeyPair> | undefined;
let generatedPublicKeyPemPromise: Promise<string> | undefined;
let importedPrivateKeyPromise: Promise<CryptoKey> | undefined;

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

function arrayBufferToPem(buffer: ArrayBuffer, label: string): string {
	const base64 = bytesToBase64(new Uint8Array(buffer));
	const lines = base64.match(/.{1,64}/g)?.join("\n") ?? base64;

	return `-----BEGIN ${label}-----\n${lines}\n-----END ${label}-----`;
}

async function getGeneratedKeyPair(): Promise<CryptoKeyPair> {
	generatedKeyPairPromise ??= crypto.subtle.generateKey(
		{
			name: "RSA-OAEP",
			modulusLength: 2048,
			publicExponent: new Uint8Array([1, 0, 1]),
			hash: "SHA-256",
		},
		true,
		["encrypt", "decrypt"],
	);

	return generatedKeyPairPromise;
}

async function getPrivateKey(env: Env): Promise<CryptoKey> {
	if (!env.AUTH_PRIVATE_KEY) {
		const keyPair = await getGeneratedKeyPair();
		return keyPair.privateKey;
	}

	importedPrivateKeyPromise ??= crypto.subtle.importKey(
		"pkcs8",
		pemToArrayBuffer(env.AUTH_PRIVATE_KEY),
		{ name: "RSA-OAEP", hash: "SHA-256" },
		false,
		["decrypt"],
	);

	return importedPrivateKeyPromise;
}

export async function getPublicKeyPem(env: Env): Promise<string> {
	if (env.AUTH_PUBLIC_KEY) {
		return env.AUTH_PUBLIC_KEY;
	}

	if (env.AUTH_PRIVATE_KEY) {
		throw new Error("AUTH_PUBLIC_KEY is required when AUTH_PRIVATE_KEY is configured");
	}

	generatedPublicKeyPemPromise ??= (async () => {
		const keyPair = await getGeneratedKeyPair();
		const exported = await crypto.subtle.exportKey("spki", keyPair.publicKey);
		return arrayBufferToPem(exported, "PUBLIC KEY");
	})();

	return generatedPublicKeyPemPromise;
}

export async function decryptEnvelope<T>(
	env: Env,
	envelope: EncryptedEnvelope,
): Promise<T> {
	try {
		const privateKey = await getPrivateKey(env);
		const encryptedKey = base64ToBytes(envelope.encryptedKey);
		const iv = base64ToBytes(envelope.iv);
		const ciphertext = base64ToBytes(envelope.ciphertext);

		const rawAesKey = await crypto.subtle.decrypt(
			{ name: "RSA-OAEP" },
			privateKey,
			encryptedKey,
		);
		const aesKey = await crypto.subtle.importKey(
			"raw",
			rawAesKey,
			{ name: "AES-GCM" },
			false,
			["decrypt"],
		);
		const plaintext = await crypto.subtle.decrypt(
			{ name: "AES-GCM", iv },
			aesKey,
			ciphertext,
		);

		return JSON.parse(textDecoder.decode(plaintext)) as T;
	} catch {
		throw new Error("Invalid encrypted payload");
	}
}

export async function sha256Base64Url(value: string): Promise<string> {
	const digest = await crypto.subtle.digest("SHA-256", textEncoder.encode(value));

	return bytesToBase64(new Uint8Array(digest))
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/g, "");
}

export function randomBase64Url(byteLength: number): string {
	const bytes = crypto.getRandomValues(new Uint8Array(byteLength));

	return bytesToBase64(bytes)
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/g, "");
}
