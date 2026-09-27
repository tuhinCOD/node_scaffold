import { type AppConfig, appConfig } from "./app.js";
import { type AuthConfig, authConfig } from "./auth.js";
import { type CacheConfig, cacheConfig } from "./cache.js";
import { type CookieConfig, cookieConfig } from "./cookie.js";
import { type CorsConfig, corsConfig } from "./cors.js";
import { type DatabaseConfig, databaseConfig } from "./database";
import { type JwtConfig, jwtConfig } from "./jwt.js";
import { type LoggingConfig, loggingConfig } from "./logging";
import { type MailConfig, mailConfig } from "./mail.js";
import { type OpenApiConfig, openApiConfig } from "./openapi.js";
import { type QueueConfig, queueConfig } from "./queue.js";
import { type RateLimitConfig, rateLimitConfig } from "./rateLimit.js";
import { type RealtimeConfig, realtimeConfig } from "./realtime.js";
import { type RedisConfig, redisConfig } from "./redis.js";

export { appConfig } from "./app.js";
export { authConfig } from "./auth.js";
export { cacheConfig } from "./cache.js";
export { cookieConfig } from "./cookie.js";
export { corsConfig } from "./cors.js";
export { databaseConfig } from "./database";
export { jwtConfig } from "./jwt.js";
export { loggingConfig } from "./logging";
export { mailConfig } from "./mail.js";
export { openApiConfig } from "./openapi.js";
export { queueConfig } from "./queue.js";
export { rateLimitConfig } from "./rateLimit.js";
export { realtimeConfig } from "./realtime.js";
export { redisConfig } from "./redis.js";

export const config = {
	app: appConfig,
	auth: authConfig,
	cache: cacheConfig,
	cookie: cookieConfig,
	cors: corsConfig,
	database: databaseConfig,
	jwt: jwtConfig,
	logging: loggingConfig,
	mail: mailConfig,
	openApi: openApiConfig,
	queue: queueConfig,
	rateLimit: rateLimitConfig,
	realtime: realtimeConfig,
	redis: redisConfig,
} as const;

export type Config = typeof config;
export type {
	AppConfig,
	AuthConfig,
	CacheConfig,
	CookieConfig,
	CorsConfig,
	DatabaseConfig,
	JwtConfig,
	LoggingConfig,
	MailConfig,
	OpenApiConfig,
	QueueConfig,
	RateLimitConfig,
	RealtimeConfig,
	RedisConfig,
};
