import { eq } from "drizzle-orm";
import { db } from "@/database/index";
import { password } from "@/framework/support/password";
import { users } from "@/modules/auth/database/models/user";
import { roles } from "../models/role";

export const table = users;

export default async function UserSeeder() {
	const [adminRole] = await db
		.select({ id: roles.id })
		.from(roles)
		.where(eq(roles.name, "admin"));
	const [userRole] = await db
		.select({ id: roles.id })
		.from(roles)
		.where(eq(roles.name, "user"));

	const rows: (typeof users.$inferInsert)[] = [
		{
			name: "Admin",
			email: "admin@example.com",
			password: await password.hashPassword("123456"),
			roleId: adminRole?.id ?? null,
		},
		{
			name: "User One",
			email: "user@example.com",
			password: await password.hashPassword("123456"),
			roleId: userRole?.id ?? null,
		},
	];

	for (const row of rows) {
		await db.insert(users).values(row).onConflictDoNothing();
	}

	console.log("User seeder completed");
}
