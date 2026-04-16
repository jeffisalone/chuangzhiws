export type Env = Cloudflare.Env & {
	AUTH_PRIVATE_KEY?: string;
	AUTH_PUBLIC_KEY?: string;
	ALLOWED_ORIGIN?: string;
};
