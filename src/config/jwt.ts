import { env } from "@/env.js";

export const jwtConfig = {
	accessSecret: env.JWT_ACCESS_SECRET,
	refreshSecret: env.JWT_REFRESH_SECRET,
	accessExpirySeconds: 900,
	refreshExpirySeconds: 3600,
	refreshRememberExpirySeconds: 604800,
	algorithm: "HS256" as const,
};

export type JwtConfig = typeof jwtConfig;
