import { env } from "@/env.js";

export const cookieConfig = {
	name: "app",
	secret: env.COOKIE_SECRET,
};

export type CookieConfig = typeof cookieConfig;
