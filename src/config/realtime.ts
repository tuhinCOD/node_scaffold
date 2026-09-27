import { env } from "@/env.js";

export const realtimeConfig = {
	enabled: env.SOCKET,
	path: "/socket.io",
};

export type RealtimeConfig = typeof realtimeConfig;
