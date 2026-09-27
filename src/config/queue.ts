import { redisConfig } from "./redis.js";

export const queueConfig = {
	queues: ["default", "mail", "maintenance"],
	concurrency: 10,
	autoPruneQueues: true,
	prefix: `${redisConfig.prefix}:queue`,
	durablePrefix: `${redisConfig.prefix}:durable`,
	queueUi: "/queues",
	allowedEmails: "",
};

export type QueueConfig = typeof queueConfig;
