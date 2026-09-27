import { relations } from "drizzle-orm";
import { integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { users } from "../../../auth/database/models/user.js";
import { cities } from "./city";

export const clients = pgTable("clients", {
	id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
	name: varchar("name", { length: 100 }).notNull(),
	email: varchar("email", { length: 100 }).notNull().unique(),
	phone: varchar("phone", { length: 30 }).notNull(),
	cityId: integer("city_id")
		.references(() => cities.id, {
			onUpdate: "cascade",
			onDelete: "restrict",
		})
		.notNull(),
	createdBy: integer("created_by")
		.references(() => users.id, {
			onUpdate: "cascade",
			onDelete: "set null",
		})
		.notNull(),
	image: varchar("image", { length: 255 }),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const clientsRelations = relations(clients, ({ one }) => ({
	city: one(cities, {
		fields: [clients.cityId],
		references: [cities.id],
	}),
	owner: one(users, {
		fields: [clients.createdBy],
		references: [users.id],
	}),
}));
