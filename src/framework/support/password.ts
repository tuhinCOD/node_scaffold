import bcrypt from "bcryptjs";

export const password = {
	async hashPassword(inputPassword: string) {
		return await bcrypt.hash(inputPassword, 10);
	},

	async verifyPassword(inputPassword: string, hashedPassword: string) {
		return await bcrypt.compare(inputPassword, hashedPassword);
	},
};
