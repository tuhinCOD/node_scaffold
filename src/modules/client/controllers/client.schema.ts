import { z } from "zod";

export const StoreClientSchema = z.object({
	name: z.string().min(2).max(100),
	email: z.email(),
	phone: z.string().min(7).max(30),
	city_id: z.coerce.number().int().positive(),
});

export const UpdateClientSchema = StoreClientSchema.partial();

export const IdParamsSchema = z.object({
	id: z.coerce.number().int().positive(),
});

export const CitySchema = z.object({
	id: z.number,
	name: z.string(),
	createdAt: z.string().nullable().optional(),
	updatedAt: z.string().nullable().optional(),
});

export const ClientUserSchema = z.object({
	id: z.number,
	name: z.string(),
	email: z.email(),
});

export const ClientSchema = z.object({
	id: z.number,
	name: z.string(),
	email: z.email(),
	phone: z.string(),
	cityId: z.number(),
	createdBy: z.number(),
	image: z.string().nullable().optional(),
	createdAt: z.string().nullable().optional(),
	updatedAt: z.string().nullable().optional(),
	city: CitySchema.nullable().optional(),
	owner: ClientUserSchema.nullable().optional(),
});

export const ClientListSchema = z.object({
	message: z.string(),
	data: z.array(ClientSchema),
});

export const ClientDetailSchema = z.object({
	message: z.string(),
	data: ClientSchema,
});
