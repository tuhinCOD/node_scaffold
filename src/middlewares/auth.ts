import { eq } from "drizzle-orm";
import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { db } from "@/database";
import { cookie } from "@/framework/support/cookie";
import { jwt } from "@/framework/support/jwt";
import { refreshTokens, users } from "@/modules/auth/database/models/user.js";

export async function authenticate(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	const accessToken = cookie.getAuth(req);

	if (accessToken) {
		const accessPayload = jwt.verifyToken(accessToken, "access");

		if (accessPayload) {
			const user = await db.query.users.findFirst({
				where: eq(users.id, accessPayload.id as number),
				with: { role: true },
			});

			if (!user) {
				cookie.deleteAuth(res);
				cookie.deleteRefresh(res);
				return res
					.status(StatusCodes.UNAUTHORIZED)
					.json({ message: "Unauthorized" });
			}

			req.auth = {
				...accessPayload,
				id: user.id,
				email: user.email,
				roleId: user.role?.id ?? null,
				role: user.role?.name ?? null,
			};
			return next();
		}
	}

	const refreshToken = cookie.getRefresh(req);

	if (!refreshToken) {
		cookie.deleteAuth(res);
		cookie.deleteRefresh(res);
		return res
			.status(StatusCodes.UNAUTHORIZED)
			.json({ message: "Unauthorized" });
	}

	const refreshPayload = jwt.verifyToken(refreshToken, "refresh");

	if (!refreshPayload?.jti) {
		cookie.deleteAuth(res);
		cookie.deleteRefresh(res);
		return res
			.status(StatusCodes.UNAUTHORIZED)
			.json({ message: "Invalid token" });
	}

	const storedToken = await db.query.refreshTokens.findFirst({
		where: eq(refreshTokens.jti, refreshPayload.jti as string),
	});

	if (!storedToken || storedToken.revoked) {
		cookie.deleteAuth(res);
		cookie.deleteRefresh(res);
		return res
			.status(StatusCodes.UNAUTHORIZED)
			.json({ message: "Invalid token" });
	}

	if (storedToken.expiresAt.getTime() < Date.now()) {
		await db.delete(refreshTokens).where(eq(refreshTokens.id, storedToken.id));
		cookie.deleteAuth(res);
		cookie.deleteRefresh(res);
		return res
			.status(StatusCodes.UNAUTHORIZED)
			.json({ message: "Invalid token" });
	}

	const user = await db.query.users.findFirst({
		where: eq(users.id, refreshPayload.id as number),
		with: { role: true },
	});

	if (!user) {
		cookie.deleteAuth(res);
		cookie.deleteRefresh(res);
		return res
			.status(StatusCodes.UNAUTHORIZED)
			.json({ message: "Unauthorized" });
	}

	const newAccessToken = jwt.generateToken(
		{
			id: user.id,
			email: user.email,
			roleId: user.role?.id ?? null,
			role: user.role?.name ?? null,
		},
		"access",
	);

	cookie.setAuth(res, newAccessToken.token);
	req.auth = {
		id: user.id,
		email: user.email,
		roleId: user.role?.id ?? null,
		role: user.role?.name ?? null,
		type: "access",
	};
	return next();
}
