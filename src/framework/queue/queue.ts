import { Queue } from "bullmq";

import { redis } from "../redis/redis";

export const emailQueue = new Queue("email", {
	connection: redis,
	defaultJobOptions: {
		attempts: 3,
		backoff: {
			type: "exponential",
			delay: 2000,
		},
		removeOnComplete: 100,
		removeOnFail: 50,
	},
});
