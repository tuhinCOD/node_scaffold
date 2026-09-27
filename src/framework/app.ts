import path from "node:path";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { StatusCodes } from "http-status-codes";
import { appConfig, cookieConfig } from "@/config";

import { httpLogger } from "../middlewares/httpLogger";
import authRouter from "../modules/auth/routes/api.js";
import roleRouter from "../modules/auth/routes/role.js";
import clientRouter from "../modules/client/routes/api.js";
import { configureOpenApi } from "./http/openapi";
import logger from "./logger/logger";

const uploadRoot = path.resolve(process.cwd(), "src/storage/uploads");

const app = express();

app.use(
	cors({
		origin: appConfig.frontendUrl ?? "http://localhost:5173",
		credentials: true,
	}),
);

app.use(httpLogger);

app.use(express.json());
app.use("/uploads", express.static(uploadRoot));
configureOpenApi(app);
app.use(cookieParser(cookieConfig.secret));

app.use("/api/auth", authRouter);
app.use("/api/auth", roleRouter);
app.use("/api/client", clientRouter);

app.use(
	(
		err: unknown,
		_req: express.Request,
		res: express.Response,
		_next: express.NextFunction,
	) => {
		logger.error("Unhandled error", { error: err });
		res
			.status(StatusCodes.INTERNAL_SERVER_ERROR)
			.json({ message: "Internal server error" });
	},
);

export default app;
