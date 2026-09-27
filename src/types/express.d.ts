import "express";

declare global {
	namespace Express {
		interface Request {
			auth?: {
				id?: number;
				email?: string;
				roleId?: number | null;
				role?: string | null;
				remember?: boolean;
				type?: string;
			} | null;
		}
	}
}
