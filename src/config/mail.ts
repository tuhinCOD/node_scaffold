import { env } from "@/env.js";

/**
 * Why: SMTP mail transport settings.
 * When: Transactional mail (signup, reset, verify) is sent.
 * Where: src/config/mail.ts.
 * How: Host, ports, encryption, from address and fail-silent are plain
 *      literals. Username/password are credentials and stay in .env.
 */
export const mailConfig = {
	host: "smtp.gmail.com",
	port: 587,
	encryption: "starttls",
	username: env.MAIL_USERNAME,
	password: env.MAIL_PASSWORD,
	fromAddress: env.MAIL_USERNAME,
	failSilent: true,
	secure: false,
	maildev: {
		smtpPort: 1089,
		webPort: 1080,
	},
};

export type MailConfig = typeof mailConfig;
