export function makerCommandPrefix() {
	const ua = String(process.env.npm_config_user_agent || "").toLowerCase();
	if (ua.startsWith("yarn/")) return "yarn";
	if (ua.startsWith("bun/")) return "bun";
	if (ua.startsWith("npm/")) return "npm run";
	return "";
}

export function configureDeployHelp(program) {
	program.configureHelp({
		subcommandTerm(cmd) {
			const flags = cmd.options
				.map((option) => option.flags.split(" ")[0])
				.filter((flag) => flag.startsWith("--"))
				.join("|");
			const args = cmd.registeredArguments
				.map((arg) => humanReadableArgName(arg))
				.join(" ");
			return (
				cmd.name() + (flags ? ` [${flags}]` : "") + (args ? ` ${args}` : "")
			);
		},
	});
}

function humanReadableArgName(arg) {
	const nameOutput = arg.name() + (arg.variadic === true ? "..." : "");
	return arg.required ? `<${nameOutput}>` : `[${nameOutput}]`;
}

export function showHelp(program) {
	program.outputHelp();
}
