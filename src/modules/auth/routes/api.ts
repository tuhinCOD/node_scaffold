import { Router } from "express";
import { authenticate } from "@/middlewares/auth.js";
import {
	forgotPassword,
	login,
	logout,
	me,
	refreshToken,
	register,
	resetPassword,
	resetPasswordByToken,
	verifyEmail,
	verifyResetOtp,
} from "@/modules/auth/controllers/auth.controller.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, me);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", authenticate, resetPassword);
router.post("/verify-email", verifyEmail);
router.post("/verify-reset-otp", verifyResetOtp);
router.post("/reset-password-by-token", resetPasswordByToken);
router.post("/refresh-token", refreshToken);

export default router;
