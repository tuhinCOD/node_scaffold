import { redisConfig } from "./redis.js";

export const cacheConfig = {
	ttlSeconds: 3600,
	keyPrefix: `${redisConfig.prefix}:cache`,
};

export type CacheConfig = typeof cacheConfig;
