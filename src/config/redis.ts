import { env } from "@/env.js";

export const redisConfig = {
	enabled: env.REDIS,
	url: env.REDIS_URL,
	prefix: env.REDIS_PREFIX,
	commanderPort: 1369,
};

export type RedisConfig = typeof redisConfig;
