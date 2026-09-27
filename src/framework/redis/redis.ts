import IORedis from "ioredis";
import { redisConfig } from "@/config";
import logger from "../logger/logger";

export const redis = new IORedis(redisConfig.url ?? "redis://localhost:6379", {
	maxRetriesPerRequest: null,
});

redis.on("connect", () => {
	logger.info("Redis connected");
});

redis.on("error", (err) => {
	logger.error("Redis error", { message: err.message });
});
