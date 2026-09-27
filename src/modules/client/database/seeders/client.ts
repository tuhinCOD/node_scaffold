import { db } from "@/database/index.js";
import { cities } from "@/modules/client/database/models/city.js";
import { clients } from "@/modules/client/database/models/client.js";

export const table = clients;

const cityNames = [
	"Dhaka",
	"Chattogram",
	"Khulna",
	"Rajshahi",
	"Sylhet",
	"Barishal",
	"Rangpur",
	"Mymensingh",
	"Cumilla",
	"Gazipur",
	"Bogra",
	"Narayanganj",
];

export default async function ClientSeeder() {
	const existingCities = await db.select().from(cities);
	if (!existingCities.length) {
		await db.insert(cities).values(cityNames.map((name) => ({ name })));
		console.log("Client seeder: cities seeded");
	}

	const rows: (typeof clients.$inferInsert)[] = [
		// Add your seed data here
		// Example:
		// { name: "Client 1", email: "client1@example.com", phone: "1234567890", cityId: 1 },
	];

	for (const row of rows) {
		await db.insert(clients).values(row);
	}

	console.log("Client seeder completed");
}
