import { Queue } from "bullmq";

import { redis } from "@/framework/redis/redis.js";

export const clientQueue = new Queue("default", {
	connection: redis,
});

export async function clientJob(data: Record<string, unknown> = {}) {
	return clientQueue.add("client", data);
}
