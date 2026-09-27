import { Queue } from "bullmq";
import { redis } from "../redis/redis";

const queues = new Map<string, Queue>();

function getQueue(name: string): Queue {
	let queue = queues.get(name);
	if (!queue) {
		queue = new Queue(name, { connection: redis });
		queues.set(name, queue);
	}
	return queue;
}

export async function dispatchEvent(
	event: string,
	data: Record<string, unknown>,
	options?: { queue?: string },
): Promise<void> {
	const queueName = options?.queue ?? "default";
	await getQueue(queueName).add(event, data);
}
