import { createServer } from "node:http";
import { appConfig } from "@/config/index.js";

import app from "./app.js";
import { setupSocket } from "./realtime/socket";
import "./queue/worker.js";
import "@/modules/client/jobs/client.js";

const httpServer = createServer(app);

const _io = setupSocket(httpServer);

const PORT = Number(appConfig.port ?? 3000);

httpServer.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
