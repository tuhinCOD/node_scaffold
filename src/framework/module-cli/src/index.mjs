import { Command } from "commander";
import { config } from "dotenv";
import { registerDbCommands } from "./system/engine/db/index.mjs";
import { registerModuleCommands } from "./system/engine/module/index.mjs";
import {
	configureDeployHelp,
	makerCommandPrefix,
	showHelp,
} from "./system/parts/help.mjs";

const args = process.argv.slice(2);
const [command] = args;

config({ path: ".env", quiet: true });

try {
	const program = new Command();
	const namePrefix = makerCommandPrefix();
	program
		.name(namePrefix ? `${namePrefix} module` : "module")
		.allowUnknownOption(true)
		.allowExcessArguments(true)
		.helpOption("-h, --help")
		.addHelpText("beforeAll", "scaffold module maker\n");
	configureDeployHelp(program);

	registerModuleCommands(program, args);
	registerDbCommands(program, args);

	if (!command) {
		showHelp(program);
	} else {
		await program.parseAsync(args, { from: "user" });
	}
} catch (error) {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
}
