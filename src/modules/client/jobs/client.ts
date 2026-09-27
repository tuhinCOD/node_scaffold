import { Worker } from "bullmq";

import logger from "@/framework/logger/logger";
import { emit } from "@/framework/realtime/socket.js";
import { redis } from "@/framework/redis/redis.js";

export const clientWorker = new Worker(
	"default",
	async (job) => {
		logger.info(`Processing client job ${job.id}`, { job: job.data });

		const { action, client } = job.data as {
			action: string;
			client: {
				id: number;
				name: string;
				email: string;
			};
		};

		await new Promise((resolve) => setTimeout(resolve, 500));

		emit("client:processed", {
			action,
			client,
			processedAt: new Date(),
		});

		return { action, client };
	},
	{
		connection: redis,
	},
);

clientWorker.on("completed", (job) => {
	logger.info(`Client job ${job.id} completed`);
});

clientWorker.on("failed", (job, error) => {
	logger.error(`Client job ${job?.id} failed`, { error: error.message });
});
