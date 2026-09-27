import { relations } from "drizzle-orm";
import { pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { users } from "./user";

export const roles = pgTable("roles", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 100 }).notNull().unique(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const rolesRelations = relations(roles, ({ many }) => ({
	users: many(users),
}));
