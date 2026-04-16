type EncryptedEnvelope = {
  encryptedKey: string
  iv: string
  ciphertext: string
}

type AuthUser = {
  id: number
  accountName: string
  studentId: string
  realName: string
  createdAt: string
}

type AuthResponse = {
  success: true
  result: {
    user: AuthUser
    expiresAt: string
  }
}

type AuthErrorResponse = {
  success: false
  errors?: Array<{
    code: string
    message: string
  }>
}

type PublicKeyResponse = {
  success: true
  result: {
    publicKey: string
  }
}

export type LoginPayload = {
  accountName: string
  password: string
  rememberMe: boolean
}

export type RegisterPayload = {
  accountName: string
  studentId: string
  realName: string
  password: string
}

export class AuthRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
    this.name = 'AuthRequestError'
  }
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'https://d1.0rz.my').replace(
  /\/+$/,
  '',
)

let publicKeyPromise: Promise<CryptoKey> | null = null

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunkSize = 0x8000

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }

  return btoa(binary)
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }

  return bytes
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const base64 = pem
    .replace(/-----BEGIN [^-]+-----/g, '')
    .replace(/-----END [^-]+-----/g, '')
    .replace(/\s/g, '')

  const bytes = base64ToBytes(base64)

  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

async function getPublicKey(): Promise<CryptoKey> {
  publicKeyPromise ??= (async () => {
    const response = await fetch(`${API_BASE_URL}/auth/public-key`, {
      headers: { Accept: 'application/json' },
      credentials: 'include',
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new AuthRequestError('无法获取登录加密公钥', response.status)
    }

    const body = (await response.json()) as PublicKeyResponse

    return crypto.subtle.importKey(
      'spki',
      pemToArrayBuffer(body.result.publicKey),
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      false,
      ['encrypt'],
    )
  })()

  return publicKeyPromise
}

async function encryptPayload(payload: Record<string, unknown>): Promise<EncryptedEnvelope> {
  const publicKey = await getPublicKey()
  const aesKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
    'encrypt',
  ])
  const rawAesKey = await crypto.subtle.exportKey('raw', aesKey)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    new TextEncoder().encode(JSON.stringify(payload)),
  )
  const encryptedKey = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, rawAesKey)

  return {
    encryptedKey: bytesToBase64(new Uint8Array(encryptedKey)),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
  }
}

async function submitAuth(
  path: '/auth/login' | '/auth/register',
  payload: Record<string, unknown>,
  retryWithFreshKey = true,
): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(await encryptPayload(payload)),
  })
  const body = (await response.json()) as AuthResponse | AuthErrorResponse

  if (!response.ok || !body.success) {
    const firstError = !body.success ? body.errors?.[0] : undefined

    if (retryWithFreshKey && response.status === 400 && firstError?.code === 'INVALID_AUTH_PAYLOAD') {
      publicKeyPromise = null
      return submitAuth(path, payload, false)
    }

    const message =
      !body.success && body.errors?.[0]?.message ? body.errors[0].message : '请求失败，请稍后重试'
    throw new AuthRequestError(message, response.status)
  }

  return body
}

export function login(payload: LoginPayload): Promise<AuthResponse> {
  return submitAuth('/auth/login', payload)
}

export function registerUser(payload: RegisterPayload): Promise<AuthResponse> {
  return submitAuth('/auth/register', payload)
}
