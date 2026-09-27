import { assertName } from "../../parts/naming.mjs";
import { runSeeder } from "../db/core.mjs";
import {
	assertModuleHasSeeders,
	deleteModule,
	listModules,
	makeConsole,
	makeController,
	makeJob,
	makeModel,
	makeModule,
	makeRoute,
	makeSeeder,
} from "./core.mjs";

export function registerModuleCommands(program, rawArgs) {
	program
		.command("module:make <name>")
		.description(
			"Create a module with controller, route, model, seeder, job, and console folders",
		)
		.allowUnknownOption(true)
		.action(async (name) => makeModule(name));
	program
		.command("module:make-route <module> [name]")
		.description("Generate a route file for an existing module")
		.option("--force", "Overwrite existing route file")
		.option("--dry-run", "Print what would be created without executing")
		.allowUnknownOption(true)
		.action(async (moduleName, name) =>
			makeRoute(moduleName, name, rawArgs.slice(3)),
		);
	program
		.command("module:make-controller <module> [name]")
		.description("Generate a controller for an existing module")
		.option("--force", "Overwrite existing controller file")
		.option("--dry-run", "Print what would be created without executing")
		.allowUnknownOption(true)
		.action(async (moduleName, name) =>
			makeController(moduleName, name, rawArgs.slice(3)),
		);
	program
		.command("module:make-model <module> [name]")
		.description("Generate a model file and register it in the schema barrel")
		.option("--force", "Overwrite existing model file")
		.option("--dry-run", "Print what would be created without executing")
		.allowUnknownOption(true)
		.action(async (moduleName, name) =>
			makeModel(moduleName, name, rawArgs.slice(3)),
		);
	program
		.command("module:make-seeder <module> [name]")
		.description("Generate a seeder file for an existing module model")
		.option("--force", "Overwrite existing seeder file")
		.option("--dry-run", "Print what would be created without executing")
		.allowUnknownOption(true)
		.action(async (moduleName, name) =>
			makeSeeder(moduleName, name, rawArgs.slice(3)),
		);
	program
		.command("module:make-job <module> [name]")
		.description("Generate a bullmq worker/job file for an existing module")
		.option("--force", "Overwrite existing job file")
		.option("--dry-run", "Print what would be created without executing")
		.allowUnknownOption(true)
		.action(async (moduleName, name) =>
			makeJob(moduleName, name, rawArgs.slice(3)),
		);
	program
		.command("module:make-console <module> [name]")
		.description("Generate a bullmq queue/producer file for an existing module")
		.option("--force", "Overwrite existing console file")
		.option("--dry-run", "Print what would be created without executing")
		.allowUnknownOption(true)
		.action(async (moduleName, name) =>
			makeConsole(moduleName, name, rawArgs.slice(3)),
		);
	program
		.command("module:list")
		.description("List all discovered modules")
		.allowUnknownOption(true)
		.action(async () => listModules());
	program
		.command("module:seed <module>")
		.description("Run the seeders for one module")
		.allowUnknownOption(true)
		.action(async (moduleName) => {
			const normalized = assertName(moduleName, "Module name");
			await assertModuleHasSeeders(normalized);
			await runSeeder(normalized);
		});
	program
		.command("module:delete <name>")
		.description("Permanently delete a module and unregister its model exports")
		.option("--yes", "Confirm deletion without prompt")
		.option("--dry-run", "Print what would be deleted without executing")
		.allowUnknownOption(true)
		.action(async (name) => deleteModule(name, rawArgs.slice(2)));
}
