import { relations } from "drizzle-orm";
import { pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { clients } from "./client";

export const cities = pgTable("cities", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 100 }).notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const citiesRelations = relations(cities, ({ many }) => ({
	clients: many(clients),
}));
