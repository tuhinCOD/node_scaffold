import { eq } from "drizzle-orm";
import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { db } from "@/database";
import { validate } from "@/framework/http/validate";
import { roles } from "../database/models/role";
import { IdParamsSchema } from "./auth.schema";

export const index = async (_req: Request, res: Response) => {
	const result = await db.query.roles.findMany();

	return res.status(StatusCodes.OK).json({
		message: "Success",
		data: result,
	});
};

export const show = async (req: Request, res: Response) => {
	const { id } = await validate(IdParamsSchema, req.params);

	const result = await db.query.roles.findFirst({
		where: eq(roles.id, Number(id)),
	});

	return res.status(StatusCodes.OK).json({
		message: "Success",
		data: result,
	});
};
