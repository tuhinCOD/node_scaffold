import { relations } from "drizzle-orm";
import {
	boolean,
	integer,
	pgTable,
	serial,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import { roles } from "./role";

export const users = pgTable("users", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 100 }).notNull(),
	email: varchar("email", { length: 100 }).notNull().unique(),
	password: varchar("password", { length: 255 }).notNull(),
	roleId: integer("role_id").references(() => roles.id, {
		onUpdate: "cascade",
		onDelete: "set null",
	}),
	emailVerifiedAt: timestamp("email_verified_at"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const emailOtps = pgTable("email_otps", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 100 }),
	email: varchar("email", { length: 255 }).notNull(),
	password: varchar("password", { length: 255 }),
	token: varchar("token", { length: 255 }).notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
	id: serial("id").primaryKey(),
	email: varchar("email", { length: 255 }).notNull(),
	token: varchar("token", { length: 255 }).notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const refreshTokens = pgTable("refresh_tokens", {
	id: serial("id").primaryKey(),
	userId: integer("user_id").references(() => users.id, {
		onUpdate: "cascade",
		onDelete: "set null",
	}),
	jti: varchar("jti", { length: 191 }).notNull().unique(),
	revoked: boolean("revoked").default(false),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ one }) => ({
	role: one(roles, {
		fields: [users.roleId],
		references: [roles.id],
	}),
}));
