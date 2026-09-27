import { and, eq, gt, lt } from "drizzle-orm";
import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { authConfig, jwtConfig } from "@/config";
import { db } from "@/database";
import { validate } from "@/framework/http/validate.js";
import logger from "@/framework/logger/logger";
import { dispatchEvent } from "@/framework/queue/events";
import { cookie } from "@/framework/support/cookie";
import { jwt } from "@/framework/support/jwt";
import { password } from "@/framework/support/password";
import { urls } from "@/framework/support/url";
import {
	ForgotPasswordSchema,
	LoginSchema,
	RegisterSchema,
	ResetPasswordByTokenSchema,
	ResetPasswordSchema,
	VerifyEmailSchema,
	VerifyResetOtpSchema,
} from "@/modules/auth/controllers/auth.schema.js";
import { roles } from "../database/models/role.js";
import {
	emailOtps,
	passwordResetTokens,
	refreshTokens,
	users,
} from "../database/models/user.js";
import {
	hashEmailVerificationToken,
	hashResetToken,
	issueTokens,
	makeEmailVerificationToken,
	makeResetToken,
	revokeCurrentRefreshToken,
	sanitizeUser,
} from "./auth.helpers.js";

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     description: Creates a user account. If email verification is required, an OTP is emailed instead of returning tokens.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, password_confirmation]
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               password_confirmation:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully (with tokens when verification is disabled)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                     access_token:
 *                       type: string
 *                     refresh_token:
 *                       type: string
 *                     token_type:
 *                       type: string
 *                       example: Bearer
 *       422:
 *         description: Email already exists or validation failed
 *       500:
 *         description: Internal server error
 */
export const register = async (req: Request, res: Response) => {
	try {
		const body = await validate(RegisterSchema, req.body);

		const defaultRole = await db.query.roles.findFirst({
			where: eq(roles.name, "user"),
		});

		const existingUser = await db.query.users.findFirst({
			where: eq(users.email, body.email),
		});

		if (existingUser) {
			return res
				.status(StatusCodes.UNPROCESSABLE_ENTITY)
				.json({ message: "Email already exists" });
		}

		const hashedPassword = await password.hashPassword(body.password);

		if (authConfig.requireEmailVerification) {
			const plainToken = makeEmailVerificationToken();
			const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

			await db.delete(emailOtps).where(eq(emailOtps.email, body.email));
			await db.insert(emailOtps).values({
				name: body.name,
				email: body.email,
				password: hashedPassword,
				token: hashEmailVerificationToken(plainToken),
				expiresAt,
				createdAt: new Date(),
			});

			const verifyUrl = urls.url(
				`/verify-email?token=${plainToken}&email=${encodeURIComponent(body.email)}`,
			);
			await dispatchEvent(
				"user:verify-email",
				{
					to: body.email,
					subject: "Verify your email address",
					text: `Hi ${body.name}, please verify your email: ${verifyUrl}`,
					html: `<p>Hi ${body.name},</p><p>Your verification OTP is ${plainToken}. It expires very soon.</p>`,
				},
				{ queue: "email" },
			);

			return res.status(StatusCodes.CREATED).json({
				message:
					"User registered successfully. Please verify your email before logging in.",
			});
		}

		const [insertedUser] = await db
			.insert(users)
			.values({
				name: body.name,
				email: body.email,
				password: hashedPassword,
				roleId: defaultRole?.id ?? null,
			})
			.returning({ id: users.id });

		const insertedId = insertedUser?.id;
		if (!insertedId) {
			throw new Error("Failed to resolve inserted user id");
		}

		const user = await db.query.users.findFirst({
			where: eq(users.id, insertedId),
			with: { role: true },
		});

		if (!user) throw new Error("Inserted user not found");

		await revokeCurrentRefreshToken(req);
		const tokens = await issueTokens(res, user);
		await dispatchEvent(
			"user:signup",
			{
				to: user.email,
				subject: "Welcome!",
				text: `Hi ${user.name}, welcome to our platform!`,
				html: `<p>Hi ${user.name},</p><p>Welcome to our platform!</p>`,
			},
			{ queue: "email" },
		);

		return res.status(StatusCodes.CREATED).json({
			message: "User registered successfully",
			data: {
				user: sanitizeUser(user),
				access_token: tokens.accessToken,
				refresh_token: tokens.refreshToken,
				token_type: "Bearer",
			},
		});
	} catch (error: unknown) {
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

		logger.error("Register error:", { error });
		return res
			.status(StatusCodes.INTERNAL_SERVER_ERROR)
			.json({ message: "Failed to register user" });
	}
};

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in a user
 *     description: Authenticates with email and password and returns access/refresh tokens.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               remember:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       200:
 *         description: Logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                     access_token:
 *                       type: string
 *                     refresh_token:
 *                       type: string
 *                     token_type:
 *                       type: string
 *                       example: Bearer
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Email not verified
 *       500:
 *         description: Internal server error
 */
export const login = async (req: Request, res: Response) => {
	try {
		const body = await validate(LoginSchema, req.body);

		const user = await db.query.users.findFirst({
			where: eq(users.email, body.email),
			with: { role: true },
		});

		if (
			!user ||
			!(await password.verifyPassword(body.password, user.password))
		) {
			return res
				.status(StatusCodes.UNAUTHORIZED)
				.json({ message: "Invalid credentials" });
		}

		if (authConfig.requireEmailVerification && !user.emailVerifiedAt) {
			return res.status(StatusCodes.FORBIDDEN).json({
				message: "Please verify your email before logging in",
			});
		}

		await revokeCurrentRefreshToken(req);
		const tokens = await issueTokens(res, user);

		return res.status(StatusCodes.OK).json({
			message: "User logged in successfully",
			data: {
				user: sanitizeUser(user),
				access_token: tokens.accessToken,
				refresh_token: tokens.refreshToken,
				token_type: "Bearer",
			},
		});
	} catch (error) {
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

		logger.error("Login error:", { error });
		return res
			.status(StatusCodes.INTERNAL_SERVER_ERROR)
			.json({ message: "Failed to login" });
	}
};

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get authenticated user
 *     description: Returns the profile of the currently authenticated user.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Authenticated user fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       401:
 *         description: Authentication required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
export const me = async (req: Request, res: Response) => {
	try {
		const auth = req.auth;
		if (!auth?.id) {
			return res
				.status(StatusCodes.UNAUTHORIZED)
				.json({ message: "Authentication required" });
		}

		const user = await db.query.users.findFirst({
			where: eq(users.id, auth.id),
			with: { role: true },
		});

		if (!user) {
			return res
				.status(StatusCodes.NOT_FOUND)
				.json({ message: "User not found" });
		}

		return res.status(StatusCodes.OK).json({
			message: "Authenticated user fetched successfully",
			data: sanitizeUser(user),
		});
	} catch (error) {
		logger.error("Me error:", { error });
		return res
			.status(StatusCodes.INTERNAL_SERVER_ERROR)
			.json({ message: "Failed to fetch user" });
	}
};

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Log out the current user
 *     description: Revokes the current refresh token and clears auth cookies.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       500:
 *         description: Internal server error
 */
export const logout = async (req: Request, res: Response) => {
	try {
		await revokeCurrentRefreshToken(req);
		cookie.deleteAuth(res);
		cookie.deleteRefresh(res);
		return res
			.status(StatusCodes.OK)
			.json({ message: "Logged out successfully" });
	} catch (error) {
		logger.error("Logout error:", { error });
		cookie.deleteAuth(res);
		cookie.deleteRefresh(res);
		return res
			.status(StatusCodes.INTERNAL_SERVER_ERROR)
			.json({ message: "Failed to logout" });
	}
};

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password reset OTP
 *     description: Sends a reset OTP to the given email if the account exists (response is the same regardless).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Reset OTP sent (if the email exists)
 *       422:
 *         description: Validation failed
 *       500:
 *         description: Internal server error
 */
export const forgotPassword = async (req: Request, res: Response) => {
	try {
		const body = await validate(ForgotPasswordSchema, req.body);

		await db
			.delete(passwordResetTokens)
			.where(
				and(
					eq(passwordResetTokens.email, body.email),
					lt(passwordResetTokens.expiresAt, new Date()),
				),
			);

		const user = await db.query.users.findFirst({
			where: eq(users.email, body.email),
		});
		if (!user) {
			return res.status(StatusCodes.OK).json({
				message: "If this email exists, a reset link has been sent",
			});
		}

		const plainToken = makeResetToken();
		const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

		await db
			.delete(passwordResetTokens)
			.where(eq(passwordResetTokens.email, user.email));
		await db.insert(passwordResetTokens).values({
			email: user.email,
			token: hashResetToken(plainToken),
			expiresAt,
			createdAt: new Date(),
		});

		await dispatchEvent(
			"user:forget-password",
			{
				to: user.email,
				subject: "Reset your password",
				text: `Hi ${user.name}, your reset password OTP is ${plainToken}. It expires very soon.`,
				html: `<p>Hi ${user.name},</p><p>Your reset password OTP is <strong>${plainToken}</strong>. It expires very soon.</p>`,
			},
			{ queue: "email" },
		);

		return res.status(StatusCodes.OK).json({
			message: "If this email exists, an OTP has been sent",
		});
	} catch (error: unknown) {
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

		logger.error("Forget password error:", { error });
		return res
			.status(StatusCodes.INTERNAL_SERVER_ERROR)
			.json({ message: "Failed to forget password request" });
	}
};

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Change password while authenticated
 *     description: Changes the password of the authenticated user after verifying the current password.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [current_password, password, password_confirmation]
 *             properties:
 *               current_password:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 6
 *               password_confirmation:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         description: Authentication required or current password is incorrect
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
export const resetPassword = async (req: Request, res: Response) => {
	try {
		const auth = req.auth;

		if (!auth?.id) {
			return res.status(StatusCodes.UNAUTHORIZED).json({
				message: "Authentication required",
			});
		}

		const body = await validate(ResetPasswordSchema, req.body);

		const user = await db.query.users.findFirst({
			where: eq(users.id, auth.id),
		});

		if (!user) {
			return res.status(StatusCodes.NOT_FOUND).json({
				message: "User not found",
			});
		}

		const currentPasswordValid = await password.verifyPassword(
			body.current_password,
			user.password,
		);

		if (!currentPasswordValid) {
			return res.status(StatusCodes.UNAUTHORIZED).json({
				message: "Current password is incorrect",
			});
		}

		await db
			.update(users)
			.set({
				password: await password.hashPassword(body.password),
				updatedAt: new Date(),
			})
			.where(eq(users.id, user.id));

		await db
			.update(refreshTokens)
			.set({ revoked: true })
			.where(eq(refreshTokens.userId, user.id));

		cookie.deleteAuth(res);
		cookie.deleteRefresh(res);

		return res.status(StatusCodes.OK).json({
			message: "Password changed successfully",
		});
	} catch (error: unknown) {
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

		logger.error("Reset password error:", { error });
		return res
			.status(StatusCodes.INTERNAL_SERVER_ERROR)
			.json({ message: "Failed to change password" });
	}
};

/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     tags: [Auth]
 *     summary: Verify email with OTP
 *     description: Confirms a pending registration using the emailed OTP token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, token]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verified successfully (or verification not required)
 *       422:
 *         description: Invalid or expired verification token
 *       500:
 *         description: Internal server error
 */
export const verifyEmail = async (req: Request, res: Response) => {
	try {
		const body = await validate(VerifyEmailSchema, req.body);

		if (!authConfig.requireEmailVerification) {
			return res.status(StatusCodes.OK).json({
				message: "Email verification is not required",
			});
		}

		const record = await db.query.emailOtps.findFirst({
			where: and(
				eq(emailOtps.email, body.email),
				eq(emailOtps.token, hashEmailVerificationToken(body.token)),
				gt(emailOtps.expiresAt, new Date()),
			),
		});

		if (!record) {
			return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
				message: "Invalid or expired verification token",
			});
		}

		const defaultRole = await db.query.roles.findFirst({
			where: eq(roles.name, "user"),
		});

		const [insertedUser] = await db
			.insert(users)
			.values({
				name: record.name ?? "",
				email: record.email,
				password: record.password ?? "",
				roleId: defaultRole?.id ?? null,
				emailVerifiedAt: new Date(),
			})
			.returning({ id: users.id });

		if (!insertedUser?.id) {
			throw new Error("Failed to create user after email verification");
		}

		await db.delete(emailOtps).where(eq(emailOtps.email, body.email));

		return res
			.status(StatusCodes.OK)
			.json({ message: "Email verified successfully" });
	} catch (error: unknown) {
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

		logger.error("Veriffy email error:", { error });
		return res
			.status(StatusCodes.INTERNAL_SERVER_ERROR)
			.json({ message: "Failed to verify email" });
	}
};

/**
 * @swagger
 * /api/auth/verify-reset-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Verify password reset OTP
 *     description: Validates the reset OTP and returns a reset URL for setting a new password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, token]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     reset_url:
 *                       type: string
 *                       format: uri
 *                     email:
 *                       type: string
 *       422:
 *         description: Invalid or expired verification token
 *       500:
 *         description: Internal server error
 */
export const verifyResetOtp = async (req: Request, res: Response) => {
	try {
		const body = await validate(VerifyResetOtpSchema, req.body);

		const record = await db.query.passwordResetTokens.findFirst({
			where: and(
				eq(passwordResetTokens.email, body.email),
				eq(passwordResetTokens.token, hashResetToken(body.token)),
				gt(passwordResetTokens.expiresAt, new Date()),
			),
		});

		if (!record) {
			return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
				message: "Invalid or expired verification token",
			});
		}

		const user = await db.query.users.findFirst({
			where: eq(users.email, record.email),
		});

		const resetUrl = urls.url(
			`/reset-password?token=${body.token}&email=${encodeURIComponent(record.email)}`,
		);

		if (user) {
			await dispatchEvent(
				"user:forget-password",
				{
					to: user.email,
					subject: "Reset your password",
					text: `Hi ${user.name}, reset your password by clicking the link below:\n\n${resetUrl}`,
					html: `<p>Hi ${user.name},</p><p>Reset your password by clicking the link below:</p><p><a href="${resetUrl}">Reset Password</a></p>`,
				},
				{ queue: "email" },
			);
		}

		return res.status(StatusCodes.OK).json({
			message: "OTP verified successfully",
			data: {
				reset_url: resetUrl,
				email: record.email,
			},
		});
	} catch (error: unknown) {
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

		logger.error("Verify reset otp error:", { error });
		return res
			.status(StatusCodes.INTERNAL_SERVER_ERROR)
			.json({ message: "Failed to verify OTP" });
	}
};

/**
 * @swagger
 * /api/auth/reset-password-by-token:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password using OTP
 *     description: Sets a new password using the validated reset OTP token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, token, password, password_confirmation]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 6
 *               password_confirmation:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       404:
 *         description: User not found
 *       422:
 *         description: Invalid or expired reset link, or validation failed
 *       500:
 *         description: Internal server error
 */
export const resetPasswordByToken = async (req: Request, res: Response) => {
	try {
		const body = await validate(ResetPasswordByTokenSchema, req.body);

		const record = await db.query.passwordResetTokens.findFirst({
			where: and(
				eq(passwordResetTokens.email, body.email),
				eq(passwordResetTokens.token, hashResetToken(body.token)),
				gt(passwordResetTokens.expiresAt, new Date()),
			),
		});

		if (!record) {
			return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
				message: "Invalid or expired reset link",
			});
		}

		const user = await db.query.users.findFirst({
			where: eq(users.email, record.email),
		});

		if (!user) {
			return res.status(StatusCodes.NOT_FOUND).json({
				message: "User not found",
			});
		}

		await db
			.update(users)
			.set({
				password: await password.hashPassword(body.password),
				updatedAt: new Date(),
			})
			.where(eq(users.id, user.id));

		await db
			.delete(passwordResetTokens)
			.where(eq(passwordResetTokens.id, record.id));

		await db
			.update(refreshTokens)
			.set({ revoked: true })
			.where(eq(refreshTokens.userId, user.id));

		cookie.deleteAuth(res);
		cookie.deleteRefresh(res);

		return res.status(StatusCodes.OK).json({
			message: "Password reset successfully",
		});
	} catch (error: unknown) {
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

		logger.error("Reset password by token error:", { error });
		return res
			.status(StatusCodes.INTERNAL_SERVER_ERROR)
			.json({ message: "Failed to reset password" });
	}
};

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 *     description: Exchanges a valid refresh token for a new access/refresh token pair.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refresh_token]
 *             properties:
 *               refresh_token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                     access_token:
 *                       type: string
 *                     refresh_token:
 *                       type: string
 *                     token_type:
 *                       type: string
 *                       example: Bearer
 *       401:
 *         description: Invalid, revoked, or expired refresh token
 *       500:
 *         description: Internal server error
 */
export const refreshToken = async (req: Request, res: Response) => {
	try {
		const body = req.body;
		const payload = jwt.verifyToken(body.refresh_token, "refresh");

		if (!payload?.jti) {
			return res
				.status(StatusCodes.UNAUTHORIZED)
				.json({ message: "Invalid refresh token" });
		}

		const storedToken = await db.query.refreshTokens.findFirst({
			where: eq(refreshTokens.jti, payload.jti as string),
		});

		if (!storedToken || storedToken.revoked) {
			return res.status(StatusCodes.UNAUTHORIZED).json({
				message: "Refresh token revoked",
			});
		}

		if (storedToken.expiresAt.getTime() < Date.now()) {
			await db
				.delete(refreshTokens)
				.where(eq(refreshTokens.id, storedToken.id));
			return res.status(StatusCodes.UNAUTHORIZED).json({
				message: "Refresh token expired",
			});
		}

		const user = await db.query.users.findFirst({
			where: eq(users.id, payload.id as number),
			with: { role: true },
		});
		if (!user) {
			return res
				.status(StatusCodes.UNAUTHORIZED)
				.json({ message: "User not found" });
		}

		const remember = !!payload.remember;
		const refreshExpiry = remember
			? jwtConfig.refreshRememberExpirySeconds
			: undefined;
		const accessToken = jwt.generateToken(
			{
				id: user.id,
				email: user.email,
				roleId: user.role?.id,
				role: user.role?.name,
				remember,
			},
			"access",
		);
		const newRefreshToken = jwt.generateToken(
			{
				id: user.id,
				email: user.email,
				roleId: user.role?.id,
				role: user.role?.name,
				remember,
			},
			"refresh",
			refreshExpiry,
		);

		await db
			.update(refreshTokens)
			.set({
				jti: newRefreshToken.jti as string,
				expiresAt: new Date(newRefreshToken.exp * 1000),
				revoked: false,
			})
			.where(eq(refreshTokens.id, storedToken.id));

		cookie.setAuth(res, accessToken.token);
		cookie.setRefresh(res, newRefreshToken.token, refreshExpiry);

		return res.status(StatusCodes.OK).json({
			message: "Token refreshed successfully",
			data: {
				user: sanitizeUser(user),
				access_token: accessToken.token,
				refresh_token: newRefreshToken.token,
				token_type: "Bearer",
			},
		});
	} catch (error) {
		logger.error("Refresh token error:", { error });
		return res.status(StatusCodes.UNAUTHORIZED).json({
			message: "Invalid or expired refresh token",
		});
	}
};
