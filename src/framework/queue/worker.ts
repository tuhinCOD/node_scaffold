import { Worker } from "bullmq";
import nodemailer from "nodemailer";
import { mailConfig } from "@/config";
import logger from "../logger/logger";
import { redis } from "../redis/redis";

const transporter = nodemailer.createTransport({
	host: mailConfig.host,
	port: Number(mailConfig.port) || 587,
	secure: mailConfig.secure === true,
	auth: {
		user: mailConfig.username,
		pass: mailConfig.password,
	},
});

export const emailWorker = new Worker(
	"email",
	async (job) => {
		logger.info(`Processing email job ${job.id}`, {
			to: job.data.to,
			subject: job.data.subject,
		});
		console.log("Processing job:", job.name);

		const { to, subject, text, html } = job.data;

		await transporter.sendMail({
			from: mailConfig.fromAddress,
			to,
			subject,
			text,
			html,
		});

		logger.info(`Email job ${job.id} completed`);
		return { sent: true };
	},
	{
		connection: redis,
	},
);

emailWorker.on("completed", (job) => {
	logger.info(`Email job ${job.id} finished`);
});

emailWorker.on("failed", (job, error) => {
	logger.error(`Email job ${job?.id} failed`, { error: error.message });
});
