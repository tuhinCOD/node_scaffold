import { db } from "@/database/index.js";
import { roles } from "@/modules/auth/database/models/role.js";

export const table = roles;

export default async function RoleSeeder() {
	await db
		.insert(roles)
		.values([{ name: "admin" }, { name: "user" }])
		.onConflictDoNothing();

	console.log("Role seeder completed");
}
