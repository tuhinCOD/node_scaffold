import { redisConfig } from "./redis.js";

export const rateLimitConfig = {
	windowMs: 60000,
	maxRequests: 500,
	loginMaxRequests: 60,
	keyPrefix: `${redisConfig.prefix}:rl`,
};

export type RateLimitConfig = typeof rateLimitConfig;
