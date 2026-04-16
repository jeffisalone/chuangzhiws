import { Hono } from "hono";
import { fromHono } from "chanfana";
import { AuthPublicKey } from "./publicKey";
import { AuthRegister } from "./register";
import { AuthLogin } from "./login";
import type { Env } from "../../bindings";

export const authRouter = fromHono(new Hono<{ Bindings: Env }>());

authRouter.get("/public-key", AuthPublicKey);
authRouter.post("/register", AuthRegister);
authRouter.post("/login", AuthLogin);
