import { Worker } from "bullmq";

import { redis } from "@/framework/redis/redis.js";

export const authWorker = new Worker(
	"default",
	async (job) => {
		console.log("Processing job:", job.name, job.data);
	},
	{
		connection: redis,
	},
);

authWorker.on("completed", (job) => {
	console.log(`Job ${job.id} completed`);
});

authWorker.on("failed", (job, error) => {
	console.error(`Job ${job?.id} failed:`, error);
});
