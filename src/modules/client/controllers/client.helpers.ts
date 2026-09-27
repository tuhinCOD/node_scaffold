import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import type { UploadedFile } from "express-fileupload";
import { StatusCodes } from "http-status-codes";

export const uploadRoot = path.resolve(process.cwd(), "src/storage/uploads");

export const clientUploadDir = path.join(uploadRoot, "clients");

export const ALLOWED_IMAGE_MIMES: Record<string, string> = {
	"image/jpeg": ".jpg",
	"image/png": ".png",
	"image/webp": ".webp",
	"image/gif": ".gif",
};

export const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

function imageError(message: string) {
	return {
		status: StatusCodes.UNPROCESSABLE_ENTITY,
		message,
		errors: undefined,
	};
}

export async function saveClientImage(file: UploadedFile): Promise<string> {
	const extension = ALLOWED_IMAGE_MIMES[file.mimetype];
	if (!extension) {
		throw imageError("Only jpeg, png, webp or gif images are allowed");
	}

	if (file.size > MAX_IMAGE_SIZE) {
		throw imageError("Image must not exceed 2MB");
	}

	await fs.mkdir(clientUploadDir, { recursive: true });

	const filename = `${Date.now()}-${randomUUID()}${extension}`;
	const destination = path.join(clientUploadDir, filename);

	await file.mv(destination);

	return `/uploads/clients/${filename}`;
}

export async function deleteClientImage(imageUrl?: string | null) {
	if (!imageUrl) return;

	const relative = imageUrl.replace(/^\/uploads\//, "");
	const absolute = path.resolve(uploadRoot, relative);

	if (!absolute.startsWith(path.resolve(uploadRoot))) {
		return;
	}

	try {
		await fs.unlink(absolute);
	} catch {
		// ignore missing files
	}
}
