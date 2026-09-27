import { env } from "@/env.js";

export const appConfig = {
	name: env.APP_NAME,
	environment: env.APP_ENV,
	port: env.APP_PORT,
	url: env.APP_URL,
	frontendUrl: env.FRONTEND_URL,
	frontendEnabled: env.FRONTEND,
};

export type AppConfig = typeof appConfig;
