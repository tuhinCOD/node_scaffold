import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { databaseConfig } from "@/config";
import * as schema from "./schema";

const { Pool } = pg;

const pool = new Pool({
	connectionString: databaseConfig.url,
});

export const db = drizzle({
	client: pool,
	schema,
});
