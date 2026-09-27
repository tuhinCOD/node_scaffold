import { showHelp } from "../../parts/help.mjs";
import { assertName as assertNameLeaf } from "../../parts/naming.mjs";
import {
	dbCheck,
	dbGenerate,
	dbMigrate,
	dbPush,
	dbStudio,
	generateSchema,
	listMigrations,
	runSeeder,
} from "./core.mjs";

let args = [];
let command = "",
	firstArg = "",
	secondArg = "";
let dbProgram = null;

function assertName(value, label) {
	try {
		return assertNameLeaf(value, label);
	} catch {
		console.error(`${label} is required.`);
		showHelp(dbProgram);
		process.exit(1);
	}
}

const handlers = {
	schema: () => generateSchema(),
	generate: () => dbGenerate(),
	migrate: async () => {
		await dbMigrate();
		if (args.includes("--seed")) await runSeeder("");
	},
	"migrate:run": () => dbMigrate(),
	push: () => dbPush(),
	check: () => dbCheck(),
	studio: () => dbStudio(),
	seed: async () => {
		const possibleModule = command?.startsWith("db:") ? firstArg : secondArg;
		const moduleName =
			possibleModule && !possibleModule.startsWith("--") ? possibleModule : "";
		await runSeeder(moduleName);
	},
	"module:seed": async () => {
		const moduleName = assertName(secondArg, "Module name");
		await runSeeder(moduleName);
	},
	status: () => listMigrations(),
};

export function registerDbCommands(program, rawArgs) {
	dbProgram = program;
	args = rawArgs;
	command = rawArgs[0] || "";
	firstArg = rawArgs[1] || "";
	secondArg = rawArgs[2] || "";
	program
		.command("db [subcommand]")
		.description(
			"Run database operations (schema, generate, migrate, seed, etc.)",
		)
		.allowUnknownOption(true)
		.action(async (subcommand) => {
			const handler = handlers[subcommand];
			if (handler) return await handler();
			console.error(`Unknown db command: ${subcommand || ""}`);
			showHelp(dbProgram);
			process.exit(1);
		});

	const cmd = (name, desc, opts = []) => {
		const c = program
			.command(`db:${name}`)
			.description(desc)
			.allowUnknownOption(true);
		for (const o of opts) c.option(o.flag, o.description);
		c.action(handlers[name]);
	};

	cmd("schema", "Regenerate src/database/schema/index.ts from module models");
	cmd("generate", "Generate Drizzle migrations after schema discovery");
	cmd("migrate", "Generate then run Drizzle migrations", [
		{ flag: "--seed", description: "Run seeders after migration" },
	]);
	cmd("migrate:run", "Run existing Drizzle migrations only");
	cmd("seed", "Run all seeders or one module seeder set");
	cmd("module:seed", "Run seeders for a specific module");
	cmd("status", "Show generated migration files");
	cmd("push", "Run drizzle-kit push after schema discovery");
	cmd("check", "Run drizzle-kit check after schema discovery");
	cmd("studio", "Open Drizzle Studio after schema discovery", [
		{ flag: "--quiet", description: "Suppress output" },
	]);
}
