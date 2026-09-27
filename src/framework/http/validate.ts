import type { z } from "zod";

export async function validate<T extends z.ZodTypeAny>(
	schema: T,
	data: unknown,
): Promise<z.infer<T>> {
	const result = await schema.safeParseAsync(data);

	if (!result.success) {
		throw {
			status: 422,
			message: "Validation failed",
			errors: result.error.flatten(),
		};
	}

	return result.data;
}
