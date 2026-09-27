import type { Server as HttpServer } from "node:http";
import { Server, type Socket } from "socket.io";
import { appConfig } from "@/config";

let io: Server | null = null;

export const setupSocket = (httpServer: HttpServer) => {
	io = new Server(httpServer, {
		cors: {
			origin: appConfig.frontendUrl ?? "http://localhost:5173",
			credentials: true,
		},
	});

	io.on("connection", (socket: Socket) => {
		console.log(`Socket connected: ${socket.id}`);

		socket.on("disconnect", (reason) => {
			console.log(`Socket disconnected: ${socket.id}`, reason);
		});
	});

	return io;
};

export const getIO = () => io;

export function emit(event: string, data: unknown) {
	io?.emit(event, data);
}
