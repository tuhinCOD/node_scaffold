import { Queue } from "bullmq";

import { redis } from "@/framework/redis/redis.js";

export const authQueue = new Queue("default", {
	connection: redis,
});

export async function authJob(data: Record<string, unknown> = {}) {
	return authQueue.add("auth", data);
}
