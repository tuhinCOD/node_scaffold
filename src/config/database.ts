import { env } from "@/env.js";

export const databaseConfig = {
	url: env.DATABASE_URL,
};

export type DatabaseConfig = typeof databaseConfig;

export function detectDialectFrom(
	url: string,
): "sqlite" | "mysql" | "postgresql" {
	const value = url.toLowerCase();
	if (value.startsWith("mysql")) return "mysql";
	if (value.startsWith("postgres")) return "postgresql";
	return "sqlite";
}

export const databaseDialect = detectDialectFrom(databaseConfig.url);
