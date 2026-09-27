import { and, asc, desc, eq, like, or, type SQL } from "drizzle-orm";
import type { Request, Response } from "express";
import type { UploadedFile } from "express-fileupload";
import { StatusCodes } from "http-status-codes";
import { db } from "@/database";
import { paginateModel } from "@/framework/database/paginate.js";
import { validate } from "@/framework/http/validate.js";
import logger from "@/framework/logger/logger";
import { emit } from "@/framework/realtime/socket.js";
import { clientJob } from "@/modules/client/console/client.js";
import { cities } from "@/modules/client/database/models/city.js";
import { clients } from "@/modules/client/database/models/client.js";
import { deleteClientImage, saveClientImage } from "./client.helpers.js";
import {
	IdParamsSchema,
	StoreClientSchema,
	UpdateClientSchema,
} from "./client.schema.js";

type ClientWithRelations = NonNullable<Awaited<ReturnType<typeof findClient>>>;

type ClientQuery = {
	findMany: (args: Record<string, unknown>) => Promise<ClientWithRelations[]>;
};

async function findClient(id: number) {
	return db.query.clients.findFirst({
		where: eq(clients.id, id),
		with: {
			city: true,
			owner: {
				columns: {
					id: true,
					name: true,
					email: true,
				},
			},
		},
	});
}

function uploadedImage(req: Request): UploadedFile | undefined {
	const upload = req.files?.image;
	return Array.isArray(upload) ? upload[0] : upload;
}

function handleClientError(res: Response, error: unknown, label: string) {
	if (
		typeof error === "object" &&
		error !== null &&
		"status" in error &&
		"message" in error &&
		"errors" in error
	) {
		const validationError = error as {
			status: number;
			message: string;
			errors: unknown;
		};
		return res.status(validationError.status).json({
			message: validationError.message,
			errors: validationError.errors,
		});
	}

	logger.error(`${label}:`, { error });
	return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: label });
}

/**
 * @swagger
 * /api/client/cities:
 *   get:
 *     tags: [Client]
 *     summary: List cities
 *     description: Returns a list of cities used by client form dropdowns.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: cities fetched successfully
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 */
export const listCities = async (_req: Request, res: Response) => {
	try {
		const result = await db.query.cities.findMany({
			orderBy: asc(cities.name),
		});

		return res.status(StatusCodes.OK).json({
			message: "cities fetched successfully",
			data: result,
		});
	} catch (error) {
		return handleClientError(res, error, "Failed to fetch cities");
	}
};

/**
 * @swagger
 * /api/client:
 *   get:
 *     tags: [Client]
 *     summary: List clients
 *     description: Returns a paginated list of clients with optional search and city filtering.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: per_page
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, email or phone
 *       - in: query
 *         name: city_id
 *         schema:
 *           type: integer
 *         description: Filter by city id
 *     responses:
 *       200:
 *         description: client list fetched successfully
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 */
export const index = async (req: Request, res: Response) => {
	try {
		const search =
			typeof req.query.search === "string" ? req.query.search.trim() : "";
		const cityId = req.query.city_id ? Number(req.query.city_id) : undefined;

		const conditions: SQL[] = [];
		if (search) {
			const searchWhere = or(
				like(clients.name, `%${search}%`),
				like(clients.email, `%${search}%`),
				like(clients.phone, `%${search}%`),
			);
			if (searchWhere) {
				conditions.push(searchWhere);
			}
		}
		if (cityId && Number.isInteger(cityId)) {
			conditions.push(eq(clients.cityId, cityId));
		}
		const where = conditions.length ? and(...conditions) : undefined;

		const pageable = {
			req: {
				query: (key: string) => req.query[key] as string | undefined,
				path: `${req.baseUrl}${req.path}`,
				url: req.originalUrl,
			},
		};

		const result = await paginateModel<ClientWithRelations>(pageable, {
			table: clients,
			query: db.query.clients as unknown as ClientQuery,
			where,
			with: {
				city: true,
				owner: {
					columns: {
						id: true,
						name: true,
						email: true,
					},
				},
			},
			orderBy: desc(clients.id),
		});

		return res.status(StatusCodes.OK).json({
			message: "client list fetched successfully",
			data: result,
		});
	} catch (error) {
		return handleClientError(res, error, "Failed to fetch clients");
	}
};

/**
 * @swagger
 * /api/client/{id}:
 *   get:
 *     tags: [Client]
 *     summary: Show a client
 *     description: Returns a single client by id.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: client fetched successfully
 *       401:
 *         description: Authentication required
 *       404:
 *         description: client not found
 *       500:
 *         description: Internal server error
 */
export const show = async (req: Request, res: Response) => {
	try {
		const { id } = await validate(IdParamsSchema, req.params);

		const client = await findClient(id);
		if (!client) {
			return res
				.status(StatusCodes.NOT_FOUND)
				.json({ message: "client not found" });
		}

		return res.status(StatusCodes.OK).json({
			message: "client fetched successfully",
			data: client,
		});
	} catch (error) {
		return handleClientError(res, error, "Failed to fetch client");
	}
};

/**
 * @swagger
 * /api/client:
 *   post:
 *     tags: [Client]
 *     summary: Create a client
 *     description: Creates a client with an optional image upload. The file is processed through a queue and a realtime event is emitted.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name, email, phone, city_id]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               city_id:
 *                 type: integer
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: client created successfully
 *       401:
 *         description: Authentication required
 *       422:
 *         description: Validation failed or email already exists
 *       500:
 *         description: Internal server error
 */
export const store = async (req: Request, res: Response) => {
	try {
		const auth = req.auth;
		if (!auth?.id) {
			return res
				.status(StatusCodes.UNAUTHORIZED)
				.json({ message: "Authentication required" });
		}

		const body = await validate(StoreClientSchema, req.body);

		const existing = await db.query.clients.findFirst({
			where: eq(clients.email, body.email),
		});
		if (existing) {
			return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
				message: "Email already exists",
			});
		}

		const city = await db.query.cities.findFirst({
			where: eq(cities.id, body.city_id),
		});
		if (!city) {
			return res
				.status(StatusCodes.UNPROCESSABLE_ENTITY)
				.json({ message: "City not found" });
		}

		const file = uploadedImage(req);
		const image = file ? await saveClientImage(file) : null;

		const [inserted] = await db
			.insert(clients)
			.values({
				name: body.name,
				email: body.email,
				phone: body.phone,
				cityId: body.city_id,
				createdBy: auth.id,
				image,
			})
			.returning({ id: clients.id });

		if (!inserted?.id) {
			throw new Error("Failed to resolve inserted client id");
		}

		const client = await findClient(inserted.id);
		if (!client) {
			throw new Error("Inserted client not found");
		}

		await clientJob({
			action: "created",
			client: {
				id: client.id,
				name: client.name,
				email: client.email,
			},
		});

		emit("client:created", { client });

		return res.status(StatusCodes.CREATED).json({
			message: "client created successfully",
			data: client,
		});
	} catch (error) {
		return handleClientError(res, error, "Failed to create client");
	}
};

/**
 * @swagger
 * /api/client/{id}:
 *   put:
 *     tags: [Client]
 *     summary: Update a client
 *     description: Updates client fields and optionally replaces the image upload.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               city_id:
 *                 type: integer
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: client updated successfully
 *       401:
 *         description: Authentication required
 *       404:
 *         description: client not found
 *       422:
 *         description: Validation failed or email already exists
 *       500:
 *         description: Internal server error
 */
export const update = async (req: Request, res: Response) => {
	try {
		const { id } = await validate(IdParamsSchema, req.params);
		const body = await validate(UpdateClientSchema, req.body);

		const existing = await db.query.clients.findFirst({
			where: eq(clients.id, id),
		});
		if (!existing) {
			return res
				.status(StatusCodes.NOT_FOUND)
				.json({ message: "client not found" });
		}

		if (body.email && body.email !== existing.email) {
			const emailTaken = await db.query.clients.findFirst({
				where: eq(clients.email, body.email),
			});
			if (emailTaken) {
				return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
					message: "Email already exists",
				});
			}
		}

		if (body.city_id && body.city_id !== existing.cityId) {
			const city = await db.query.cities.findFirst({
				where: eq(cities.id, body.city_id),
			});
			if (!city) {
				return res
					.status(StatusCodes.UNPROCESSABLE_ENTITY)
					.json({ message: "City not found" });
			}
		}

		const file = uploadedImage(req);
		const image = file ? await saveClientImage(file) : existing.image;

		await db
			.update(clients)
			.set({
				name: body.name ?? existing.name,
				email: body.email ?? existing.email,
				phone: body.phone ?? existing.phone,
				cityId: body.city_id ?? existing.cityId,
				image,
				updatedAt: new Date(),
			})
			.where(eq(clients.id, id));

		const client = await findClient(id);
		if (!client) {
			throw new Error("Updated client not found");
		}

		if (file && existing.image) {
			await deleteClientImage(existing.image);
		}

		await clientJob({
			action: "updated",
			client: {
				id: client.id,
				name: client.name,
				email: client.email,
			},
		});

		emit("client:updated", { client });

		return res.status(StatusCodes.OK).json({
			message: "client updated successfully",
			data: client,
		});
	} catch (error) {
		return handleClientError(res, error, "Failed to update client");
	}
};

/**
 * @swagger
 * /api/client/{id}:
 *   delete:
 *     tags: [Client]
 *     summary: Delete a client
 *     description: Deletes a client and its uploaded image.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: client deleted successfully
 *       401:
 *         description: Authentication required
 *       404:
 *         description: client not found
 *       500:
 *         description: Internal server error
 */
export const destroy = async (req: Request, res: Response) => {
	try {
		const { id } = await validate(IdParamsSchema, req.params);

		const existing = await db.query.clients.findFirst({
			where: eq(clients.id, id),
		});
		if (!existing) {
			return res
				.status(StatusCodes.NOT_FOUND)
				.json({ message: "client not found" });
		}

		await db.delete(clients).where(eq(clients.id, id));
		await deleteClientImage(existing.image);

		await clientJob({
			action: "deleted",
			client: {
				id: existing.id,
				name: existing.name,
				email: existing.email,
			},
		});

		emit("client:deleted", { id: existing.id });

		return res.status(StatusCodes.OK).json({
			message: "client deleted successfully",
			data: { id: existing.id },
		});
	} catch (error) {
		return handleClientError(res, error, "Failed to delete client");
	}
};
