import { randomUUID } from "node:crypto";
import jwtLib, { type JwtPayload } from "jsonwebtoken";
import { jwtConfig } from "@/config/index.js";

type TokenType = "access" | "refresh";
interface TokenPayload extends JwtPayload {
	type: TokenType;
}

type JwtCustomPayload = Record<string, unknown>;

export const jwt = {
	generateToken(
		payload: JwtCustomPayload,
		type: TokenType,
		expirySeconds?: number,
	) {
		const now = Math.floor(Date.now() / 1000);
		const exp =
			now +
			(typeof expirySeconds === "number"
				? expirySeconds
				: type === "refresh"
					? jwtConfig.refreshExpirySeconds
					: jwtConfig.accessExpirySeconds);
		const secret =
			type === "refresh" ? jwtConfig.refreshSecret : jwtConfig.accessSecret;
		const jti = type === "refresh" ? randomUUID() : undefined;

		const tokenPayload = {
			...payload,
			type,
			iat: now,
			exp,
			...(jti ? { jti } : {}),
		};
		const token = jwtLib.sign(tokenPayload, secret, {
			algorithm: jwtConfig.algorithm,
		});

		return { token, jti, exp };
	},

	verifyToken(token: string, type: "access" | "refresh") {
		try {
			const secret =
				type === "refresh" ? jwtConfig.refreshSecret : jwtConfig.accessSecret;
			const payload = jwtLib.verify(token, secret, {
				algorithms: [jwtConfig.algorithm],
			}) as TokenPayload;
			return payload.type === type ? payload : null;
		} catch {
			return null;
		}
	},
};
