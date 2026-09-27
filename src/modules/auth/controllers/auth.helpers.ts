import { createHash, randomBytes } from "node:crypto";
import type { InferSelectModel } from "drizzle-orm";
import { eq } from "drizzle-orm";
import type { Request, Response } from "express";
import { jwtConfig } from "@/config";
import { db } from "@/database";
import { cookie } from "@/framework/support/cookie";
import { jwt } from "@/framework/support/jwt";
import type { roles } from "../database/models/role";
import { refreshTokens, type users } from "../database/models/user";

type SanitizableUser = InferSelectModel<typeof users> & {
	role?: InferSelectModel<typeof roles> | null;
};

export function sanitizeUser(user: SanitizableUser) {
	return {
		id: user.id,
		name: user.name,
		email: user.email,
		emailVerifiedAt: user.emailVerifiedAt ? String(user.emailVerifiedAt) : null,
		roleId: user.roleId ?? null,
		role: user.role || null,
		createdAt: user.createdAt ? String(user.createdAt) : null,
		updatedAt: user.updatedAt ? String(user.updatedAt) : null,
	};
}

// make tokens
export function makeResetToken() {
	return randomBytes(4).toString("hex");
}

export function makeEmailVerificationToken() {
	return randomBytes(4).toString("hex");
}

// verify tokens
export function hashResetToken(token: string) {
	return createHash("sha256").update(token).digest("hex");
}

export function hashEmailVerificationToken(token: string) {
	return createHash("sha256").update(token).digest("hex");
}

export async function revokeCurrentRefreshToken(req: Request) {
	const token = await cookie.getRefresh(req);
	if (!token) return;

	const payload = jwt.verifyToken(token, "refresh");
	if (payload?.jti) {
		await db
			.delete(refreshTokens)
			.where(eq(refreshTokens.jti, payload.jti as string));
	}
}

type UserWithRole = InferSelectModel<typeof users> & {
	role: {
		id: number;
		name: string;
	} | null;
};

export async function issueTokens(
	res: Response,
	user: UserWithRole,
	options?: { remember?: boolean },
) {
	const remember = !!options?.remember;
	const refreshExpiry = remember
		? jwtConfig.refreshRememberExpirySeconds
		: jwtConfig.refreshExpirySeconds;
	const role = user.role || null;
	const accessToken = jwt.generateToken(
		{
			id: user.id,
			email: user.email,
			roleId: role?.id ?? null,
			role: role?.name ?? null,
			remember,
		},
		"access",
	);
	const refreshToken = jwt.generateToken(
		{
			id: user.id,
			email: user.email,
			roleId: role?.id ?? null,
			role: role?.name ?? null,
			remember,
		},
		"refresh",
		refreshExpiry,
	);

	if (refreshToken.jti) {
		await db.insert(refreshTokens).values({
			userId: user.id,
			jti: refreshToken.jti,
			revoked: false,
			expiresAt: new Date(refreshToken.exp * 1000),
		});
	}

	cookie.setAuth(res, accessToken.token);
	cookie.setRefresh(res, refreshToken.token, refreshExpiry);

	return { accessToken: accessToken.token, refreshToken: refreshToken.token };
}
